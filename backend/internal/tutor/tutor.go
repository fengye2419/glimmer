package tutor

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"

	"glimmer/internal/model"
	"glimmer/internal/store"
)

// 讲题状态机：采用 SocraticMATH（ECNU-ICALK，CIKM 2024）验证过的四阶段对话策略。
// INIT → REVIEW（回顾/澄清题意） → HEURISTIC（启发式提问） → WAIT_STUDENT（等待作答）
//      → RECTIFICATION（发现错误时反问纠错，不直接给答案） → SUMMARIZATION（总结回扣薄弱技能） → DONE
const (
	StateInit          = "INIT"
	StateReview        = "REVIEW"
	StateHeuristic     = "HEURISTIC"
	StateWaitStudent   = "WAIT_STUDENT"
	StateRectification = "RECTIFICATION"
	StateSummarization = "SUMMARIZATION"
	StateDone          = "DONE"
)

// maxHeuristicTurns：启发阶段的最多学生轮数，超过后进入总结阶段。
const maxHeuristicTurns = 4

// stageFor 根据当前学生作答轮数，决定下一条 AI 回复所处的教学阶段。
func stageFor(sess *model.TutorSession) string {
	userTurns := 0
	for _, m := range sess.Messages {
		if m.Role == "user" {
			userTurns++
		}
	}
	switch {
	case userTurns == 0:
		return StateReview
	case userTurns >= maxHeuristicTurns:
		return StateSummarization
	default:
		return StateHeuristic
	}
}

// stageGuidance 返回当前阶段对 LLM 的具体行为约束（注入 system prompt）。
func stageGuidance(stage string) string {
	switch stage {
	case StateReview:
		return "【当前阶段：回顾】先帮学生读懂题意，确认已知条件和所求，必要时澄清概念。只提一个问题。"
	case StateSummarization:
		return "【当前阶段：总结】学生已接近解决，带他回顾刚才的思路，归纳这道题用到的关键方法，并点出对应的薄弱技能。"
	default:
		return "【当前阶段：启发/纠错】用一个启发式问题引导学生迈出下一步；" +
			"若学生上一条回答有错误，进入纠错：不要直接指出对错或给答案，而是用反问让他自己发现矛盾。"
	}
}

type Engine struct {
	store       store.Store
	ollamaURL   string
	ollamaModel string
	httpClient  *http.Client
	// fewShot：可选的 SocraticMATH few-shot 示例文本（仅 debug 时由环境变量启用）。
	fewShot string
}

type ollamaTagsResp struct {
	Models []struct {
		Name string `json:"name"`
	} `json:"models"`
}

type ollamaChatResp struct {
	Message struct {
		Role     string `json:"role"`
		Content  string `json:"content"`
		Thinking string `json:"thinking"`
	} `json:"message"`
	Error string `json:"error"`
	Done  bool   `json:"done"`
}

func NewEngine(s store.Store, ollamaURL, model string) *Engine {
	if ollamaURL == "" {
		ollamaURL = "http://localhost:11434"
	}
	return &Engine{
		store:       s,
		ollamaURL:   ollamaURL,
		ollamaModel: model,
		httpClient:  &http.Client{Timeout: 180 * time.Second},
		fewShot:     loadFewShotFromEnv(),
	}
}

func (e *Engine) listModels() []string {
	resp, err := e.httpClient.Get(e.ollamaURL + "/api/tags")
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	var tags ollamaTagsResp
	if json.NewDecoder(resp.Body).Decode(&tags) != nil {
		return nil
	}
	var names []string
	for _, m := range tags.Models {
		names = append(names, m.Name)
	}
	return names
}

// resolveModel picks configured model, or falls back to first locally available one.
func (e *Engine) resolveModel() (string, error) {
	models := e.listModels()
	if len(models) == 0 {
		return "", fmt.Errorf("ollama 无可用模型，请先执行 ollama pull")
	}
	if e.ollamaModel != "" {
		for _, name := range models {
			if name == e.ollamaModel {
				return name, nil
			}
		}
	}
	return models[0], nil
}

func (e *Engine) Healthy() bool {
	_, err := e.resolveModel()
	return err == nil
}

func (e *Engine) CreateSession(studentID, questionID string) (*model.TutorSession, error) {
	q, err := e.store.GetQuestion(questionID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	opening := fmt.Sprintf("我们一起来看这道题：%s\n\n你先读读题，告诉我题目在问什么？", q.Stem)
	sess := model.TutorSession{
		ID:         uuid.New().String(),
		StudentID:  studentID,
		QuestionID: questionID,
		State:      StateReview,
		Messages: []model.TutorMessage{
			{Role: "assistant", Content: opening},
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := e.store.CreateTutorSession(sess); err != nil {
		return nil, err
	}
	return &sess, nil
}

func (e *Engine) Chat(sessionID, userMessage string, weakSkills []string) (string, error) {
	sess, err := e.store.GetTutorSession(sessionID)
	if err != nil {
		return "", err
	}
	q, err := e.store.GetQuestion(sess.QuestionID)
	if err != nil {
		return "", err
	}

	if userMessage != "" {
		sess.Messages = append(sess.Messages, model.TutorMessage{Role: "user", Content: userMessage})
	}

	stage := stageFor(sess)
	reply, fromFallback, err := e.generateReply(sess, q, weakSkills, stage)
	if err != nil {
		return "", err
	}

	if fromFallback {
		sess.State = StateRectification
	} else {
		sess.State = stage
	}
	sess.Messages = append(sess.Messages, model.TutorMessage{Role: "assistant", Content: reply})
	sess.UpdatedAt = time.Now()
	if err := e.store.UpdateTutorSession(*sess); err != nil {
		return "", err
	}
	return reply, nil
}

func (e *Engine) ChatStream(sessionID, userMessage string, weakSkills []string, w io.Writer) error {
	sess, err := e.store.GetTutorSession(sessionID)
	if err != nil {
		return err
	}
	q, err := e.store.GetQuestion(sess.QuestionID)
	if err != nil {
		return err
	}
	if userMessage != "" {
		sess.Messages = append(sess.Messages, model.TutorMessage{Role: "user", Content: userMessage})
	}

	stage := stageFor(sess)
	modelName, err := e.resolveModel()
	if err != nil {
		return e.writeFallback(w, sess, q, err.Error())
	}

	systemPrompt := e.buildSystemPrompt(q, weakSkills, stage)
	var messages []map[string]string
	messages = append(messages, map[string]string{"role": "system", "content": systemPrompt})
	for _, m := range sess.Messages {
		messages = append(messages, map[string]string{"role": m.Role, "content": m.Content})
	}

	body := map[string]any{
		"model":    modelName,
		"messages": messages,
		"stream":   true,
		"think":    false,
	}
	payload, _ := json.Marshal(body)
	resp, err := e.httpClient.Post(e.ollamaURL+"/api/chat", "application/json", bytes.NewReader(payload))
	if err != nil {
		return e.writeFallback(w, sess, q, "连接 Ollama 失败: "+err.Error())
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return e.writeFallback(w, sess, q, fmt.Sprintf("Ollama 返回 %d", resp.StatusCode))
	}

	var full strings.Builder
	var lastChunk ollamaChatResp
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Bytes()
		var chunk ollamaChatResp
		if json.Unmarshal(line, &chunk) != nil {
			continue
		}
		if chunk.Error != "" {
			return e.writeFallback(w, sess, q, chunk.Error)
		}
		lastChunk = chunk
		text := chunk.Message.Content
		if text != "" {
			full.WriteString(text)
			fmt.Fprintf(w, "data: %s\n\n", jsonEscape(text))
			if f, ok := w.(http.Flusher); ok {
				f.Flush()
			}
		}
	}
	if err := scanner.Err(); err != nil && full.Len() == 0 {
		return e.writeFallback(w, sess, q, "读取 Ollama 流失败: "+err.Error())
	}
	reply := full.String()
	if reply == "" {
		reply = lastChunk.Message.Content
	}
	if reply == "" {
		reply = e.fallbackHint(q, hintRound(sess))
	}
	if full.Len() == 0 {
		fmt.Fprintf(w, "data: %s\n\n", jsonEscape(reply))
	}
	fmt.Fprint(w, "data: [DONE]\n\n")
	sess.Messages = append(sess.Messages, model.TutorMessage{Role: "assistant", Content: reply})
	sess.State = stage
	sess.UpdatedAt = time.Now()
	return e.store.UpdateTutorSession(*sess)
}

func (e *Engine) writeFallback(w io.Writer, sess *model.TutorSession, q *model.Question, reason string) error {
	reply := e.fallbackHint(q, hintRound(sess))
	if reason != "" {
		reply = "⚠️ AI 暂时不可用（" + reason + "）\n\n" + reply
	}
	fmt.Fprintf(w, "data: %s\n\n", jsonEscape(reply))
	fmt.Fprint(w, "data: [DONE]\n\n")
	sess.Messages = append(sess.Messages, model.TutorMessage{Role: "assistant", Content: reply})
	sess.State = StateRectification
	sess.UpdatedAt = time.Now()
	return e.store.UpdateTutorSession(*sess)
}

func hintRound(sess *model.TutorSession) int {
	n := 0
	for _, m := range sess.Messages {
		if m.Role == "assistant" {
			n++
		}
	}
	if n <= 1 {
		return 0
	}
	return n - 1
}

func (e *Engine) generateReply(sess *model.TutorSession, q *model.Question, weakSkills []string, stage string) (string, bool, error) {
	modelName, err := e.resolveModel()
	if err != nil {
		return e.fallbackHint(q, hintRound(sess)), true, nil
	}

	systemPrompt := e.buildSystemPrompt(q, weakSkills, stage)
	var messages []map[string]string
	messages = append(messages, map[string]string{"role": "system", "content": systemPrompt})
	for _, m := range sess.Messages {
		messages = append(messages, map[string]string{"role": m.Role, "content": m.Content})
	}

	body := map[string]any{
		"model":    modelName,
		"messages": messages,
		"stream":   false,
		"think":    false,
	}
	payload, _ := json.Marshal(body)
	resp, err := e.httpClient.Post(e.ollamaURL+"/api/chat", "application/json", bytes.NewReader(payload))
	if err != nil {
		return e.fallbackHint(q, hintRound(sess)), true, nil
	}
	defer resp.Body.Close()

	var result ollamaChatResp
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return e.fallbackHint(q, hintRound(sess)), true, nil
	}
	if result.Error != "" {
		return e.fallbackHint(q, hintRound(sess)), true, nil
	}
	if result.Message.Content == "" {
		return e.fallbackHint(q, hintRound(sess)), true, nil
	}
	return result.Message.Content, false, nil
}

func (e *Engine) buildSystemPrompt(q *model.Question, weakSkills []string, stage string) string {
	steps := strings.Join(q.SolutionSteps, "；")
	weak := strings.Join(weakSkills, "、")
	if weak == "" {
		weak = "暂无"
	}
	return fmt.Sprintf(`你是一位耐心的小学数学老师，使用苏格拉底式教学法引导学生思考。
按照「回顾 → 启发 → 纠错 → 总结」四阶段策略对话，每一步都让学生自己想，绝不替他算出答案。

【题目】%s
【正确解法步骤（已由后端数学引擎算好，仅供你内部参考，禁止直接告诉学生最终答案）】%s
【学生薄弱技能】%s
%s

规则：
1. 绝对禁止直接给出最终数值答案
2. 每次只问一个问题或给一个提示
3. 使用小学四年级学生能听懂的大白话
4. 不使用超纲方法（如方程、向量）
5. 鼓励学生自己思考，多用"你觉得呢？""观察一下..."
6. 如果学生接近答案，用提问引导他自己说出来
7. 分数必须用小学生写法：4/5、1又1/3、三分之二，禁止使用 LaTeX 或 $\frac{4}{5}$ 这类公式符号%s`, q.Stem, steps, weak, stageGuidance(stage), e.fewShot)
}

func (e *Engine) fallbackHint(q *model.Question, round int) string {
	if len(q.Hints) == 0 {
		return "想一想，这道题的关键信息是什么？试着分步骤来思考。"
	}
	idx := round % len(q.Hints)
	return "💡 提示：" + q.Hints[idx]
}

func jsonEscape(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}

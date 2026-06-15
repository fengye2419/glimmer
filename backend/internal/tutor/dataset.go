package tutor

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

// datasetExample 是 SocraticMATH（CC BY-NC 4.0，仅限非商用）单条对话的解析结果。
type datasetExample struct {
	Problem  string   // 题目 + 学生开场提问
	Turns    []string // 交替对话：index0=老师, index1=学生, index2=老师 ...
	Solution string   // 标准解析（【解析】内容）
}

// loadDataset 解析 SocratesMATH.jsonl，每行为一个 JSON 字符串数组：
// [题目+开场, 老师, 学生, 老师, ..., 【ProblemID】:xxx, 【解析】:xxx]
func loadDataset(path string) ([]datasetExample, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var examples []datasetExample
	scanner := bufio.NewScanner(f)
	// 单条对话整行可能较长，扩大缓冲上限。
	scanner.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)
	for scanner.Scan() {
		var arr []string
		if json.Unmarshal(scanner.Bytes(), &arr) != nil {
			continue
		}
		if len(arr) < 3 {
			continue
		}
		ex := datasetExample{Problem: arr[0]}
		// 从尾部剥离 【解析】/【ProblemID】 元信息行。
		end := len(arr)
		for end > 1 {
			last := arr[end-1]
			if strings.HasPrefix(last, "【解析】") {
				ex.Solution = strings.TrimLeft(strings.TrimPrefix(last, "【解析】"), ":：")
				end--
				continue
			}
			if strings.HasPrefix(last, "【ProblemID】") {
				end--
				continue
			}
			break
		}
		ex.Turns = arr[1:end]
		examples = append(examples, ex)
	}
	if err := scanner.Err(); err != nil {
		return examples, err
	}
	return examples, nil
}

func matchesFilter(ex datasetExample, filter string) bool {
	if filter == "" {
		return true
	}
	if strings.Contains(ex.Problem, filter) {
		return true
	}
	for _, t := range ex.Turns {
		if strings.Contains(t, filter) {
			return true
		}
	}
	return false
}

func oneLine(s string) string {
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.TrimSpace(s)
	const maxLen = 120
	r := []rune(s)
	if len(r) > maxLen {
		return string(r[:maxLen]) + "…"
	}
	return s
}

// buildFewShot 从数据集中挑选命中关键词的对话，格式化成可注入 system prompt 的 few-shot 文本。
// maxTurns 限制每条示例展示的对话轮数，控制 prompt 体积。
func buildFewShot(examples []datasetExample, filter string, n, maxTurns int) string {
	if n <= 0 {
		return ""
	}
	var chosen []datasetExample
	for _, ex := range examples {
		if matchesFilter(ex, filter) {
			chosen = append(chosen, ex)
			if len(chosen) >= n {
				break
			}
		}
	}
	if len(chosen) == 0 {
		return ""
	}

	var b strings.Builder
	b.WriteString("\n\n【优秀苏格拉底对话示例（来自 SocraticMATH 数据集，仅供你学习提问风格，禁止照抄题目内容）】")
	for i, ex := range chosen {
		fmt.Fprintf(&b, "\n--- 示例 %d ---\n题目：%s\n", i+1, oneLine(ex.Problem))
		turns := ex.Turns
		if maxTurns > 0 && len(turns) > maxTurns {
			turns = turns[:maxTurns]
		}
		for j, t := range turns {
			role := "老师"
			if j%2 == 1 {
				role = "学生"
			}
			fmt.Fprintf(&b, "%s：%s\n", role, oneLine(t))
		}
	}
	return b.String()
}

// loadFewShotFromEnv 按环境变量加载 few-shot 示例（默认关闭，不影响生产行为）。
//
//	SOCRATIC_DATASET        数据集 jsonl 路径（设置后启用）
//	SOCRATIC_FEWSHOT_N      注入示例条数（默认 2）
//	SOCRATIC_FEWSHOT_FILTER 关键词过滤（默认「分数」）
func loadFewShotFromEnv() string {
	path := os.Getenv("SOCRATIC_DATASET")
	if path == "" {
		return ""
	}
	examples, err := loadDataset(path)
	if err != nil {
		log.Printf("加载 SocraticMATH 数据集失败 (%s): %v", path, err)
		return ""
	}

	n := 2
	if v := os.Getenv("SOCRATIC_FEWSHOT_N"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed >= 0 {
			n = parsed
		}
	}
	filter := os.Getenv("SOCRATIC_FEWSHOT_FILTER")
	if filter == "" {
		filter = "分数"
	}

	fs := buildFewShot(examples, filter, n, 6)
	if fs != "" {
		log.Printf("[debug] SocraticMATH few-shot 已启用：%d 条示例 (filter=%q, 共 %d 条对话, 来自 %s)", n, filter, len(examples), path)
	} else {
		log.Printf("[debug] SocraticMATH 数据集已加载但无匹配示例 (filter=%q, 共 %d 条对话)", filter, len(examples))
	}
	return fs
}

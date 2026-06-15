package llm

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type Config struct {
	Provider string
	BaseURL  string
	APIKey   string
	Model    string
}

func ConfigFromEnv() Config {
	provider := strings.ToLower(strings.TrimSpace(os.Getenv("LLM_PROVIDER")))
	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("LLM_BASE_URL")), "/")
	apiKey := strings.TrimSpace(os.Getenv("LLM_API_KEY"))
	model := strings.TrimSpace(os.Getenv("LLM_MODEL"))

	ollamaURL := strings.TrimRight(strings.TrimSpace(os.Getenv("OLLAMA_URL")), "/")
	ollamaModel := strings.TrimSpace(os.Getenv("OLLAMA_MODEL"))

	if provider == "" {
		switch {
		case baseURL != "" || apiKey != "":
			provider = "openai_compat"
		default:
			provider = "ollama"
		}
	}

	switch provider {
	case "openai_compat", "openai", "agnes":
		if baseURL == "" {
			baseURL = "https://apihub.agnes-ai.com/v1"
		}
		if model == "" {
			model = "agnes-2.0-flash"
		}
	default:
		provider = "ollama"
		if ollamaURL == "" {
			ollamaURL = "http://localhost:11434"
		}
		baseURL = ollamaURL
		if model == "" {
			model = ollamaModel
		}
	}

	return Config{
		Provider: provider,
		BaseURL:  baseURL,
		APIKey:   apiKey,
		Model:    model,
	}
}

type Client struct {
	cfg        Config
	httpClient *http.Client
}

func NewClient(cfg Config) *Client {
	return &Client{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 180 * time.Second},
	}
}

type ollamaTagsResp struct {
	Models []struct {
		Name string `json:"name"`
	} `json:"models"`
}

type ollamaChatResp struct {
	Message struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"message"`
	Error string `json:"error"`
	Done  bool   `json:"done"`
}

type openAIChatResp struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *Client) ProviderName() string {
	return c.cfg.Provider
}

func (c *Client) Healthy() bool {
	_, err := c.resolveModel()
	return err == nil
}

func (c *Client) resolveModel() (string, error) {
	if c.cfg.Provider == "openai_compat" {
		if c.cfg.Model == "" {
			return "", fmt.Errorf("未配置 LLM_MODEL")
		}
		if c.cfg.APIKey == "" {
			return "", fmt.Errorf("未配置 LLM_API_KEY")
		}
		return c.cfg.Model, nil
	}

	models := c.listOllamaModels()
	if len(models) == 0 {
		return "", fmt.Errorf("ollama 无可用模型，请先执行 ollama pull")
	}
	if c.cfg.Model != "" {
		for _, name := range models {
			if name == c.cfg.Model {
				return name, nil
			}
		}
	}
	return models[0], nil
}

func (c *Client) listOllamaModels() []string {
	resp, err := c.httpClient.Get(c.cfg.BaseURL + "/api/tags")
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

func (c *Client) Chat(messages []map[string]string) (string, error) {
	modelName, err := c.resolveModel()
	if err != nil {
		return "", err
	}
	if c.cfg.Provider == "openai_compat" {
		return c.openAIChat(modelName, messages, false)
	}
	return c.ollamaChat(modelName, messages, false)
}

func (c *Client) ChatStream(messages []map[string]string, onChunk func(string) error) (string, error) {
	modelName, err := c.resolveModel()
	if err != nil {
		return "", err
	}
	if c.cfg.Provider == "openai_compat" {
		return c.openAIChat(modelName, messages, true, onChunk)
	}
	return c.ollamaChat(modelName, messages, true, onChunk)
}

func (c *Client) ollamaChat(modelName string, messages []map[string]string, stream bool, onChunk ...func(string) error) (string, error) {
	body := map[string]any{
		"model":    modelName,
		"messages": messages,
		"stream":   stream,
		"think":    false,
	}
	payload, _ := json.Marshal(body)
	resp, err := c.httpClient.Post(c.cfg.BaseURL+"/api/chat", "application/json", bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama 返回 %d", resp.StatusCode)
	}

	if !stream {
		var result ollamaChatResp
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return "", err
		}
		if result.Error != "" {
			return "", fmt.Errorf(result.Error)
		}
		return result.Message.Content, nil
	}

	var full strings.Builder
	var lastChunk ollamaChatResp
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		var chunk ollamaChatResp
		if json.Unmarshal(scanner.Bytes(), &chunk) != nil {
			continue
		}
		if chunk.Error != "" {
			return full.String(), fmt.Errorf(chunk.Error)
		}
		lastChunk = chunk
		text := chunk.Message.Content
		if text != "" {
			full.WriteString(text)
			if len(onChunk) > 0 && onChunk[0] != nil {
				if err := onChunk[0](text); err != nil {
					return full.String(), err
				}
			}
		}
	}
	if err := scanner.Err(); err != nil && full.Len() == 0 {
		return "", err
	}
	reply := full.String()
	if reply == "" {
		reply = lastChunk.Message.Content
	}
	return reply, nil
}

func (c *Client) openAIChat(modelName string, messages []map[string]string, stream bool, onChunk ...func(string) error) (string, error) {
	body := map[string]any{
		"model":    modelName,
		"messages": messages,
		"stream":   stream,
	}
	payload, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, c.cfg.BaseURL+"/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.cfg.APIKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("LLM API 返回 %d: %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}

	if !stream {
		var result openAIChatResp
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return "", err
		}
		if result.Error != nil && result.Error.Message != "" {
			return "", fmt.Errorf(result.Error.Message)
		}
		if len(result.Choices) == 0 {
			return "", fmt.Errorf("LLM 返回空响应")
		}
		return result.Choices[0].Message.Content, nil
	}

	var full strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || line == "data: [DONE]" {
			continue
		}
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		var chunk openAIChatResp
		if json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &chunk) != nil {
			continue
		}
		if chunk.Error != nil && chunk.Error.Message != "" {
			return full.String(), fmt.Errorf(chunk.Error.Message)
		}
		if len(chunk.Choices) == 0 {
			continue
		}
		text := chunk.Choices[0].Delta.Content
		if text == "" {
			continue
		}
		full.WriteString(text)
		if len(onChunk) > 0 && onChunk[0] != nil {
			if err := onChunk[0](text); err != nil {
				return full.String(), err
			}
		}
	}
	if err := scanner.Err(); err != nil && full.Len() == 0 {
		return "", err
	}
	return full.String(), nil
}

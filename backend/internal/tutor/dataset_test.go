package tutor

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const sampleJSONL = `["小明把一张饼平均分成4份，吃了1份，吃了这张饼的几分之几？\n这道题怎么解？", "我们先看看这张饼被平均分成了几份呢？", "分成了4份。", "很好，那吃掉的1份占总份数的多少呢？", "1/4。", "完全正确！", "【ProblemID】:1001", "【解析】:解：1÷4=1/4。故答案为：1/4。"]
["计算 25 × 4 = ____", "你能想到一个简便算法吗？", "【ProblemID】:1002", "【解析】:解：25×4=100。"]`

func writeSample(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "sample.jsonl")
	if err := os.WriteFile(path, []byte(sampleJSONL), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestLoadDatasetParsesTurnsAndSolution(t *testing.T) {
	path := writeSample(t)
	examples, err := loadDataset(path)
	if err != nil {
		t.Fatal(err)
	}
	if len(examples) != 2 {
		t.Fatalf("expected 2 examples, got %d", len(examples))
	}

	ex := examples[0]
	if !strings.Contains(ex.Problem, "平均分成4份") {
		t.Fatalf("unexpected problem: %q", ex.Problem)
	}
	// 元信息行（【ProblemID】/【解析】）应被剥离出对话轮。
	for _, turn := range ex.Turns {
		if strings.HasPrefix(turn, "【ProblemID】") || strings.HasPrefix(turn, "【解析】") {
			t.Fatalf("meta line leaked into turns: %q", turn)
		}
	}
	if len(ex.Turns) != 5 {
		t.Fatalf("expected 5 dialogue turns, got %d", len(ex.Turns))
	}
	if !strings.Contains(ex.Solution, "1/4") {
		t.Fatalf("expected solution to contain answer, got %q", ex.Solution)
	}
}

func TestBuildFewShotFiltersByKeyword(t *testing.T) {
	path := writeSample(t)
	examples, _ := loadDataset(path)

	fs := buildFewShot(examples, "分", 5, 6)
	if !strings.Contains(fs, "平均分成4份") {
		t.Fatalf("expected fraction example to be selected, got: %s", fs)
	}
	if strings.Contains(fs, "25 × 4") {
		t.Fatalf("non-matching example should be excluded, got: %s", fs)
	}
	if !strings.Contains(fs, "老师：") || !strings.Contains(fs, "学生：") {
		t.Fatalf("expected role labels in few-shot, got: %s", fs)
	}
}

func TestBuildFewShotZeroDisabled(t *testing.T) {
	path := writeSample(t)
	examples, _ := loadDataset(path)
	if got := buildFewShot(examples, "分", 0, 6); got != "" {
		t.Fatalf("expected empty few-shot when n=0, got %q", got)
	}
}

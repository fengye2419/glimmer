package mathcheck

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	latexMixedRe = regexp.MustCompile(`^(-?\d+)\\frac\{(-?\d+)\}\{(-?\d+)\}$`)
	latexFracRe  = regexp.MustCompile(`^\\frac\{(-?\d+)\}\{(-?\d+)\}$`)
	// fracArgRe 匹配 \frac 的两个参数，每个参数可为 {…} 或单个字符/数字。
	// 用于把 MathLive 对个位数的省略写法 \frac34 归一成 \frac{3}{4}。
	fracArgRe = regexp.MustCompile(`\\frac\s*(\{[^{}]*\}|[^{}\s])\s*(\{[^{}]*\}|[^{}\s])`)
)

// bracifyFrac 把 \frac 的无括号参数补成标准花括号形式：
// \frac34 → \frac{3}{4}，\frac3{4} → \frac{3}{4}，已带括号的保持不变。
func bracifyFrac(s string) string {
	return fracArgRe.ReplaceAllStringFunc(s, func(m string) string {
		sub := fracArgRe.FindStringSubmatch(m)
		a := strings.Trim(sub[1], "{}")
		b := strings.Trim(sub[2], "{}")
		return `\frac{` + a + `}{` + b + `}`
	})
}

// preprocess converts LaTeX-style answers to plain forms mathcheck understands.
func preprocess(s string) string {
	s = strings.TrimSpace(s)
	if !strings.Contains(s, `\`) {
		return s
	}
	s = strings.Trim(s, "$")
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, `\dfrac`, `\frac`)
	s = strings.ReplaceAll(s, `\tfrac`, `\frac`)
	s = strings.ReplaceAll(s, `\lt`, "<")
	s = strings.ReplaceAll(s, `\gt`, ">")
	s = strings.ReplaceAll(s, `\left`, "")
	s = strings.ReplaceAll(s, `\right`, "")
	s = bracifyFrac(s)

	if m := latexMixedRe.FindStringSubmatch(s); len(m) == 4 {
		return fmt.Sprintf("%s又%s/%s", m[1], m[2], m[3])
	}
	if m := latexFracRe.FindStringSubmatch(s); len(m) == 3 {
		return fmt.Sprintf("%s/%s", m[1], m[2])
	}
	return s
}

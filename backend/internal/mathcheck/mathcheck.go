package mathcheck

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

var (
	fracRe   = regexp.MustCompile(`^(-?\d+)\s*/\s*(-?\d+)$`)
	mixedRe  = regexp.MustCompile(`^(-?\d+)\s*(?:又|\s+)\s*(\d+)\s*/\s*(\d+)$`)
)

func CheckAnswer(expected, actual string) bool {
	expected = preprocess(expected)
	actual = preprocess(actual)
	exp := canonicalize(expected)
	act := canonicalize(actual)
	if exp == act {
		return true
	}
	expVal, err1 := parseValue(expected)
	actVal, err2 := parseValue(actual)
	if err1 == nil && err2 == nil {
		return math.Abs(expVal-actVal) < 1e-4
	}
	return false
}

func canonicalize(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "，", ",")
	s = strings.ReplaceAll(s, " ", "")
	s = strings.ReplaceAll(s, "又", "又")
	return s
}

func parseValue(s string) (float64, error) {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "，", ",")

	if s == "<" || s == ">" || s == "=" || s == "假" || s == "真" {
		return 0, fmt.Errorf("non-numeric")
	}
	if strings.Contains(s, ",") && !strings.Contains(s, "/") {
		return 0, fmt.Errorf("multi-part")
	}

	if m := mixedRe.FindStringSubmatch(s); len(m) == 4 {
		return parseMixed(m[1], m[2], m[3])
	}

	if parts := strings.Fields(s); len(parts) == 2 {
		if m := fracRe.FindStringSubmatch(parts[1]); len(m) == 3 {
			return parseMixed(parts[0], m[1], m[2])
		}
	}

	if m := fracRe.FindStringSubmatch(s); len(m) == 3 {
		num, _ := strconv.Atoi(m[1])
		den, _ := strconv.Atoi(m[2])
		if den == 0 {
			return 0, fmt.Errorf("zero denominator")
		}
		return float64(num) / float64(den), nil
	}

	if strings.Contains(s, "/") {
		parts := strings.Split(s, "/")
		if len(parts) == 2 {
			num, err1 := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
			den, err2 := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
			if err1 == nil && err2 == nil && den != 0 {
				return num / den, nil
			}
		}
	}

	return strconv.ParseFloat(s, 64)
}

func parseMixed(wholeStr, numStr, denStr string) (float64, error) {
	whole, err := strconv.Atoi(strings.TrimSpace(wholeStr))
	if err != nil {
		return 0, err
	}
	num, _ := strconv.Atoi(strings.TrimSpace(numStr))
	den, _ := strconv.Atoi(strings.TrimSpace(denStr))
	if den == 0 {
		return 0, fmt.Errorf("zero denominator")
	}
	sign := 1.0
	if whole < 0 {
		sign = -1
		whole = -whole
	}
	return sign * (float64(whole) + float64(num)/float64(den)), nil
}

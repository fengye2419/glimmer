package mathcheck

import "testing"

func TestCheckAnswerFraction(t *testing.T) {
	if !CheckAnswer("3/4", "3/4") {
		t.Fatal("3/4")
	}
	if !CheckAnswer("3/4", "0.75") {
		t.Fatal("decimal")
	}
}

func TestCheckAnswerMixedFraction(t *testing.T) {
	cases := []struct{ exp, act string }{
		{"2 1/3", "2 1/3"},
		{"2 1/3", "2又1/3"},
		{"2 1/3", "2又 1/3"},
		{"2 3/4", "2又3/4"},
		{"7/3", "2 1/3"},
		{"7/3", "2又1/3"},
	}
	for _, c := range cases {
		if !CheckAnswer(c.exp, c.act) {
			t.Fatalf("%s vs %s", c.exp, c.act)
		}
	}
}

func TestCheckAnswerCompare(t *testing.T) {
	if !CheckAnswer("<", "<") {
		t.Fatal("<")
	}
	if CheckAnswer("<", ">") {
		t.Fatal("should differ")
	}
}

func TestCheckAnswerMultiPart(t *testing.T) {
	if !CheckAnswer("6,5", "6,5") {
		t.Fatal("comma")
	}
	if !CheckAnswer("6,5", "6，5") {
		t.Fatal("chinese comma")
	}
}

func TestCheckAnswerLatex(t *testing.T) {
	cases := []struct{ exp, act string }{
		{"3/4", `\frac{3}{4}`},
		{"2 1/3", `2\frac{1}{3}`},
		{"7/3", `\frac{7}{3}`},
		{"<", `\lt`},
	}
	for _, c := range cases {
		if !CheckAnswer(c.exp, c.act) {
			t.Fatalf("%s vs %s", c.exp, c.act)
		}
	}
}

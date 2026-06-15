package bkt

import "testing"

func TestUpdateCorrectIncreasesMastery(t *testing.T) {
	p := Update(0.5, true, DefaultPLearn, DefaultPGuess, DefaultPSlip)
	if p <= 0.5 {
		t.Fatalf("expected mastery to increase after correct, got %f", p)
	}
}

func TestUpdateIncorrectDecreasesMastery(t *testing.T) {
	p := Update(0.7, false, DefaultPLearn, DefaultPGuess, DefaultPSlip)
	if p >= 0.7 {
		t.Fatalf("expected mastery to decrease after incorrect, got %f", p)
	}
}

func TestSequenceConvergesOnRepeatedCorrect(t *testing.T) {
	p := 0.3
	for i := 0; i < 8; i++ {
		p = Update(p, true, DefaultPLearn, DefaultPGuess, DefaultPSlip)
	}
	if p < 0.8 {
		t.Fatalf("expected high mastery after repeated correct, got %f", p)
	}
}

func TestApplyForgetDefaultIsNoOp(t *testing.T) {
	p := ApplyForget(0.9, DefaultPForget, 30)
	if p != 0.9 {
		t.Fatalf("expected no-op with DefaultPForget=0, got %f", p)
	}
}

func TestApplyForgetDecaysOverTime(t *testing.T) {
	p := ApplyForget(0.9, 0.1, 5)
	if p >= 0.9 {
		t.Fatalf("expected mastery to decay after idle days, got %f", p)
	}
	// 时间越久衰减越多。
	p10 := ApplyForget(0.9, 0.1, 10)
	if p10 >= p {
		t.Fatalf("expected more decay over more days, got %f >= %f", p10, p)
	}
}

func TestApplyForgetZeroElapsedIsNoOp(t *testing.T) {
	if got := ApplyForget(0.6, 0.2, 0); got != 0.6 {
		t.Fatalf("expected no decay with 0 elapsed days, got %f", got)
	}
}

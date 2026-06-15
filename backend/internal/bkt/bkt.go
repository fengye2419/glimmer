package bkt

import "math"

const (
	DefaultPLearn = 0.2
	DefaultPGuess = 0.2
	DefaultPSlip  = 0.1
	DefaultPKnown = 0.5
	// DefaultPForget：BKT+Forgets 变体的遗忘率（借鉴 pyBKT）。
	// MVP 阶段默认 0（不遗忘）；后期可调大，与练习层的间隔重复耦合，
	// 让长期不复习的技能掌握度缓慢回落。
	DefaultPForget = 0.0
)

// ApplyForget 对长期未练习的技能施加遗忘衰减（BKT+Forgets 思想）。
// 每过一天，掌握概率按 (1-pForget) 衰减一次：pKnown' = pKnown * (1-pForget)^elapsedDays。
// pForget=0 时为 no-op，直接返回原值，因此默认配置下不改变现有行为。
func ApplyForget(pKnown, pForget, elapsedDays float64) float64 {
	if pForget <= 0 || elapsedDays <= 0 {
		return pKnown
	}
	decayed := pKnown * math.Pow(1-pForget, elapsedDays)
	return clamp(decayed)
}

// Update applies standard 4-parameter BKT Bayesian update.
// Returns new P(known) after observing correct/incorrect.
func Update(pKnown float64, correct bool, pLearn, pGuess, pSlip float64) float64 {
	if pLearn <= 0 {
		pLearn = DefaultPLearn
	}
	if pGuess <= 0 {
		pGuess = DefaultPGuess
	}
	if pSlip <= 0 {
		pSlip = DefaultPSlip
	}

	pCorrectGivenKnown := 1 - pSlip
	pCorrectGivenUnknown := pGuess
	pIncorrectGivenKnown := pSlip
	pIncorrectGivenUnknown := 1 - pGuess

	var pObsGivenKnown, pObsGivenUnknown float64
	if correct {
		pObsGivenKnown = pCorrectGivenKnown
		pObsGivenUnknown = pCorrectGivenUnknown
	} else {
		pObsGivenKnown = pIncorrectGivenKnown
		pObsGivenUnknown = pIncorrectGivenUnknown
	}

	pObs := pKnown*pObsGivenKnown + (1-pKnown)*pObsGivenUnknown
	if pObs < 1e-10 {
		pObs = 1e-10
	}

	pKnownGivenObs := (pKnown * pObsGivenKnown) / pObs
	pKnownAfterLearn := pKnownGivenObs + (1-pKnownGivenObs)*pLearn
	return clamp(pKnownAfterLearn)
}

func clamp(v float64) float64 {
	if v < 0.01 {
		return 0.01
	}
	if v > 0.99 {
		return 0.99
	}
	return v
}

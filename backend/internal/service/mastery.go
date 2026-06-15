package service

import (
	"time"

	"github.com/google/uuid"

	"glimmer/internal/bkt"
	"glimmer/internal/mathcheck"
	"glimmer/internal/model"
	"glimmer/internal/store"
)

type MasteryService struct {
	store store.Store
}

func NewMasteryService(s store.Store) *MasteryService {
	return &MasteryService{store: s}
}

func (m *MasteryService) GetOrInitMastery(studentID, skillID string) (model.MasteryState, error) {
	state, err := m.store.GetMastery(studentID, skillID)
	if err != nil {
		return model.MasteryState{}, err
	}
	if state == nil {
		return model.MasteryState{
			StudentID: studentID,
			SkillID:   skillID,
			PKnown:    bkt.DefaultPKnown,
			UpdatedAt: time.Now(),
		}, nil
	}
	// BKT+Forgets：按距上次更新的天数施加遗忘衰减（DefaultPForget=0 时为 no-op）。
	elapsedDays := time.Since(state.UpdatedAt).Hours() / 24
	state.PKnown = bkt.ApplyForget(state.PKnown, bkt.DefaultPForget, elapsedDays)
	return *state, nil
}

func (m *MasteryService) UpdateFromAttempt(studentID string, q model.Question, correct bool, durationMs int, ctx string) ([]model.MasteryItem, error) {
	var updated []model.MasteryItem
	now := time.Now()

	for _, qs := range q.Skills {
		state, _ := m.GetOrInitMastery(studentID, qs.SkillID)
		newP := bkt.Update(state.PKnown, correct, bkt.DefaultPLearn, bkt.DefaultPGuess, bkt.DefaultPSlip)
		if correct && durationMs > 60000 {
			newP = bkt.Update(newP, false, bkt.DefaultPLearn, bkt.DefaultPGuess, bkt.DefaultPSlip)
		}
		state.PKnown = newP
		state.UpdatedAt = now
		if err := m.store.UpsertMastery(state); err != nil {
			return nil, err
		}
		skill, _ := m.store.GetSkill(qs.SkillID)
		name := qs.SkillID
		if skill != nil {
			name = skill.Name
		}
		updated = append(updated, model.MasteryItem{
			SkillID:   qs.SkillID,
			SkillName: name,
			PKnown:    newP,
		})
	}

	attempt := model.Attempt{
		ID:         uuid.New().String(),
		StudentID:  studentID,
		QuestionID: q.ID,
		Correct:    correct,
		DurationMs: durationMs,
		Context:    ctx,
		CreatedAt:  now,
	}
	if err := m.store.SaveAttempt(attempt); err != nil {
		return nil, err
	}
	return updated, nil
}

func (m *MasteryService) CheckAndUpdate(studentID string, q *model.Question, answer string, durationMs int, ctx string) (model.SubmitResult, error) {
	correct := mathcheck.CheckAnswer(q.Answer, answer)
	updated, err := m.UpdateFromAttempt(studentID, *q, correct, durationMs, ctx)
	if err != nil {
		return model.SubmitResult{}, err
	}
	feedback := "回答正确，继续保持！"
	if !correct {
		feedback = "回答不对，我们来看看哪里需要加强。"
	}
	var rootCauses []model.RootCause
	if !correct {
		rootCauses, _ = m.TraceRootCauses(studentID, q)
	}
	return model.SubmitResult{
		Correct:       correct,
		Feedback:      feedback,
		UpdatedSkills: updated,
		RootCauses:    rootCauses,
	}, nil
}

func (m *MasteryService) TraceRootCauses(studentID string, q *model.Question) ([]model.RootCause, error) {
	var causes []model.RootCause
	seen := map[string]bool{}

	for _, qs := range q.Skills {
		chain := m.traceChain(studentID, qs.SkillID)
		if len(chain) == 0 {
			continue
		}
		weakest := chain[len(chain)-1]
		if seen[weakest.SkillID] {
			continue
		}
		seen[weakest.SkillID] = true
		names := make([]string, len(chain))
		for i, c := range chain {
			names[i] = c.SkillName
		}
		causes = append(causes, model.RootCause{
			SkillID:   weakest.SkillID,
			SkillName: weakest.SkillName,
			PKnown:    weakest.PKnown,
			Chain:     names,
		})
	}
	return causes, nil
}

func (m *MasteryService) traceChain(studentID, skillID string) []model.MasteryItem {
	skill, err := m.store.GetSkill(skillID)
	if err != nil {
		return nil
	}
	state, _ := m.GetOrInitMastery(studentID, skillID)
	chain := []model.MasteryItem{{
		SkillID:   skillID,
		SkillName: skill.Name,
		PKnown:    state.PKnown,
	}}

	if state.PKnown >= 0.5 {
		return chain
	}

	for _, preID := range skill.Prerequisites {
		sub := m.traceChain(studentID, preID)
		if len(sub) > 0 {
			return append(sub, chain...)
		}
	}
	return chain
}

func (m *MasteryService) ListMasteryItems(studentID string) ([]model.MasteryItem, error) {
	skills, err := m.store.ListSkills()
	if err != nil {
		return nil, err
	}
	var items []model.MasteryItem
	for _, sk := range skills {
		state, _ := m.GetOrInitMastery(studentID, sk.ID)
		items = append(items, model.MasteryItem{
			SkillID:   sk.ID,
			SkillName: sk.Name,
			PKnown:    state.PKnown,
		})
	}
	return items, nil
}

func (m *MasteryService) WeakSkills(studentID string, limit int) ([]model.WeakSkill, error) {
	items, err := m.ListMasteryItems(studentID)
	if err != nil {
		return nil, err
	}
	var weak []model.WeakSkill
	for _, it := range items {
		if it.PKnown < 0.5 {
			weak = append(weak, model.WeakSkill{
				SkillID:   it.SkillID,
				SkillName: it.SkillName,
				PKnown:    it.PKnown,
			})
		}
	}
	for i := 0; i < len(weak); i++ {
		for j := i + 1; j < len(weak); j++ {
			if weak[j].PKnown < weak[i].PKnown {
				weak[i], weak[j] = weak[j], weak[i]
			}
		}
	}
	if limit > 0 && len(weak) > limit {
		weak = weak[:limit]
	}
	return weak, nil
}

func (m *MasteryService) Trend(studentID string, days int) ([]model.TrendPoint, error) {
	since := time.Now().AddDate(0, 0, -days)
	attempts, err := m.store.ListAttempts(studentID, since)
	if err != nil {
		return nil, err
	}
	dayMap := map[string][]float64{}
	for _, a := range attempts {
		day := a.CreatedAt.Format("2006-01-02")
		q, err := m.store.GetQuestion(a.QuestionID)
		if err != nil {
			continue
		}
		for _, qs := range q.Skills {
			state, _ := m.GetOrInitMastery(studentID, qs.SkillID)
			dayMap[day] = append(dayMap[day], state.PKnown)
		}
	}
	var trend []model.TrendPoint
	for d := days; d >= 0; d-- {
		day := time.Now().AddDate(0, 0, -d).Format("2006-01-02")
		vals := dayMap[day]
		avg := bkt.DefaultPKnown
		if len(vals) > 0 {
			sum := 0.0
			for _, v := range vals {
				sum += v
			}
			avg = sum / float64(len(vals))
		} else if d == days {
			items, _ := m.ListMasteryItems(studentID)
			if len(items) > 0 {
				sum := 0.0
				for _, it := range items {
					sum += it.PKnown
				}
				avg = sum / float64(len(items))
			}
		}
		trend = append(trend, model.TrendPoint{Date: day, AvgMastery: avg})
	}
	return trend, nil
}

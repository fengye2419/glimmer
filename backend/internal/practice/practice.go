package practice

import (
	"math"
	"sort"
	"time"

	fsrs "github.com/open-spaced-repetition/go-fsrs/v3"

	"glimmer/internal/model"
	"glimmer/internal/service"
	"glimmer/internal/store"
)

// masteryReviewThreshold：掌握度首次达到该值，技能进入 FSRS 复习队列。
const masteryReviewThreshold = 0.8

type Engine struct {
	store   store.Store
	mastery *service.MasteryService
	fsrs    *fsrs.FSRS
}

func NewEngine(s store.Store, m *service.MasteryService) *Engine {
	return &Engine{
		store:   s,
		mastery: m,
		fsrs:    fsrs.NewFSRS(fsrs.DefaultParam()),
	}
}

type PickResult struct {
	Question        *model.Question
	Reason          string
	TargetSkillID   string
	TargetSkillName string
}

func (e *Engine) NextQuestion(studentID string) (*model.Question, error) {
	pick, err := e.NextQuestionWithMeta(studentID)
	if err != nil || pick == nil {
		return nil, err
	}
	return pick.Question, nil
}

func (e *Engine) NextQuestionWithMeta(studentID string) (*PickResult, error) {
	questions, err := e.store.ListQuestions()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	schedules, _ := e.store.ListReviewSchedules(studentID)
	for _, rs := range schedules {
		if !rs.NextReviewAt.After(now) {
			for _, q := range questions {
				for _, qs := range q.Skills {
					if qs.SkillID == rs.SkillID {
						skill, _ := e.store.GetSkill(rs.SkillID)
						name := rs.SkillID
						if skill != nil {
							name = skill.Name
						}
						return &PickResult{
							Question:        &q,
							Reason:          "review",
							TargetSkillID:   rs.SkillID,
							TargetSkillName: name,
						}, nil
					}
				}
			}
		}
	}

	weak, _ := e.mastery.WeakSkills(studentID, 5)
	if len(weak) > 0 {
		targetSkill := weak[0].SkillID
		best := e.pickBySkill(questions, studentID, targetSkill)
		if best != nil {
			return &PickResult{
				Question:        best,
				Reason:          "weak_skill",
				TargetSkillID:   weak[0].SkillID,
				TargetSkillName: weak[0].SkillName,
			}, nil
		}
	}

	q := e.pickZPD(questions, studentID)
	if q == nil {
		return nil, nil
	}
	skillName := ""
	skillID := ""
	if len(q.Skills) > 0 {
		skillID = q.Skills[0].SkillID
		if sk, err := e.store.GetSkill(skillID); err == nil {
			skillName = sk.Name
		}
	}
	return &PickResult{
		Question:        q,
		Reason:          "zpd",
		TargetSkillID:   skillID,
		TargetSkillName: skillName,
	}, nil
}

func (e *Engine) pickBySkill(questions []model.Question, studentID, skillID string) *model.Question {
	var candidates []model.Question
	for _, q := range questions {
		for _, qs := range q.Skills {
			if qs.SkillID == skillID {
				candidates = append(candidates, q)
				break
			}
		}
	}
	if len(candidates) == 0 {
		return nil
	}
	return e.pickZPD(candidates, studentID)
}

func (e *Engine) pickZPD(questions []model.Question, studentID string) *model.Question {
	type scored struct {
		q     model.Question
		score float64
	}
	var list []scored
	for _, q := range questions {
		pKnown := 0.5
		if len(q.Skills) > 0 {
			state, _ := e.mastery.GetOrInitMastery(studentID, q.Skills[0].SkillID)
			pKnown = state.PKnown
		}
		targetDiff := int(math.Round((1-pKnown)*4)) + 1
		if targetDiff < 1 {
			targetDiff = 1
		}
		if targetDiff > 5 {
			targetDiff = 5
		}
		diff := math.Abs(float64(q.Difficulty - targetDiff))
		list = append(list, scored{q: q, score: diff})
	}
	sort.Slice(list, func(i, j int) bool {
		return list[i].score < list[j].score
	})
	if len(list) == 0 {
		return nil
	}
	return &list[0].q
}

// UpdateReviewSchedule 用 FSRS（go-fsrs）调度复习。
// FSRS 负责「何时复习」（基于难度/稳定性/可提取性），BKT 负责「掌握到何种程度」，两者通过本表协作。
// 评级映射：答对 → Good，答错 → Again（FSRS 会自动重置稳定性）。
func (e *Engine) UpdateReviewSchedule(studentID, skillID string, correct bool, pKnown float64) error {
	rs, _ := e.findSchedule(studentID, skillID)
	now := time.Now()

	// 掌握度尚未达标且还没进过复习队列：暂不调度。
	if rs == nil && pKnown < masteryReviewThreshold {
		return nil
	}

	if rs == nil {
		rs = &model.ReviewSchedule{
			StudentID: studentID,
			SkillID:   skillID,
			Card:      fsrs.NewCard(),
		}
	}

	rating := fsrs.Good
	if !correct {
		rating = fsrs.Again
	}
	info := e.fsrs.Next(rs.Card, now, rating)
	rs.Card = info.Card
	rs.NextReviewAt = info.Card.Due
	rs.Stage = int(info.Card.Reps)
	return e.store.UpsertReviewSchedule(*rs)
}

func (e *Engine) findSchedule(studentID, skillID string) (*model.ReviewSchedule, error) {
	schedules, err := e.store.ListReviewSchedules(studentID)
	if err != nil {
		return nil, err
	}
	for i := range schedules {
		if schedules[i].StudentID == studentID && schedules[i].SkillID == skillID {
			return &schedules[i], nil
		}
	}
	return nil, nil
}

func (e *Engine) DueReviews(studentID string) ([]model.DueReview, error) {
	schedules, err := e.store.ListReviewSchedules(studentID)
	if err != nil {
		return nil, err
	}
	now := time.Now()
	var due []model.DueReview
	for _, rs := range schedules {
		if !rs.NextReviewAt.After(now) {
			skill, _ := e.store.GetSkill(rs.SkillID)
			name := rs.SkillID
			if skill != nil {
				name = skill.Name
			}
			due = append(due, model.DueReview{
				SkillID:   rs.SkillID,
				SkillName: name,
				Stage:     rs.Stage,
			})
		}
	}
	return due, nil
}

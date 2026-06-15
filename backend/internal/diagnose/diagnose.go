package diagnose

import (
	"glimmer/internal/model"
	"glimmer/internal/store"
)

type Engine struct {
	store store.Store
}

func NewEngine(s store.Store) *Engine {
	return &Engine{store: s}
}

// SelectQuestions picks up to 12 questions covering distinct primary skills.
func (e *Engine) SelectQuestions() ([]model.Question, error) {
	questions, err := e.store.ListQuestions()
	if err != nil {
		return nil, err
	}
	skills, err := e.store.ListSkills()
	if err != nil {
		return nil, err
	}

	covered := map[string]bool{}
	var selected []model.Question

	for _, sk := range skills {
		if covered[sk.ID] {
			continue
		}
		for _, q := range questions {
			for _, qs := range q.Skills {
				if qs.SkillID == sk.ID {
					selected = append(selected, q)
					covered[sk.ID] = true
					break
				}
			}
			if covered[sk.ID] {
				break
			}
		}
		if len(selected) >= 12 {
			break
		}
	}

	if len(selected) < 12 {
		used := map[string]bool{}
		for _, q := range selected {
			used[q.ID] = true
		}
		for _, q := range questions {
			if used[q.ID] {
				continue
			}
			selected = append(selected, q)
			if len(selected) >= 12 {
				break
			}
		}
	}
	return selected, nil
}

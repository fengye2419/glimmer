package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"glimmer/internal/model"
)

type JSONStore struct {
	baseDir string
	mu      sync.Mutex

	skills    []model.Skill
	questions []model.Question

	students       []model.Student
	masteryStates  []model.MasteryState
	attempts       []model.Attempt
	reviewSchedule []model.ReviewSchedule
	tutorSessions  []model.TutorSession
}

func NewJSONStore(baseDir string) (*JSONStore, error) {
	s := &JSONStore{baseDir: baseDir}
	if err := s.load(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *JSONStore) load() error {
	if err := s.readJSON(filepath.Join(s.baseDir, "static", "skills.json"), &s.skills); err != nil {
		return fmt.Errorf("load skills: %w", err)
	}
	if err := s.readJSON(filepath.Join(s.baseDir, "static", "questions.json"), &s.questions); err != nil {
		return fmt.Errorf("load questions: %w", err)
	}
	_ = s.readJSON(filepath.Join(s.baseDir, "runtime", "students.json"), &s.students)
	_ = s.readJSON(filepath.Join(s.baseDir, "runtime", "mastery_states.json"), &s.masteryStates)
	_ = s.readJSON(filepath.Join(s.baseDir, "runtime", "attempts.json"), &s.attempts)
	_ = s.readJSON(filepath.Join(s.baseDir, "runtime", "review_schedule.json"), &s.reviewSchedule)
	_ = s.readJSON(filepath.Join(s.baseDir, "runtime", "tutor_sessions.json"), &s.tutorSessions)
	return nil
}

func (s *JSONStore) readJSON(path string, v any) error {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	if len(data) == 0 {
		return nil
	}
	return json.Unmarshal(data, v)
}

func (s *JSONStore) writeJSON(path string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func (s *JSONStore) ListSkills() ([]model.Skill, error) {
	return s.skills, nil
}

func (s *JSONStore) GetSkill(id string) (*model.Skill, error) {
	for i := range s.skills {
		if s.skills[i].ID == id {
			return &s.skills[i], nil
		}
	}
	return nil, fmt.Errorf("skill not found: %s", id)
}

func (s *JSONStore) ListQuestions() ([]model.Question, error) {
	return s.questions, nil
}

func (s *JSONStore) GetQuestion(id string) (*model.Question, error) {
	for i := range s.questions {
		if s.questions[i].ID == id {
			return &s.questions[i], nil
		}
	}
	return nil, fmt.Errorf("question not found: %s", id)
}

func (s *JSONStore) ListStudents() ([]model.Student, error) {
	return s.students, nil
}

func (s *JSONStore) CreateStudent(st model.Student) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.students = append(s.students, st)
	return s.writeJSON(filepath.Join(s.baseDir, "runtime", "students.json"), s.students)
}

func (s *JSONStore) GetStudent(id string) (*model.Student, error) {
	for i := range s.students {
		if s.students[i].ID == id {
			return &s.students[i], nil
		}
	}
	return nil, fmt.Errorf("student not found: %s", id)
}

func (s *JSONStore) ListMastery(studentID string) ([]model.MasteryState, error) {
	var out []model.MasteryState
	for _, m := range s.masteryStates {
		if m.StudentID == studentID {
			out = append(out, m)
		}
	}
	return out, nil
}

func (s *JSONStore) GetMastery(studentID, skillID string) (*model.MasteryState, error) {
	for i := range s.masteryStates {
		if s.masteryStates[i].StudentID == studentID && s.masteryStates[i].SkillID == skillID {
			return &s.masteryStates[i], nil
		}
	}
	return nil, nil
}

func (s *JSONStore) UpsertMastery(state model.MasteryState) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	found := false
	for i := range s.masteryStates {
		if s.masteryStates[i].StudentID == state.StudentID && s.masteryStates[i].SkillID == state.SkillID {
			s.masteryStates[i] = state
			found = true
			break
		}
	}
	if !found {
		s.masteryStates = append(s.masteryStates, state)
	}
	return s.writeJSON(filepath.Join(s.baseDir, "runtime", "mastery_states.json"), s.masteryStates)
}

func (s *JSONStore) SaveAttempt(a model.Attempt) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.attempts = append(s.attempts, a)
	return s.writeJSON(filepath.Join(s.baseDir, "runtime", "attempts.json"), s.attempts)
}

func (s *JSONStore) ListAttempts(studentID string, since time.Time) ([]model.Attempt, error) {
	var out []model.Attempt
	for _, a := range s.attempts {
		if a.StudentID == studentID && !a.CreatedAt.Before(since) {
			out = append(out, a)
		}
	}
	return out, nil
}

func (s *JSONStore) ListReviewSchedules(studentID string) ([]model.ReviewSchedule, error) {
	var out []model.ReviewSchedule
	for _, r := range s.reviewSchedule {
		if r.StudentID == studentID {
			out = append(out, r)
		}
	}
	return out, nil
}

func (s *JSONStore) UpsertReviewSchedule(rs model.ReviewSchedule) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	found := false
	for i := range s.reviewSchedule {
		if s.reviewSchedule[i].StudentID == rs.StudentID && s.reviewSchedule[i].SkillID == rs.SkillID {
			s.reviewSchedule[i] = rs
			found = true
			break
		}
	}
	if !found {
		s.reviewSchedule = append(s.reviewSchedule, rs)
	}
	return s.writeJSON(filepath.Join(s.baseDir, "runtime", "review_schedule.json"), s.reviewSchedule)
}

func (s *JSONStore) CreateTutorSession(sess model.TutorSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.tutorSessions = append(s.tutorSessions, sess)
	return s.writeJSON(filepath.Join(s.baseDir, "runtime", "tutor_sessions.json"), s.tutorSessions)
}

func (s *JSONStore) GetTutorSession(id string) (*model.TutorSession, error) {
	for i := range s.tutorSessions {
		if s.tutorSessions[i].ID == id {
			return &s.tutorSessions[i], nil
		}
	}
	return nil, fmt.Errorf("tutor session not found: %s", id)
}

func (s *JSONStore) UpdateTutorSession(sess model.TutorSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for i := range s.tutorSessions {
		if s.tutorSessions[i].ID == sess.ID {
			s.tutorSessions[i] = sess
			return s.writeJSON(filepath.Join(s.baseDir, "runtime", "tutor_sessions.json"), s.tutorSessions)
		}
	}
	return fmt.Errorf("tutor session not found: %s", sess.ID)
}

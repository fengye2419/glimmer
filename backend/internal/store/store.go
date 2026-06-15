package store

import (
	"time"

	"glimmer/internal/model"
)

type Store interface {
	ListSkills() ([]model.Skill, error)
	GetSkill(id string) (*model.Skill, error)
	ListQuestions() ([]model.Question, error)
	GetQuestion(id string) (*model.Question, error)

	ListStudents() ([]model.Student, error)
	CreateStudent(s model.Student) error
	GetStudent(id string) (*model.Student, error)

	ListMastery(studentID string) ([]model.MasteryState, error)
	GetMastery(studentID, skillID string) (*model.MasteryState, error)
	UpsertMastery(state model.MasteryState) error

	SaveAttempt(a model.Attempt) error
	ListAttempts(studentID string, since time.Time) ([]model.Attempt, error)

	ListReviewSchedules(studentID string) ([]model.ReviewSchedule, error)
	UpsertReviewSchedule(rs model.ReviewSchedule) error

	CreateTutorSession(s model.TutorSession) error
	GetTutorSession(id string) (*model.TutorSession, error)
	UpdateTutorSession(s model.TutorSession) error
}

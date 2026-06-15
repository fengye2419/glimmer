package practice

import (
	"testing"
	"time"

	"glimmer/internal/model"
	"glimmer/internal/service"
)

// fakeStore 仅实现复习调度相关方法用于测试 FSRS 接入，其余方法返回零值。
type fakeStore struct {
	schedules map[string]model.ReviewSchedule
}

func newFakeStore() *fakeStore {
	return &fakeStore{schedules: map[string]model.ReviewSchedule{}}
}

func key(studentID, skillID string) string { return studentID + "|" + skillID }

func (f *fakeStore) ListReviewSchedules(studentID string) ([]model.ReviewSchedule, error) {
	var out []model.ReviewSchedule
	for _, rs := range f.schedules {
		if rs.StudentID == studentID {
			out = append(out, rs)
		}
	}
	return out, nil
}

func (f *fakeStore) UpsertReviewSchedule(rs model.ReviewSchedule) error {
	f.schedules[key(rs.StudentID, rs.SkillID)] = rs
	return nil
}

// 以下方法为满足 store.Store 接口的占位实现，测试中不使用。
func (f *fakeStore) ListSkills() ([]model.Skill, error)            { return nil, nil }
func (f *fakeStore) GetSkill(string) (*model.Skill, error)         { return nil, nil }
func (f *fakeStore) ListQuestions() ([]model.Question, error)      { return nil, nil }
func (f *fakeStore) GetQuestion(string) (*model.Question, error)   { return nil, nil }
func (f *fakeStore) ListStudents() ([]model.Student, error)        { return nil, nil }
func (f *fakeStore) CreateStudent(model.Student) error             { return nil }
func (f *fakeStore) GetStudent(string) (*model.Student, error)     { return nil, nil }
func (f *fakeStore) ListMastery(string) ([]model.MasteryState, error) {
	return nil, nil
}
func (f *fakeStore) GetMastery(string, string) (*model.MasteryState, error) {
	return nil, nil
}
func (f *fakeStore) UpsertMastery(model.MasteryState) error { return nil }
func (f *fakeStore) SaveAttempt(model.Attempt) error        { return nil }
func (f *fakeStore) ListAttempts(string, time.Time) ([]model.Attempt, error) {
	return nil, nil
}
func (f *fakeStore) CreateTutorSession(model.TutorSession) error { return nil }
func (f *fakeStore) GetTutorSession(string) (*model.TutorSession, error) {
	return nil, nil
}
func (f *fakeStore) UpdateTutorSession(model.TutorSession) error { return nil }

func TestReviewScheduleNotCreatedBelowThreshold(t *testing.T) {
	fs := newFakeStore()
	e := NewEngine(fs, service.NewMasteryService(fs))
	if err := e.UpdateReviewSchedule("s1", "k1", true, 0.5); err != nil {
		t.Fatal(err)
	}
	if len(fs.schedules) != 0 {
		t.Fatalf("expected no schedule below mastery threshold, got %d", len(fs.schedules))
	}
}

func TestReviewScheduleCreatedAtThreshold(t *testing.T) {
	fs := newFakeStore()
	e := NewEngine(fs, service.NewMasteryService(fs))
	if err := e.UpdateReviewSchedule("s1", "k1", true, 0.85); err != nil {
		t.Fatal(err)
	}
	rs, ok := fs.schedules[key("s1", "k1")]
	if !ok {
		t.Fatal("expected schedule to be created at/above threshold")
	}
	if !rs.NextReviewAt.After(time.Now()) {
		t.Fatalf("expected next review in the future, got %v", rs.NextReviewAt)
	}
	if rs.Card.Reps == 0 {
		t.Fatal("expected FSRS card to record at least one rep")
	}
}

func TestReviewScheduleWrongAnswerSchedulesSooner(t *testing.T) {
	fs := newFakeStore()
	e := NewEngine(fs, service.NewMasteryService(fs))
	// 先建立并连续答对，把复习间隔推远。
	_ = e.UpdateReviewSchedule("s1", "k1", true, 0.85)
	_ = e.UpdateReviewSchedule("s1", "k1", true, 0.9)
	good := fs.schedules[key("s1", "k1")].NextReviewAt

	// 答错应触发 FSRS 重置（Again），下次复习显著提前。
	_ = e.UpdateReviewSchedule("s1", "k1", false, 0.9)
	again := fs.schedules[key("s1", "k1")].NextReviewAt
	if !again.Before(good) {
		t.Fatalf("expected wrong answer to schedule sooner: again=%v good=%v", again, good)
	}
}

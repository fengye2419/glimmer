package model

import (
	"time"

	fsrs "github.com/open-spaced-repetition/go-fsrs/v3"
)

type Skill struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Grade         int      `json:"grade"`
	Description   string   `json:"description"`
	Prerequisites []string `json:"prerequisites"`
}

type QuestionSkill struct {
	SkillID string  `json:"skill_id"`
	Weight  float64 `json:"weight"`
}

type Question struct {
	ID            string          `json:"id"`
	Stem          string          `json:"stem"`
	Answer        string          `json:"answer"`
	Difficulty    int             `json:"difficulty"`
	Hints         []string        `json:"hints"`
	SolutionSteps []string        `json:"solution_steps"`
	Skills        []QuestionSkill `json:"skills"`
}

type Student struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Grade     int       `json:"grade"`
	CreatedAt time.Time `json:"created_at"`
}

type MasteryState struct {
	StudentID string    `json:"student_id"`
	SkillID   string    `json:"skill_id"`
	PKnown    float64   `json:"p_known"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Attempt struct {
	ID         string    `json:"id"`
	StudentID  string    `json:"student_id"`
	QuestionID string    `json:"question_id"`
	Correct    bool      `json:"correct"`
	DurationMs int       `json:"duration_ms"`
	Context    string    `json:"context"`
	CreatedAt  time.Time `json:"created_at"`
}

// ReviewSchedule 间隔重复调度。NextReviewAt/Stage 供前端展示与选题，
// Card 持有 FSRS（go-fsrs）算法状态，是排期的真相源。
type ReviewSchedule struct {
	StudentID    string    `json:"student_id"`
	SkillID      string    `json:"skill_id"`
	NextReviewAt time.Time `json:"next_review_at"`
	Stage        int       `json:"stage"`
	Card         fsrs.Card `json:"card"`
}

type TutorMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type TutorSession struct {
	ID         string         `json:"id"`
	StudentID  string         `json:"student_id"`
	QuestionID string         `json:"question_id"`
	State      string         `json:"state"`
	Messages   []TutorMessage `json:"messages"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

type WeakSkill struct {
	SkillID   string  `json:"skill_id"`
	SkillName string  `json:"skill_name"`
	PKnown    float64 `json:"p_known"`
}

type RootCause struct {
	SkillID   string   `json:"skill_id"`
	SkillName string   `json:"skill_name"`
	PKnown    float64  `json:"p_known"`
	Chain     []string `json:"chain"`
}

type MasteryItem struct {
	SkillID   string  `json:"skill_id"`
	SkillName string  `json:"skill_name"`
	PKnown    float64 `json:"p_known"`
}

type DashboardStats struct {
	TotalAttempts int     `json:"total_attempts"`
	CorrectCount  int     `json:"correct_count"`
	Accuracy      float64 `json:"accuracy"`
	HasDiagnosed  bool    `json:"has_diagnosed"`
	AvgMastery    float64 `json:"avg_mastery"`
}

type Dashboard struct {
	Student       Student        `json:"student"`
	Stats         DashboardStats `json:"stats"`
	MasteryMap    []MasteryItem  `json:"mastery_map"`
	WeakSkills    []WeakSkill    `json:"weak_skills"`
	DueReviews    []DueReview    `json:"due_reviews"`
	Trend         []TrendPoint   `json:"trend"`
	OllamaHealthy bool           `json:"ollama_healthy"`
}

type PracticeNext struct {
	ID              string `json:"id"`
	Stem            string `json:"stem"`
	Difficulty      int    `json:"difficulty"`
	Reason          string `json:"reason"`
	TargetSkillID   string `json:"target_skill_id,omitempty"`
	TargetSkillName string `json:"target_skill_name,omitempty"`
}

type DueReview struct {
	SkillID   string `json:"skill_id"`
	SkillName string `json:"skill_name"`
	Stage     int    `json:"stage"`
}

type TrendPoint struct {
	Date       string  `json:"date"`
	AvgMastery float64 `json:"avg_mastery"`
}

type SubmitResult struct {
	Correct       bool          `json:"correct"`
	Feedback      string        `json:"feedback"`
	UpdatedSkills []MasteryItem `json:"updated_skills"`
	RootCauses    []RootCause   `json:"root_causes,omitempty"`
}

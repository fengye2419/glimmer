package api

import (
	"net/http"
	"time"


	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"glimmer/internal/diagnose"
	"glimmer/internal/model"
	"glimmer/internal/practice"
	"glimmer/internal/service"
	"glimmer/internal/store"
	"glimmer/internal/tutor"
)

type Handler struct {
	store    store.Store
	mastery  *service.MasteryService
	diagnose *diagnose.Engine
	practice *practice.Engine
	tutor    *tutor.Engine
}

func nonNilSlice[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}

func NewHandler(s store.Store, ollamaURL, ollamaModel string) *Handler {
	m := service.NewMasteryService(s)
	return &Handler{
		store:    s,
		mastery:  m,
		diagnose: diagnose.NewEngine(s),
		practice: practice.NewEngine(s, m),
		tutor:    tutor.NewEngine(s, ollamaURL, ollamaModel),
	}
}

func (h *Handler) Register(r *gin.Engine) {
	api := r.Group("/api")
	api.GET("/health", h.health)
	api.GET("/skills/graph", h.skillsGraph)
	api.GET("/students", h.listStudents)
	api.POST("/students", h.createStudent)
	api.GET("/students/:id", h.getStudent)
	api.GET("/students/:id/dashboard", h.dashboard)
	api.GET("/questions/:id", h.getQuestion)
	api.POST("/students/:id/diagnose/start", h.diagnoseStart)
	api.POST("/students/:id/diagnose/submit", h.submitAnswer("diagnose"))
	api.GET("/students/:id/practice/next", h.practiceNext)
	api.POST("/students/:id/practice/submit", h.submitAnswer("practice"))
	api.POST("/students/:id/tutor/sessions", h.createTutorSession)
	api.POST("/students/:id/tutor/sessions/:sid/chat", h.tutorChat)
}

func (h *Handler) health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":         "ok",
		"ollama_healthy": h.tutor.Healthy(),
	})
}

func (h *Handler) skillsGraph(c *gin.Context) {
	skills, err := h.store.ListSkills()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"skills": skills})
}

func (h *Handler) listStudents(c *gin.Context) {
	students, err := h.store.ListStudents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"students": students})
}

type createStudentReq struct {
	Name  string `json:"name"`
	Grade int    `json:"grade"`
}

func (h *Handler) createStudent(c *gin.Context) {
	var req createStudentReq
	if err := c.ShouldBindJSON(&req); err != nil || req.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name required"})
		return
	}
	if req.Grade == 0 {
		req.Grade = 5
	}
	st := model.Student{
		ID:        uuid.New().String(),
		Name:      req.Name,
		Grade:     req.Grade,
		CreatedAt: time.Now(),
	}
	if err := h.store.CreateStudent(st); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, st)
}

func (h *Handler) getStudent(c *gin.Context) {
	st, err := h.store.GetStudent(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}
	c.JSON(http.StatusOK, st)
}

func (h *Handler) getQuestion(c *gin.Context) {
	q, err := h.store.GetQuestion(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id":         q.ID,
		"stem":       q.Stem,
		"difficulty": q.Difficulty,
	})
}

func (h *Handler) dashboard(c *gin.Context) {
	id := c.Param("id")
	st, err := h.store.GetStudent(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}
	mastery, _ := h.mastery.ListMasteryItems(id)
	weak, _ := h.mastery.WeakSkills(id, 3)
	due, _ := h.practice.DueReviews(id)
	trend, _ := h.mastery.Trend(id, 7)
	stats := h.buildStats(id, mastery)
	c.JSON(http.StatusOK, model.Dashboard{
		Student:       *st,
		Stats:         stats,
		MasteryMap:    nonNilSlice(mastery),
		WeakSkills:    nonNilSlice(weak),
		DueReviews:    nonNilSlice(due),
		Trend:         nonNilSlice(trend),
		OllamaHealthy: h.tutor.Healthy(),
	})
}

func (h *Handler) buildStats(studentID string, mastery []model.MasteryItem) model.DashboardStats {
	attempts, _ := h.store.ListAttempts(studentID, time.Time{})
	total := len(attempts)
	correct := 0
	hasDiagnosed := false
	for _, a := range attempts {
		if a.Correct {
			correct++
		}
		if a.Context == "diagnose" {
			hasDiagnosed = true
		}
	}
	accuracy := 0.0
	if total > 0 {
		accuracy = float64(correct) / float64(total)
	}
	avg := 0.5
	if len(mastery) > 0 {
		sum := 0.0
		for _, m := range mastery {
			sum += m.PKnown
		}
		avg = sum / float64(len(mastery))
	}
	return model.DashboardStats{
		TotalAttempts: total,
		CorrectCount:  correct,
		Accuracy:      accuracy,
		HasDiagnosed:  hasDiagnosed,
		AvgMastery:    avg,
	}
}

func (h *Handler) diagnoseStart(c *gin.Context) {
	qs, err := h.diagnose.SelectQuestions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	type qBrief struct {
		ID         string `json:"id"`
		Stem       string `json:"stem"`
		Difficulty int    `json:"difficulty"`
	}
	var brief []qBrief
	for _, q := range qs {
		brief = append(brief, qBrief{ID: q.ID, Stem: q.Stem, Difficulty: q.Difficulty})
	}
	c.JSON(http.StatusOK, gin.H{"questions": brief})
}

type submitReq struct {
	QuestionID string `json:"question_id"`
	Answer     string `json:"answer"`
	DurationMs int    `json:"duration_ms"`
}

func (h *Handler) submitAnswer(ctx string) gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.Param("id")
		var req submitReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}
		q, err := h.store.GetQuestion(req.QuestionID)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
			return
		}
		result, err := h.mastery.CheckAndUpdate(studentID, q, req.Answer, req.DurationMs, ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		for _, sk := range result.UpdatedSkills {
			_ = h.practice.UpdateReviewSchedule(studentID, sk.SkillID, result.Correct, sk.PKnown)
		}
		c.JSON(http.StatusOK, result)
	}
}

func (h *Handler) practiceNext(c *gin.Context) {
	id := c.Param("id")
	pick, err := h.practice.NextQuestionWithMeta(id)
	if err != nil || pick == nil || pick.Question == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no question available"})
		return
	}
	q := pick.Question
	c.JSON(http.StatusOK, model.PracticeNext{
		ID:              q.ID,
		Stem:            q.Stem,
		Difficulty:      q.Difficulty,
		Reason:          pick.Reason,
		TargetSkillID:   pick.TargetSkillID,
		TargetSkillName: pick.TargetSkillName,
	})
}

type createTutorReq struct {
	QuestionID string `json:"question_id"`
}

func (h *Handler) createTutorSession(c *gin.Context) {
	studentID := c.Param("id")
	var req createTutorReq
	if err := c.ShouldBindJSON(&req); err != nil || req.QuestionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "question_id required"})
		return
	}
	sess, err := h.tutor.CreateSession(studentID, req.QuestionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	q, _ := h.store.GetQuestion(req.QuestionID)
	resp := gin.H{
		"id":          sess.ID,
		"student_id":  sess.StudentID,
		"question_id": sess.QuestionID,
		"state":       sess.State,
		"messages":    sess.Messages,
		"created_at":  sess.CreatedAt,
		"updated_at":  sess.UpdatedAt,
	}
	if q != nil {
		resp["question_stem"] = q.Stem
	}
	c.JSON(http.StatusOK, resp)
}

type chatReq struct {
	Message string `json:"message"`
}

func (h *Handler) tutorChat(c *gin.Context) {
	sid := c.Param("sid")
	studentID := c.Param("id")
	var req chatReq
	_ = c.ShouldBindJSON(&req)

	weak, _ := h.mastery.WeakSkills(studentID, 3)
	var weakNames []string
	for _, w := range weak {
		weakNames = append(weakNames, w.SkillName)
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	if err := h.tutor.ChatStream(sid, req.Message, weakNames, c.Writer); err != nil {
		c.SSEvent("error", err.Error())
	}
}

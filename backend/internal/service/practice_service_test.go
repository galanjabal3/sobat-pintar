package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"testing"
	"time"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/pkg/gemini"
)

type fakePracticeRepo struct {
	session        *model.PracticeSession
	questions      []*model.Question
	completedScore *int
}

func (r *fakePracticeRepo) CreateSession(ctx context.Context, session *model.PracticeSession) error {
	r.session = session
	return nil
}

func (r *fakePracticeRepo) GetSessionByID(ctx context.Context, id string) (*model.PracticeSession, error) {
	if r.session == nil || r.session.ID != id {
		return nil, errors.New("session not found")
	}
	return r.session, nil
}

func (r *fakePracticeRepo) GetHistoryByUserID(ctx context.Context, userID string) ([]*model.PracticeSession, error) {
	return nil, nil
}

func (r *fakePracticeRepo) CreateQuestions(ctx context.Context, questions []*model.Question) error {
	r.questions = questions
	return nil
}

func (r *fakePracticeRepo) GetQuestionsBySessionID(ctx context.Context, sessionID string) ([]*model.Question, error) {
	return r.questions, nil
}

func (r *fakePracticeRepo) GetQuestionByID(ctx context.Context, questionID string) (*model.Question, error) {
	for _, question := range r.questions {
		if question.ID == questionID {
			return question, nil
		}
	}
	return nil, errors.New("question not found")
}

func (r *fakePracticeRepo) UpdateQuestionAnswer(ctx context.Context, questionID string, userAnswer string, isCorrect bool) error {
	for _, question := range r.questions {
		if question.ID == questionID {
			question.UserAnswer = &userAnswer
			question.IsCorrect = &isCorrect
			return nil
		}
	}
	return errors.New("question not found")
}

func (r *fakePracticeRepo) CompleteSession(ctx context.Context, sessionID string, score int) error {
	r.completedScore = &score
	now := time.Now()
	r.session.CompletedAt = &now
	r.session.Score = sql.NullInt64{Int64: int64(score), Valid: true}
	return nil
}

func (r *fakePracticeRepo) CountQuestionsAnsweredToday(ctx context.Context, userID string) (int, error) {
	return 0, nil
}

type fakePracticeGamify struct {
	points       int
	activityType string
}

func (g *fakePracticeGamify) GetUserPoints(ctx context.Context, userID string) (int, error) {
	return g.points, nil
}

func (g *fakePracticeGamify) AddPoints(ctx context.Context, userID string, points int, activityType string) error {
	g.points += points
	g.activityType = activityType
	return nil
}

func (g *fakePracticeGamify) ListBadges(ctx context.Context, userID string) ([]dto.BadgeResponse, error) {
	return nil, nil
}

func (g *fakePracticeGamify) GetLeaderboard(ctx context.Context) ([]dto.LeaderboardResponse, error) {
	return nil, nil
}

func (g *fakePracticeGamify) AwardBadge(ctx context.Context, userID, badgeID string) error {
	return nil
}

type fakePracticeQuota struct {
	consumeCalls int
	refundCalls  int
}

func (q *fakePracticeQuota) Consume(ctx context.Context, userID, feature string, limit int) error {
	q.consumeCalls++
	return nil
}

func (q *fakePracticeQuota) Refund(ctx context.Context, userID, feature string) error {
	q.refundCalls++
	return nil
}

func (q *fakePracticeQuota) GetDailyUsage(ctx context.Context, userID string) (*dto.AIQuotaResponse, error) {
	return &dto.AIQuotaResponse{}, nil
}

func TestPracticeFinishSessionCalculatesScoreAndAwardsPoints(t *testing.T) {
	repo := &fakePracticeRepo{
		session: &model.PracticeSession{
			ID:         "session-1",
			UserID:     "user-1",
			Subject:    "Matematika",
			Difficulty: "mudah",
		},
		questions: []*model.Question{
			practiceQuestion("q1", "session-1", answered("A"), boolPtr(true)),
			practiceQuestion("q2", "session-1", answered("B"), boolPtr(false)),
			practiceQuestion("q3", "session-1", answered("C"), boolPtr(true)),
		},
	}
	gamify := &fakePracticeGamify{}
	service := NewPracticeService(repo, nil, nil, gamify, nil)

	result, err := service.FinishSession(context.Background(), "user-1", "session-1")
	if err != nil {
		t.Fatalf("FinishSession returned error: %v", err)
	}

	if result.Score != 66 {
		t.Fatalf("expected score 66, got %d", result.Score)
	}
	if result.CorrectAnswers != 2 {
		t.Fatalf("expected 2 correct answers, got %d", result.CorrectAnswers)
	}
	if repo.completedScore == nil || *repo.completedScore != 66 {
		t.Fatalf("expected repository completion score 66, got %v", repo.completedScore)
	}
	if gamify.points != 66 || gamify.activityType != "practice_completion" {
		t.Fatalf("expected 66 practice points, got points=%d activity=%s", gamify.points, gamify.activityType)
	}
}

func TestPracticeGetResultRejectsIncompleteSession(t *testing.T) {
	repo := &fakePracticeRepo{
		session: &model.PracticeSession{
			ID:         "session-1",
			UserID:     "user-1",
			Subject:    "IPA",
			Difficulty: "mudah",
		},
		questions: []*model.Question{
			practiceQuestion("q1", "session-1", answered("A"), boolPtr(true)),
			practiceQuestion("q2", "session-1", nil, nil),
		},
	}
	service := NewPracticeService(repo, nil, nil, &fakePracticeGamify{}, nil)

	_, err := service.GetResult(context.Background(), "user-1", "session-1")
	if err == nil {
		t.Fatal("expected incomplete session error")
	}
	if err.Error() != "practice session is not complete" {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.completedScore != nil {
		t.Fatalf("expected incomplete session to remain uncompleted, got score %d", *repo.completedScore)
	}
}

func TestPracticeStartSessionRejectsLongSubject(t *testing.T) {
	service := NewPracticeService(nil, nil, nil, nil, nil)

	_, err := service.StartSession(context.Background(), "user-1", "SD", dto.StartPracticeRequest{
		Subject:    strings.Repeat("a", MaxPracticeSubjectChars+1),
		Difficulty: "mudah",
		Level:      "SD",
	})
	if err == nil {
		t.Fatal("expected long subject error")
	}
	if !errors.Is(err, ErrPracticeSubjectTooLong) {
		t.Fatalf("unexpected error: %v", err)
	}
}

type failingPracticeGemini struct{}

func (f *failingPracticeGemini) GeneratePracticeQuestions(ctx context.Context, level, subject, difficulty string, count int) ([]gemini.PracticeQuestion, error) {
	return nil, errors.New("gemini failed")
}

func TestPracticeStartSessionRefundsQuotaOnGeminiFailure(t *testing.T) {
	repo := &fakePracticeRepo{}
	quota := &fakePracticeQuota{}
	service := NewPracticeService(repo, nil, &failingPracticeGemini{}, &fakePracticeGamify{}, quota)

	_, err := service.StartSession(context.Background(), "user-1", "SD", dto.StartPracticeRequest{
		Subject:    "Matematika",
		Difficulty: "mudah",
		Level:      "SD",
	})
	if err == nil {
		t.Fatal("expected gemini failure")
	}

	if quota.consumeCalls != 1 {
		t.Fatalf("expected one quota consume call, got %d", quota.consumeCalls)
	}
	if quota.refundCalls != 1 {
		t.Fatalf("expected one quota refund call, got %d", quota.refundCalls)
	}
}

func practiceQuestion(id, sessionID string, userAnswer *string, isCorrect *bool) *model.Question {
	return &model.Question{
		ID:            id,
		SessionID:     sessionID,
		QuestionText:  "Pertanyaan",
		Options:       model.QuestionOptions{"A": "A", "B": "B"},
		CorrectAnswer: "A",
		UserAnswer:    userAnswer,
		IsCorrect:     isCorrect,
		Explanation:   "Pembahasan",
	}
}

func answered(value string) *string {
	return &value
}

func boolPtr(value bool) *bool {
	return &value
}

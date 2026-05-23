package service

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
	"sobat-pintar/pkg/logger"
)

type PracticeService interface {
	StartSession(ctx context.Context, userID, level string, req dto.StartPracticeRequest) (*dto.StartPracticeResponse, error)
	GetSession(ctx context.Context, userID, sessionID string) (*dto.PracticeSessionResponse, error)
	SubmitAnswer(ctx context.Context, userID string, req dto.SubmitAnswerRequest) (*dto.SubmitAnswerResponse, error)
	FinishSession(ctx context.Context, userID, sessionID string) (*dto.PracticeResultResponse, error)
	GetResult(ctx context.Context, userID, sessionID string) (*dto.PracticeResultResponse, error)
	GetHistory(ctx context.Context, userID string) ([]*model.PracticeSession, error)
	GetDailyProgress(ctx context.Context, userID string) (int, error)
}

type practiceGenerator interface {
	GeneratePracticeQuestions(ctx context.Context, level, subject, difficulty string, count int, sourceContent string) ([]gemini.PracticeQuestion, error)
}

func (s *practiceService) GetHistory(ctx context.Context, userID string) ([]*model.PracticeSession, error) {
	return s.repo.GetHistoryByUserID(ctx, userID)
}

type practiceService struct {
	repo         repository.PracticeRepository
	userRepo     repository.UserRepository
	geminiClient practiceGenerator
	gamify       GamificationService
	quota        AIQuotaService
}

func NewPracticeService(repo repository.PracticeRepository, userRepo repository.UserRepository, geminiClient practiceGenerator, gamify GamificationService, quota AIQuotaService) PracticeService {
	return &practiceService{
		repo:         repo,
		userRepo:     userRepo,
		geminiClient: geminiClient,
		gamify:       gamify,
		quota:        quota,
	}
}

func (s *practiceService) StartSession(ctx context.Context, userID, level string, req dto.StartPracticeRequest) (*dto.StartPracticeResponse, error) {
	if err := validatePracticeSubject(req.Subject); err != nil {
		return nil, err
	}
	if err := validatePracticeSourceContent(req.SourceContent); err != nil {
		return nil, err
	}
	count, err := normalizePracticeQuestionCount(req.QuestionCount)
	if err != nil {
		return nil, err
	}

	// 1. Generate questions via Gemini
	if err := s.consumeAIQuota(ctx, userID, AIFeaturePractice, PracticeDailyQuota); err != nil {
		return nil, err
	}

	aiQuestions, err := s.geminiClient.GeneratePracticeQuestions(ctx, level, req.Subject, req.Difficulty, count, req.SourceContent)
	if err != nil {
		if refundErr := s.refundAIQuota(ctx, userID, AIFeaturePractice); refundErr != nil {
			return nil, fmt.Errorf("failed to generate content: %w (quota refund failed: %v)", err, refundErr)
		}
		return nil, err
	}

	// 2. Create session
	session := &model.PracticeSession{
		ID:         uuid.New().String(),
		UserID:     userID,
		Subject:    req.Subject,
		Difficulty: req.Difficulty,
		CreatedAt:  time.Now(),
	}
	if err := s.repo.CreateSession(ctx, session); err != nil {
		if refundErr := s.refundAIQuota(ctx, userID, AIFeaturePractice); refundErr != nil {
			return nil, fmt.Errorf("failed to create practice session: %w (quota refund failed: %v)", err, refundErr)
		}
		return nil, err
	}

	// 3. Save questions
	var questions []*model.Question

	for _, q := range aiQuestions {
		question := &model.Question{
			ID:            uuid.New().String(),
			SessionID:     session.ID,
			QuestionText:  q.Question,
			Options:       q.Options,
			CorrectAnswer: q.CorrectAnswer,
			Explanation:   q.Explanation,
		}
		questions = append(questions, question)
	}

	if err := s.repo.CreateQuestions(ctx, questions); err != nil {
		if refundErr := s.refundAIQuota(ctx, userID, AIFeaturePractice); refundErr != nil {
			return nil, fmt.Errorf("failed to create practice questions: %w (quota refund failed: %v)", err, refundErr)
		}
		return nil, err
	}

	resQuestions := make([]*dto.PracticeQuestionResponse, 0, len(questions))
	for _, q := range questions {
		resQuestions = append(resQuestions, toPracticeQuestionResponse(q))
	}

	return &dto.StartPracticeResponse{
		SessionID: session.ID,
		Questions: resQuestions,
	}, nil
}

func (s *practiceService) GetSession(ctx context.Context, userID, sessionID string) (*dto.PracticeSessionResponse, error) {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if session.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	questions, err := s.repo.GetQuestionsBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	resQuestions := make([]*dto.PracticeQuestionResponse, 0, len(questions))
	for _, q := range questions {
		resQuestions = append(resQuestions, toPracticeQuestionResponse(q))
	}

	return &dto.PracticeSessionResponse{
		SessionID:   session.ID,
		Subject:     session.Subject,
		Difficulty:  session.Difficulty,
		IsCompleted: session.CompletedAt != nil,
		Questions:   resQuestions,
	}, nil
}

func toPracticeQuestionResponse(q *model.Question) *dto.PracticeQuestionResponse {
	explanation := ""
	correctAnswer := ""
	if q.UserAnswer != nil {
		explanation = q.Explanation
		correctAnswer = q.CorrectAnswer
	}

	return &dto.PracticeQuestionResponse{
		ID:            q.ID,
		SessionID:     q.SessionID,
		QuestionText:  q.QuestionText,
		Options:       q.Options,
		UserAnswer:    q.UserAnswer,
		IsCorrect:     q.IsCorrect,
		Explanation:   explanation,
		CorrectAnswer: correctAnswer,
	}
}

func (s *practiceService) SubmitAnswer(ctx context.Context, userID string, req dto.SubmitAnswerRequest) (*dto.SubmitAnswerResponse, error) {
	question, err := s.repo.GetQuestionByID(ctx, req.QuestionID)
	if err != nil {
		return nil, fmt.Errorf("question not found")
	}

	// Verify session ownership
	session, err := s.repo.GetSessionByID(ctx, question.SessionID)
	if err != nil || session.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	isCorrect := req.Answer == question.CorrectAnswer

	err = s.repo.UpdateQuestionAnswer(ctx, req.QuestionID, req.Answer, isCorrect)
	if err != nil {
		return nil, err
	}

	return &dto.SubmitAnswerResponse{
		IsCorrect:     isCorrect,
		Explanation:   question.Explanation,
		CorrectAnswer: question.CorrectAnswer,
	}, nil
}

func (s *practiceService) GetResult(ctx context.Context, userID, sessionID string) (*dto.PracticeResultResponse, error) {
	return s.buildPracticeResult(ctx, userID, sessionID, false)
}

func (s *practiceService) FinishSession(ctx context.Context, userID, sessionID string) (*dto.PracticeResultResponse, error) {
	return s.buildPracticeResult(ctx, userID, sessionID, true)
}

func (s *practiceService) buildPracticeResult(ctx context.Context, userID, sessionID string, allowIncomplete bool) (*dto.PracticeResultResponse, error) {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if session.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	questions, err := s.repo.GetQuestionsBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	correctCount := 0
	answeredCount := 0
	for _, q := range questions {
		if q.UserAnswer != nil {
			answeredCount++
		}
		if q.IsCorrect != nil && *q.IsCorrect {
			correctCount++
		}
	}

	if !allowIncomplete && session.CompletedAt == nil && answeredCount < len(questions) {
		return nil, fmt.Errorf("practice session is not complete")
	}

	score := 0
	if len(questions) > 0 {
		score = (correctCount * 100) / len(questions)
	}

	if session.CompletedAt == nil || !session.Score.Valid {
		if err := s.repo.CompleteSession(ctx, sessionID, score); err != nil {
			return nil, err
		}
		if session.CompletedAt == nil {
			now := time.Now()
			session.CompletedAt = &now
		}
		session.Score = sql.NullInt64{Int64: int64(score), Valid: true}

		// Award points
		if score > 0 && s.gamify != nil {
			if err := s.gamify.AddPoints(ctx, userID, score, "practice_completion"); err != nil {
				logger.Error(err, "Failed to award practice points", "user_id", userID, "session_id", sessionID)
			}
		}
	} else {
		score = int(session.Score.Int64)
	}

	return &dto.PracticeResultResponse{
		SessionID:      session.ID,
		Subject:        session.Subject,
		Difficulty:     session.Difficulty,
		Score:          score,
		TotalQuestions: len(questions),
		CorrectAnswers: correctCount,
		Questions:      questions,
	}, nil
}

func (s *practiceService) GetDailyProgress(ctx context.Context, userID string) (int, error) {
	return s.repo.CountQuestionsAnsweredToday(ctx, userID)
}

func (s *practiceService) consumeAIQuota(ctx context.Context, userID, feature string, limit int) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Consume(ctx, userID, feature, limit)
}

func (s *practiceService) refundAIQuota(ctx context.Context, userID, feature string) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Refund(ctx, userID, feature)
}

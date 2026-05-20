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

func (s *practiceService) GetHistory(ctx context.Context, userID string) ([]*model.PracticeSession, error) {
	return s.repo.GetHistoryByUserID(ctx, userID)
}

type practiceService struct {
	repo         repository.PracticeRepository
	userRepo     repository.UserRepository
	geminiClient *gemini.Client
	gamify       GamificationService
}

func NewPracticeService(repo repository.PracticeRepository, userRepo repository.UserRepository, geminiClient *gemini.Client, gamify GamificationService) PracticeService {
	return &practiceService{
		repo:         repo,
		userRepo:     userRepo,
		geminiClient: geminiClient,
		gamify:       gamify,
	}
}

func (s *practiceService) StartSession(ctx context.Context, userID, level string, req dto.StartPracticeRequest) (*dto.StartPracticeResponse, error) {
	// Fixed count to 5 questions for now
	count := 5

	// 1. Generate questions via Gemini
	aiQuestions, err := s.geminiClient.GeneratePracticeQuestions(ctx, level, req.Subject, req.Difficulty, count)
	if err != nil {
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
	if q.UserAnswer != nil {
		explanation = q.Explanation
	}

	return &dto.PracticeQuestionResponse{
		ID:           q.ID,
		SessionID:    q.SessionID,
		QuestionText: q.QuestionText,
		Options:      q.Options,
		UserAnswer:   q.UserAnswer,
		IsCorrect:    q.IsCorrect,
		Explanation:  explanation,
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
		IsCorrect:   isCorrect,
		Explanation: question.Explanation,
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
		if score > 0 {
			_ = s.gamify.AddPoints(ctx, userID, score, "practice_completion")
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

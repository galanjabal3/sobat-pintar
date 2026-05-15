package service

import (
	"context"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
)
type ExplainService interface {
	Explain(ctx context.Context, userID, question, imageURL, level string) (*model.Explanation, error)
	GetHistory(ctx context.Context, userID string) ([]*model.Explanation, error)
	GetByID(ctx context.Context, id string) (*model.Explanation, error)
	ReExplain(ctx context.Context, userID, id string) (*model.Explanation, error)
}

// ... existing code

func (s *explainService) ReExplain(ctx context.Context, userID, id string) (*model.Explanation, error) {
	explanation, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if explanation.UserID != userID {
		return nil, context.DeadlineExceeded // simplified error for now
	}

	answer, err := s.geminiClient.ReExplainQuestion(ctx, explanation.QuestionText, explanation.Answer, explanation.Level)
	if err != nil {
		return nil, err
	}

	explanation.Answer = answer
	explanation.ID = uuid.New().String() // Generate new ID for the new record
	explanation.CreatedAt = time.Now()
	err = s.repo.Create(ctx, explanation) // Storing new re-explanation version
	if err != nil {
		return nil, err
	}

	return explanation, nil
}

type explainService struct {
	repo         repository.ExplainRepository
	geminiClient *gemini.Client
	gamification GamificationService
}

func NewExplainService(repo repository.ExplainRepository, geminiClient *gemini.Client, gamification GamificationService) ExplainService {
	return &explainService{
		repo:         repo,
		geminiClient: geminiClient,
		gamification: gamification,
	}
}

func (s *explainService) Explain(ctx context.Context, userID, question, imageURL, level string) (*model.Explanation, error) {
	var answer string
	var err error

	// Call Gemini (multimodal if imageURL is present)
	if imageURL != "" {
		answer, err = s.geminiClient.ExplainQuestionWithImage(ctx, question, imageURL, level)
	} else {
		answer, err = s.geminiClient.ExplainQuestion(ctx, question, level)
	}

	if err != nil {
		return nil, err
	}

	explanation := &model.Explanation{
		ID:           uuid.New().String(),
		UserID:       userID,
		QuestionText: question,
		ImageURL:     imageURL,
		Level:        level,
		Answer:       answer,
		CreatedAt:    time.Now(),
	}

	err = s.repo.Create(ctx, explanation)
	if err != nil {
		return nil, err
	}

	// Award points for using the explain feature
	_ = s.gamification.AddPoints(ctx, userID, 10, "explain_question")

	return explanation, nil
}

func (s *explainService) GetHistory(ctx context.Context, userID string) ([]*model.Explanation, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *explainService) GetByID(ctx context.Context, id string) (*model.Explanation, error) {
	return s.repo.GetByID(ctx, id)
}

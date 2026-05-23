package service

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
	"sobat-pintar/pkg/logger"
)

var ErrExplanationUnauthorized = errors.New("unauthorized explanation access")

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
		return nil, ErrExplanationUnauthorized
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureExplain, ExplainDailyQuota); err != nil {
		return nil, err
	}

	answer, err := s.geminiClient.ReExplainQuestion(ctx, explanation.QuestionText, explanation.Answer, explanation.Level)
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		return nil, err
	}

	explanation.Answer = answer
	explanation.ID = uuid.New().String() // Generate new ID for the new record
	explanation.CreatedAt = time.Now()
	err = s.repo.Create(ctx, explanation) // Storing new re-explanation version
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		return nil, err
	}

	return explanation, nil
}

type explainService struct {
	repo         repository.ExplainRepository
	geminiClient *gemini.Client
	gamification GamificationService
	quota        AIQuotaService
}

func NewExplainService(repo repository.ExplainRepository, geminiClient *gemini.Client, gamification GamificationService, quota AIQuotaService) ExplainService {
	return &explainService{
		repo:         repo,
		geminiClient: geminiClient,
		gamification: gamification,
		quota:        quota,
	}
}

func (s *explainService) Explain(ctx context.Context, userID, question, imageURL, level string) (*model.Explanation, error) {
	if err := validateExplainRequest(question, imageURL); err != nil {
		return nil, err
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureExplain, ExplainDailyQuota); err != nil {
		return nil, err
	}

	var answer string
	var err error

	// Call Gemini (multimodal if imageURL is present)
	if imageURL != "" {
		answer, err = s.geminiClient.ExplainQuestionWithImage(ctx, question, imageURL, level)
	} else {
		answer, err = s.geminiClient.ExplainQuestion(ctx, question, level)
	}

	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
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
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		return nil, err
	}

	// Award points for using the explain feature
	if s.gamification != nil {
		if err := s.gamification.AddPoints(ctx, userID, 10, "explain_question"); err != nil {
			logger.Error(err, "Failed to award explanation points", "user_id", userID, "explanation_id", explanation.ID)
		}
	}

	return explanation, nil
}

func (s *explainService) GetHistory(ctx context.Context, userID string) ([]*model.Explanation, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *explainService) GetByID(ctx context.Context, id string) (*model.Explanation, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *explainService) consumeAIQuota(ctx context.Context, userID, feature string, limit int) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Consume(ctx, userID, feature, limit)
}

func (s *explainService) refundAIQuota(ctx context.Context, userID, feature string) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Refund(ctx, userID, feature)
}

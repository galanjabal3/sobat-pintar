package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
	"sobat-pintar/pkg/logger"
)

var (
	ErrExplanationUnauthorized = errors.New("unauthorized explanation access")
	ErrAIResultNotReady        = errors.New("ai result is not ready")
)

const (
	AIResultStatusProcessing = "processing"
	AIResultStatusCompleted  = "completed"
	AIResultStatusFailed     = "failed"

	explainFailedMessage      = "Sobi belum berhasil memproses pertanyaanmu. Coba lagi sebentar lagi ya."
	explainImageFailedMessage = "Sobi belum bisa membaca gambar ini. Coba unggah ulang dengan foto yang lebih jelas ya."
)

type ExplainService interface {
	Explain(ctx context.Context, userID, question, imageURL, level string) (*model.Explanation, error)
	GetHistory(ctx context.Context, userID string) ([]*model.Explanation, error)
	GetByID(ctx context.Context, id string) (*model.Explanation, error)
	GetPublicByShareToken(ctx context.Context, token string) (*model.Explanation, error)
	CreateShareToken(ctx context.Context, userID, id string) (string, error)
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
	if explanation.Status != AIResultStatusCompleted {
		return nil, ErrAIResultNotReady
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureExplain, dailyQuotaLimit(AIFeatureExplain)); err != nil {
		return nil, err
	}

	answer, err := s.geminiClient.ReExplainQuestion(ctx, explanation.QuestionText, explanation.Answer, explanation.Level)
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		return nil, err
	}

	explanation.Answer = answer
	explanation.ID = uuid.New().String() // Generate new ID for the new record
	explanation.Status = AIResultStatusCompleted
	explanation.ErrorMessage = nil
	explanation.CreatedAt = time.Now()
	completedAt := explanation.CreatedAt
	explanation.CompletedAt = &completedAt
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

	if err := s.consumeAIQuota(ctx, userID, AIFeatureExplain, dailyQuotaLimit(AIFeatureExplain)); err != nil {
		return nil, err
	}

	explanation := &model.Explanation{
		ID:           uuid.New().String(),
		UserID:       userID,
		QuestionText: question,
		ImageURL:     imageURL,
		Level:        level,
		Answer:       "",
		Status:       AIResultStatusProcessing,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.Create(ctx, explanation); err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		return nil, err
	}

	go s.completeExplanation(context.Background(), explanation.ID, userID, question, imageURL, level)

	return explanation, nil
}

func (s *explainService) completeExplanation(ctx context.Context, id, userID, question, imageURL, level string) {
	var answer string
	var err error

	if imageURL != "" {
		answer, err = s.geminiClient.ExplainQuestionWithImage(ctx, question, imageURL, level)
	} else {
		answer, err = s.geminiClient.ExplainQuestion(ctx, question, level)
	}

	if err != nil {
		logger.Error(err, "Failed to generate explanation", "user_id", userID, "explanation_id", id)
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		if updateErr := s.repo.Fail(ctx, id, explainFailureMessage(err, imageURL)); updateErr != nil {
			logger.Error(updateErr, "Failed to mark explanation as failed", "user_id", userID, "explanation_id", id)
		}
		return
	}

	if err := s.repo.Complete(ctx, id, answer); err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureExplain), userID, AIFeatureExplain)
		logger.Error(err, "Failed to complete explanation", "user_id", userID, "explanation_id", id)
		if updateErr := s.repo.Fail(ctx, id, explainFailedMessage); updateErr != nil {
			logger.Error(updateErr, "Failed to mark explanation as failed after completion error", "user_id", userID, "explanation_id", id)
		}
		return
	}

	if s.gamification != nil {
		if err := s.gamification.AddPoints(ctx, userID, 10, "explain_question"); err != nil {
			logger.Error(err, "Failed to award explanation points", "user_id", userID, "explanation_id", id)
		}
	}
}

func explainFailureMessage(err error, imageURL string) string {
	if imageURL == "" || err == nil {
		return explainFailedMessage
	}

	message := strings.ToLower(err.Error())
	if strings.Contains(message, "image") ||
		strings.Contains(message, "fetch") ||
		strings.Contains(message, "redirect") ||
		strings.Contains(message, "mime") ||
		strings.Contains(message, "content type") {
		return explainImageFailedMessage
	}

	return explainFailedMessage
}

func (s *explainService) GetHistory(ctx context.Context, userID string) ([]*model.Explanation, error) {
	return s.repo.GetByUserID(ctx, userID)
}

func (s *explainService) GetByID(ctx context.Context, id string) (*model.Explanation, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *explainService) GetPublicByShareToken(ctx context.Context, token string) (*model.Explanation, error) {
	return s.repo.GetByShareToken(ctx, token)
}

func (s *explainService) CreateShareToken(ctx context.Context, userID, id string) (string, error) {
	explanation, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return "", err
	}
	if explanation.UserID != userID {
		return "", ErrExplanationUnauthorized
	}
	if explanation.Status != AIResultStatusCompleted {
		return "", ErrAIResultNotReady
	}
	if explanation.ShareToken != nil && *explanation.ShareToken != "" {
		return *explanation.ShareToken, nil
	}

	token, err := newShareToken()
	if err != nil {
		return "", err
	}
	if err := s.repo.SetShareToken(ctx, id, userID, token); err != nil {
		return "", err
	}
	return token, nil
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

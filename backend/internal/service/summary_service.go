package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/logger"
)

type SummaryService interface {
	CreateSummary(ctx context.Context, userID, level string, req dto.CreateSummaryRequest) (*dto.SummaryResponse, error)
	ListHistory(ctx context.Context, userID string) ([]dto.SummaryHistoryResponse, error)
	GetSummaryByID(ctx context.Context, id, userID string) (*dto.SummaryHistoryResponse, error)
	GetPublicSummaryByShareToken(ctx context.Context, token string) (*dto.SummaryHistoryResponse, error)
	CreateShareToken(ctx context.Context, userID, id string) (string, error)
	DeleteSummary(ctx context.Context, id, userID string) error
}

var ErrSummaryUnauthorized = errors.New("unauthorized summary access")

type summaryService struct {
	repo         repository.SummaryRepository
	geminiClient summaryGenerator
	gamify       GamificationService
	quota        AIQuotaService
}

type summaryGenerator interface {
	SummarizeMateri(ctx context.Context, level, content string) (string, error)
	SummarizeImageMateri(ctx context.Context, level, imageURL string) (string, error)
}

func NewSummaryService(repo repository.SummaryRepository, geminiClient summaryGenerator, gamify GamificationService, quota AIQuotaService) SummaryService {
	return &summaryService{
		repo:         repo,
		geminiClient: geminiClient,
		gamify:       gamify,
		quota:        quota,
	}
}

func (s *summaryService) CreateSummary(ctx context.Context, userID, level string, req dto.CreateSummaryRequest) (*dto.SummaryResponse, error) {
	var contentToSummarize string

	switch req.SourceType {
	case "text":
		contentToSummarize = req.Content
		if err := validateSummaryContent(contentToSummarize); err != nil {
			return nil, err
		}
	case "image":
		if err := validateSummaryImageURL(req.FileURL); err != nil {
			return nil, err
		}
	default:
		return nil, fmt.Errorf("ekstraksi dari %s belum didukung", req.SourceType)
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureSummary, SummaryDailyQuota); err != nil {
		return nil, err
	}

	var summaryText string
	var err error
	if req.SourceType == "image" {
		summaryText, err = s.geminiClient.SummarizeImageMateri(ctx, level, req.FileURL)
	} else {
		summaryText, err = s.geminiClient.SummarizeMateri(ctx, level, contentToSummarize)
	}
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSummary), userID, AIFeatureSummary)
		return nil, err
	}

	summary := &model.Summary{
		ID:         uuid.New().String(),
		UserID:     userID,
		SourceType: req.SourceType,
		FileURL:    req.FileURL,
		Content:    contentToSummarize,
		Summary:    summaryText,
		CreatedAt:  time.Now(),
	}

	if err := s.repo.Create(ctx, summary); err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSummary), userID, AIFeatureSummary)
		return nil, err
	}

	// Award points for creating a summary
	if s.gamify != nil {
		if err := s.gamify.AddPoints(ctx, userID, 15, "create_summary"); err != nil {
			logger.Error(err, "Failed to award summary points", "user_id", userID, "summary_id", summary.ID)
		}
	}

	return &dto.SummaryResponse{
		ID:        summary.ID,
		Summary:   summary.Summary,
		CreatedAt: summary.CreatedAt,
	}, nil
}

func (s *summaryService) ListHistory(ctx context.Context, userID string) ([]dto.SummaryHistoryResponse, error) {
	summaries, err := s.repo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var res []dto.SummaryHistoryResponse
	for _, s := range summaries {
		res = append(res, dto.SummaryHistoryResponse{
			ID:         s.ID,
			SourceType: s.SourceType,
			Summary:    s.Summary,
			CreatedAt:  s.CreatedAt,
		})
	}
	return res, nil
}

func (s *summaryService) GetSummaryByID(ctx context.Context, id, userID string) (*dto.SummaryHistoryResponse, error) {
	summary, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if summary.UserID != userID {
		return nil, ErrSummaryUnauthorized
	}

	return &dto.SummaryHistoryResponse{
		ID:         summary.ID,
		SourceType: summary.SourceType,
		Summary:    summary.Summary,
		CreatedAt:  summary.CreatedAt,
	}, nil
}

func (s *summaryService) GetPublicSummaryByShareToken(ctx context.Context, token string) (*dto.SummaryHistoryResponse, error) {
	summary, err := s.repo.GetByShareToken(ctx, token)
	if err != nil {
		return nil, err
	}

	return &dto.SummaryHistoryResponse{
		ID:         summary.ID,
		SourceType: summary.SourceType,
		Summary:    summary.Summary,
		CreatedAt:  summary.CreatedAt,
	}, nil
}

func (s *summaryService) CreateShareToken(ctx context.Context, userID, id string) (string, error) {
	summary, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return "", err
	}
	if summary.UserID != userID {
		return "", ErrSummaryUnauthorized
	}
	if summary.ShareToken != nil && *summary.ShareToken != "" {
		return *summary.ShareToken, nil
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

func (s *summaryService) DeleteSummary(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *summaryService) consumeAIQuota(ctx context.Context, userID, feature string, limit int) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Consume(ctx, userID, feature, limit)
}

func (s *summaryService) refundAIQuota(ctx context.Context, userID, feature string) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Refund(ctx, userID, feature)
}

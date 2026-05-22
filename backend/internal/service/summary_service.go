package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
)

type SummaryService interface {
	CreateSummary(ctx context.Context, userID, level string, req dto.CreateSummaryRequest) (*dto.SummaryResponse, error)
	ListHistory(ctx context.Context, userID string) ([]dto.SummaryHistoryResponse, error)
	GetSummaryByID(ctx context.Context, id, userID string) (*dto.SummaryHistoryResponse, error)
	GetPublicSummaryByID(ctx context.Context, id string) (*dto.SummaryHistoryResponse, error)
	DeleteSummary(ctx context.Context, id, userID string) error
}

type summaryService struct {
	repo         repository.SummaryRepository
	geminiClient *gemini.Client
	gamify       GamificationService
	quota        AIQuotaService
}

func NewSummaryService(repo repository.SummaryRepository, geminiClient *gemini.Client, gamify GamificationService, quota AIQuotaService) SummaryService {
	return &summaryService{
		repo:         repo,
		geminiClient: geminiClient,
		gamify:       gamify,
		quota:        quota,
	}
}

func (s *summaryService) CreateSummary(ctx context.Context, userID, level string, req dto.CreateSummaryRequest) (*dto.SummaryResponse, error) {
	var contentToSummarize string

	if req.SourceType == "text" {
		contentToSummarize = req.Content
		if err := validateSummaryContent(contentToSummarize); err != nil {
			return nil, err
		}
	} else {
		// TODO: Extract text from PDF or Image (Phase 4)
		return nil, fmt.Errorf("ekstraksi dari %s belum didukung", req.SourceType)
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureSummary, SummaryDailyQuota); err != nil {
		return nil, err
	}

	summaryText, err := s.geminiClient.SummarizeMateri(ctx, level, contentToSummarize)
	if err != nil {
		_ = s.refundAIQuota(ctx, userID, AIFeatureSummary)
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
		_ = s.refundAIQuota(ctx, userID, AIFeatureSummary)
		return nil, err
	}

	// Award points for creating a summary
	_ = s.gamify.AddPoints(ctx, userID, 15, "create_summary")

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
		return nil, fmt.Errorf("unauthorized")
	}

	return &dto.SummaryHistoryResponse{
		ID:         summary.ID,
		SourceType: summary.SourceType,
		Summary:    summary.Summary,
		CreatedAt:  summary.CreatedAt,
	}, nil
}

func (s *summaryService) GetPublicSummaryByID(ctx context.Context, id string) (*dto.SummaryHistoryResponse, error) {
	summary, err := s.repo.GetByID(ctx, id)
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

package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/repository"
)

const (
	AIFeatureChat     = "chat"
	AIFeatureExplain  = "explain"
	AIFeatureSummary  = "summary"
	AIFeaturePractice = "practice"
	AIFeatureSchedule = "schedule"
)

type QuotaExceededError struct {
	Feature string
	Limit   int
}

func (e *QuotaExceededError) Error() string {
	return fmt.Sprintf("%s quota exceeded", e.Feature)
}

type AIQuotaService interface {
	Consume(ctx context.Context, userID, feature string, limit int) error
	Refund(ctx context.Context, userID, feature string) error
	GetDailyUsage(ctx context.Context, userID string) (*dto.AIQuotaResponse, error)
}

type aiQuotaService struct {
	repo AIQuotaRepository
}

type AIQuotaRepository interface {
	ConsumeDailyQuota(ctx context.Context, userID, feature string, limit int) error
	RefundDailyQuota(ctx context.Context, userID, feature string) error
	GetDailyUsage(ctx context.Context, userID string) (map[string]int, error)
}

func NewAIQuotaService(repo AIQuotaRepository) AIQuotaService {
	return &aiQuotaService{repo: repo}
}

func (s *aiQuotaService) Consume(ctx context.Context, userID, feature string, limit int) error {
	if s == nil || s.repo == nil || limit <= 0 {
		return nil
	}

	if err := s.repo.ConsumeDailyQuota(ctx, userID, feature, limit); err != nil {
		if errors.Is(err, repository.ErrAIQuotaExceeded) {
			return quotaExceeded(feature, limit)
		}
		return err
	}

	return nil
}

func (s *aiQuotaService) Refund(ctx context.Context, userID, feature string) error {
	if s == nil || s.repo == nil {
		return nil
	}

	return s.repo.RefundDailyQuota(ctx, userID, feature)
}

func (s *aiQuotaService) GetDailyUsage(ctx context.Context, userID string) (*dto.AIQuotaResponse, error) {
	if s == nil || s.repo == nil {
		return &dto.AIQuotaResponse{
			Date:   time.Now().Format("2006-01-02"),
			Quotas: buildAIDefaultQuotaResponses(nil),
		}, nil
	}

	usage, err := s.repo.GetDailyUsage(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &dto.AIQuotaResponse{
		Date:   time.Now().Format("2006-01-02"),
		Quotas: buildAIDefaultQuotaResponses(usage),
	}, nil
}

func quotaExceeded(feature string, limit int) error {
	return &QuotaExceededError{
		Feature: feature,
		Limit:   limit,
	}
}

func buildAIDefaultQuotaResponses(usage map[string]int) []dto.AIQuotaFeatureResponse {
	quotas := make([]dto.AIQuotaFeatureResponse, 0, len(dailyQuotaFeatures()))
	for _, feature := range dailyQuotaFeatures() {
		limit := dailyQuotaLimit(feature)
		used := 0
		if usage != nil {
			used = usage[feature]
		}
		remaining := limit - used
		if remaining < 0 {
			remaining = 0
		}
		quotas = append(quotas, dto.AIQuotaFeatureResponse{
			Feature:   feature,
			Used:      used,
			Limit:     limit,
			Remaining: remaining,
		})
	}
	return quotas
}

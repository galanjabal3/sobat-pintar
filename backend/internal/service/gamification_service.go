package service

import (
	"context"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/repository"
)

type GamificationService interface {
	GetUserPoints(ctx context.Context, userID string) (int, error)
	AddPoints(ctx context.Context, userID string, points int, activityType string) error
	ListBadges(ctx context.Context, userID string) ([]dto.BadgeResponse, error)
	GetLeaderboard(ctx context.Context) ([]dto.LeaderboardResponse, error)
	AwardBadge(ctx context.Context, userID, badgeID string) error
}

type gamificationService struct {
	repo repository.GamificationRepository
}

func NewGamificationService(repo repository.GamificationRepository) GamificationService {
	return &gamificationService{repo: repo}
}

func (s *gamificationService) GetUserPoints(ctx context.Context, userID string) (int, error) {
	return s.repo.GetUserPoints(ctx, userID)
}

func (s *gamificationService) AddPoints(ctx context.Context, userID string, points int, activityType string) error {
	return s.repo.AddPoints(ctx, userID, points, activityType)
}

func (s *gamificationService) ListBadges(ctx context.Context, userID string) ([]dto.BadgeResponse, error) {
	allBadges, err := s.repo.ListBadges(ctx)
	if err != nil {
		return nil, err
	}

	userBadges, err := s.repo.GetUserBadges(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Create a map for quick lookup
	owned := make(map[string]bool)
	for _, ub := range userBadges {
		owned[ub.ID] = true
	}

	var res []dto.BadgeResponse
	for _, b := range allBadges {
		res = append(res, dto.BadgeResponse{
			ID:          b.ID,
			Name:        b.Name,
			Description: b.Description,
			ImageURL:    b.ImageURL,
			IsOwned:     owned[b.ID],
		})
	}
	return res, nil
}

func (s *gamificationService) GetLeaderboard(ctx context.Context) ([]dto.LeaderboardResponse, error) {
	entries, err := s.repo.GetLeaderboard(ctx, 10)
	if err != nil {
		return nil, err
	}

	var res []dto.LeaderboardResponse
	for _, e := range entries {
		res = append(res, dto.LeaderboardResponse{
			UserName: e.UserName,
			Points:   e.Points,
		})
	}
	return res, nil
}

func (s *gamificationService) AwardBadge(ctx context.Context, userID, badgeID string) error {
	return s.repo.AwardBadge(ctx, userID, badgeID)
}

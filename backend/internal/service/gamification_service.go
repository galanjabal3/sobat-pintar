package service

import (
	"context"
	"strings"

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
	if err := s.repo.AddPoints(ctx, userID, points, activityType); err != nil {
		return err
	}

	return s.unlockEligibleBadges(ctx, userID)
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
			UserName:  e.UserName,
			AvatarURL: e.AvatarURL,
			Points:    e.Points,
		})
	}
	return res, nil
}

func (s *gamificationService) AwardBadge(ctx context.Context, userID, badgeID string) error {
	return s.repo.AwardBadge(ctx, userID, badgeID)
}

func (s *gamificationService) unlockEligibleBadges(ctx context.Context, userID string) error {
	points, err := s.repo.GetUserPoints(ctx, userID)
	if err != nil {
		return err
	}

	activityCounts := map[string]int{}
	for _, activityType := range []string{"explain_question", "chat_message", "practice_completion", "create_summary"} {
		count, err := s.repo.CountActivity(ctx, userID, activityType)
		if err != nil {
			return err
		}
		activityCounts[activityType] = count
	}

	rules := []badgeRule{
		{id: "first-step", minPoints: 10},
		{id: "sobi-friend", activityType: "chat_message", minActivityCount: 1},
		{id: "question-solver", activityType: "explain_question", minActivityCount: 1},
		{id: "practice-starter", activityType: "practice_completion", minActivityCount: 1},
		{id: "summary-maker", activityType: "create_summary", minActivityCount: 1},
		{id: "point-hunter", minPoints: 100},
		{id: "study-hero", minPoints: 300},
	}

	badges, err := s.repo.ListBadges(ctx)
	if err != nil {
		return err
	}

	available := make(map[string]bool, len(badges))
	for _, badge := range badges {
		available[badge.ID] = true
	}

	for _, rule := range rules {
		if !available[rule.id] || !rule.isMet(points, activityCounts) {
			continue
		}

		if err := s.repo.AwardBadge(ctx, userID, rule.id); err != nil {
			return err
		}
	}

	return nil
}

type badgeRule struct {
	id               string
	minPoints        int
	activityType     string
	minActivityCount int
}

func (r badgeRule) isMet(points int, activityCounts map[string]int) bool {
	if r.minPoints > 0 && points < r.minPoints {
		return false
	}

	if strings.TrimSpace(r.activityType) == "" {
		return true
	}

	return activityCounts[r.activityType] >= r.minActivityCount
}

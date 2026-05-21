package service

import (
	"context"
	"testing"

	"sobat-pintar/internal/model"
)

type fakeGamificationRepo struct {
	points     int
	activities map[string]int
	badges     []model.Badge
	awarded    map[string]bool
}

func newFakeGamificationRepo() *fakeGamificationRepo {
	return &fakeGamificationRepo{
		activities: make(map[string]int),
		awarded:    make(map[string]bool),
		badges: []model.Badge{
			{ID: "first-step"},
			{ID: "sobi-friend"},
			{ID: "question-solver"},
			{ID: "point-hunter"},
		},
	}
}

func (r *fakeGamificationRepo) GetUserPoints(ctx context.Context, userID string) (int, error) {
	return r.points, nil
}

func (r *fakeGamificationRepo) AddPoints(ctx context.Context, userID string, points int, activityType string) error {
	r.points += points
	r.activities[activityType]++
	return nil
}

func (r *fakeGamificationRepo) CountActivity(ctx context.Context, userID, activityType string) (int, error) {
	return r.activities[activityType], nil
}

func (r *fakeGamificationRepo) ListBadges(ctx context.Context) ([]model.Badge, error) {
	return r.badges, nil
}

func (r *fakeGamificationRepo) GetUserBadges(ctx context.Context, userID string) ([]model.Badge, error) {
	var badges []model.Badge
	for _, badge := range r.badges {
		if r.awarded[badge.ID] {
			badges = append(badges, badge)
		}
	}
	return badges, nil
}

func (r *fakeGamificationRepo) GetLeaderboard(ctx context.Context, limit int) ([]model.LeaderboardEntry, error) {
	return []model.LeaderboardEntry{
		{UserName: "A", Points: 100},
		{UserName: "B", Points: 80},
		{UserName: "C", Points: 60},
	}, nil
}

func (r *fakeGamificationRepo) AwardBadge(ctx context.Context, userID, badgeID string) error {
	r.awarded[badgeID] = true
	return nil
}

func TestGamificationAddPointsUnlocksEligibleBadges(t *testing.T) {
	repo := newFakeGamificationRepo()
	service := NewGamificationService(repo)

	err := service.AddPoints(context.Background(), "user-1", 10, "explain_question")
	if err != nil {
		t.Fatalf("AddPoints returned error: %v", err)
	}

	if !repo.awarded["first-step"] {
		t.Fatal("expected first-step badge to be awarded")
	}
	if !repo.awarded["question-solver"] {
		t.Fatal("expected question-solver badge to be awarded")
	}
	if repo.awarded["point-hunter"] {
		t.Fatal("did not expect point-hunter badge before 100 points")
	}
}

func TestGamificationAddPointsUnlocksPointThresholdBadge(t *testing.T) {
	repo := newFakeGamificationRepo()
	service := NewGamificationService(repo)

	err := service.AddPoints(context.Background(), "user-1", 100, "chat_message")
	if err != nil {
		t.Fatalf("AddPoints returned error: %v", err)
	}

	if !repo.awarded["point-hunter"] {
		t.Fatal("expected point-hunter badge to be awarded")
	}
	if !repo.awarded["sobi-friend"] {
		t.Fatal("expected sobi-friend badge to be awarded")
	}
}

func TestGamificationGetLeaderboardReturnsEntries(t *testing.T) {
	repo := newFakeGamificationRepo()
	service := NewGamificationService(repo)

	board, err := service.GetLeaderboard(context.Background())
	if err != nil {
		t.Fatalf("GetLeaderboard returned error: %v", err)
	}

	if len(board) != 3 {
		t.Fatalf("expected 3 leaderboard entries, got %d", len(board))
	}
	if board[0].UserName != "A" {
		t.Fatalf("unexpected first leaderboard entry: %s", board[0].UserName)
	}
}

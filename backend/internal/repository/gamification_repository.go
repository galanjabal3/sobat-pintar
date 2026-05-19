package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type GamificationRepository interface {
	GetUserPoints(ctx context.Context, userID string) (int, error)
	AddPoints(ctx context.Context, userID string, points int, activityType string) error
	ListBadges(ctx context.Context) ([]model.Badge, error)
	GetUserBadges(ctx context.Context, userID string) ([]model.Badge, error)
	GetLeaderboard(ctx context.Context, limit int) ([]model.LeaderboardEntry, error)
	AwardBadge(ctx context.Context, userID, badgeID string) error
}

type gamificationRepository struct {
	db *pgxpool.Pool
}

func NewGamificationRepository(db *pgxpool.Pool) GamificationRepository {
	return &gamificationRepository{db: db}
}

func (r *gamificationRepository) GetUserPoints(ctx context.Context, userID string) (int, error) {
	query := `SELECT points FROM users WHERE id = $1`
	var points int
	err := r.db.QueryRow(ctx, query, userID).Scan(&points)
	if err != nil {
		return 0, err
	}
	return points, nil
}

func (r *gamificationRepository) AddPoints(ctx context.Context, userID string, points int, activityType string) error {
	// 1. Update user points
	queryUpdate := `UPDATE users SET points = points + $1 WHERE id = $2`
	_, err := r.db.Exec(ctx, queryUpdate, points, userID)
	if err != nil {
		return err
	}

	// 2. Log the activity
	queryLog := `INSERT INTO points_log (user_id, points, activity_type) VALUES ($1, $2, $3)`
	_, err = r.db.Exec(ctx, queryLog, userID, points, activityType)
	return err
}

func (r *gamificationRepository) ListBadges(ctx context.Context) ([]model.Badge, error) {
	query := `SELECT id, name, description, image_url, criteria FROM badges`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []model.Badge
	for rows.Next() {
		var b model.Badge
		err := rows.Scan(&b.ID, &b.Name, &b.Description, &b.ImageURL, &b.Criteria)
		if err != nil {
			return nil, err
		}
		badges = append(badges, b)
	}
	return badges, nil
}

func (r *gamificationRepository) GetUserBadges(ctx context.Context, userID string) ([]model.Badge, error) {
	query := `SELECT b.id, b.name, b.description, b.image_url, b.criteria 
			  FROM badges b 
			  JOIN user_badges ub ON b.id = ub.badge_id 
			  WHERE ub.user_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var badges []model.Badge
	for rows.Next() {
		var b model.Badge
		err := rows.Scan(&b.ID, &b.Name, &b.Description, &b.ImageURL, &b.Criteria)
		if err != nil {
			return nil, err
		}
		badges = append(badges, b)
	}
	return badges, nil
}

func (r *gamificationRepository) GetLeaderboard(ctx context.Context, limit int) ([]model.LeaderboardEntry, error) {
	query := `SELECT name, avatar_url, points FROM users ORDER BY points DESC LIMIT $1`
	rows, err := r.db.Query(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []model.LeaderboardEntry
	for rows.Next() {
		var e model.LeaderboardEntry
		err := rows.Scan(&e.UserName, &e.AvatarURL, &e.Points)
		if err != nil {
			return nil, err
		}
		entries = append(entries, e)
	}
	return entries, nil
}
func (r *gamificationRepository) AwardBadge(ctx context.Context, userID, badgeID string) error {
	query := `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, userID, badgeID)
	return err
}

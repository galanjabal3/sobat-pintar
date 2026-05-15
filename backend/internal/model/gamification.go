package model

import "time"

type Badge struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
	Criteria    any    `json:"criteria"`
}

type UserBadge struct {
	UserID    string    `json:"user_id"`
	BadgeID   string    `json:"badge_id"`
	AwardedAt time.Time `json:"awarded_at"`
}

type PointsLog struct {
	ID           int       `json:"id"`
	UserID       string    `json:"user_id"`
	ActivityType string    `json:"activity_type"`
	Points       int       `json:"points"`
	CreatedAt    time.Time `json:"created_at"`
}

type LeaderboardEntry struct {
	UserName string `json:"user_name"`
	Points   int    `json:"points"`
}

package model

import "time"

type User struct {
	ID             string    `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	PasswordHash   *string   `json:"-"`
	GoogleID       *string   `json:"-"`
	Level          string    `json:"level"` // TK, SD, SMP, SMA
	Points         int       `json:"points"`
	Streak         int       `json:"streak"`
	LastActivityAt time.Time `json:"last_activity_at"`
	CreatedAt      time.Time `json:"created_at"`
}

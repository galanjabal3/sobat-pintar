package model

import (
	"time"

	"github.com/google/uuid"
)

type Image struct {
	ID        uuid.UUID `db:"id" json:"id"`
	URL       string    `db:"url" json:"url"`
	PublicID  string    `db:"public_id" json:"public_id"`
	UserID    string    `db:"user_id" json:"user_id"` // Optional: Link image to a user
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

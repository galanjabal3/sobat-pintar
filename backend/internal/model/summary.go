package model

import "time"

type Summary struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	SourceType string    `json:"source_type"` // text, pdf, image
	FileURL    string    `json:"file_url,omitempty"`
	Content    string    `json:"content"` // raw text or extracted text
	Summary    string    `json:"summary"` // generated summary
	CreatedAt  time.Time `json:"created_at"`
}

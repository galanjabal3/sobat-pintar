package model

import "time"

type Summary struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	SourceType   string     `json:"source_type"` // text, pdf, image
	FileURL      string     `json:"file_url,omitempty"`
	Content      string     `json:"content"` // raw text or extracted text
	Summary      string     `json:"summary"` // generated summary
	Status       string     `json:"status"`
	ErrorMessage *string    `json:"error_message,omitempty"`
	ShareToken   *string    `json:"-"`
	CreatedAt    time.Time  `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

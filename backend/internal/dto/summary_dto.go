package dto

import "time"

type CreateSummaryRequest struct {
	SourceType string `json:"source_type" binding:"required"` // text, pdf, image
	Content    string `json:"content"`                       // if source_type is text
	FileURL    string `json:"file_url"`                      // if source_type is pdf or image
}

type SummaryResponse struct {
	ID        string    `json:"id"`
	Summary   string    `json:"summary"`
	CreatedAt time.Time `json:"created_at"`
}

type SummaryHistoryResponse struct {
	ID         string    `json:"id"`
	SourceType string    `json:"source_type"`
	Summary    string    `json:"summary"`
	CreatedAt  time.Time `json:"created_at"`
}

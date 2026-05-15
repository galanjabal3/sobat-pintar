package dto

import "time"

type CreateGroupRequest struct {
	Name    string `json:"name" binding:"required"`
	Subject string `json:"subject" binding:"required"`
}

type GroupResponse struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Subject    string    `json:"subject"`
	InviteCode string    `json:"invite_code"`
	CreatedAt  time.Time `json:"created_at"`
}

type GroupNoteResponse struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}

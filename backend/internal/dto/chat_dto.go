package dto

import "time"

type CreateChatSessionRequest struct {
	Title string `json:"title" binding:"required"`
	Level string `json:"level" binding:"required"`
}

type ChatSessionResponse struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Level     string    `json:"level"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SendMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

type MessageResponse struct {
	ID        string    `json:"id"`
	Role      string    `json:"role"` // "user" or "assistant"
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatDetailResponse struct {
	Session  ChatSessionResponse `json:"session"`
	Messages []MessageResponse   `json:"messages"`
}

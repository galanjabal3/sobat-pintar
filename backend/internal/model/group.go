package model

import "time"

type StudyGroup struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Subject     string    `json:"subject"`
	OwnerID     string    `json:"owner_id"`
	InviteCode  string    `json:"invite_code"`
	CreatedAt   time.Time `json:"created_at"`
}

type GroupMember struct {
	ID       string    `json:"id"`
	GroupID  string    `json:"group_id"`
	UserID   string    `json:"user_id"`
	JoinedAt time.Time `json:"joined_at"`
}

type GroupNote struct {
	ID        string    `json:"id"`
	GroupID   string    `json:"group_id"`
	UserID    string    `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UpdatedAt time.Time `json:"updated_at"`
}

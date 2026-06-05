package model

import "time"

type StudySchedule struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	Subject      string     `json:"subject"`
	ExamDate     time.Time  `json:"exam_date"`
	Sessions     string     `json:"sessions"` // JSON string of sessions
	Tips         string     `json:"tips"`     // JSON string of tips
	Status       string     `json:"status"`
	ErrorMessage *string    `json:"error_message,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
}

type Reminder struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	ScheduleID string    `json:"schedule_id"`
	RemindAt   time.Time `json:"remind_at"`
	IsSent     bool      `json:"is_sent"`
}

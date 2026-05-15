package model

import "time"

type StudySchedule struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Subject   string    `json:"subject"`
	ExamDate  time.Time `json:"exam_date"`
	Sessions  string    `json:"sessions"` // JSON string of sessions
	CreatedAt time.Time `json:"created_at"`
}

type Reminder struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	ScheduleID string    `json:"schedule_id"`
	RemindAt   time.Time `json:"remind_at"`
	IsSent     bool      `json:"is_sent"`
}

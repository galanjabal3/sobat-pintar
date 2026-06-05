package dto

import "time"

type GenerateScheduleRequest struct {
	Title         string      `json:"title,omitempty"`
	Subjects      []string    `json:"subjects"`
	ExamDates     []time.Time `json:"exam_dates"`
	AvailableDays []string    `json:"available_days"`
	HoursPerDay   int         `json:"hours_per_day"`
	SourceType    string      `json:"source_type,omitempty"`
	ImageURL      string      `json:"image_url,omitempty"`
}

type UpdateScheduleRequest struct {
	Title    string          `json:"title" binding:"required"`
	Schedule []DailySchedule `json:"schedule" binding:"required"`
	Tips     []string        `json:"tips"`
}

type StudySession struct {
	Subject         string `json:"subject"`
	DurationMinutes int    `json:"duration_minutes"`
	Topic           string `json:"topic"`
}

type DailySchedule struct {
	Date     string         `json:"date"`
	Sessions []StudySession `json:"sessions"`
}

type ScheduleResponse struct {
	ID           string          `json:"id"`
	Title        string          `json:"title"`
	ExamDate     string          `json:"exam_date,omitempty"`
	Schedule     []DailySchedule `json:"schedule"`
	Tips         []string        `json:"tips"`
	Status       string          `json:"status"`
	ErrorMessage string          `json:"error_message,omitempty"`
}

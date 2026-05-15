package dto

import "time"

type GenerateScheduleRequest struct {
	Subjects     []string  `json:"subjects" binding:"required"`
	ExamDates    []time.Time `json:"exam_dates" binding:"required"`
	AvailableDays []string  `json:"available_days" binding:"required"`
	HoursPerDay  int       `json:"hours_per_day" binding:"required,min=1"`
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
	ID       string          `json:"id"`
	Schedule []DailySchedule `json:"schedule"`
	Tips     []string        `json:"tips"`
}

package gemini

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"google.golang.org/genai"
)

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
	Schedule []DailySchedule `json:"schedule"`
	Tips     []string        `json:"tips"`
}

func (c *Client) GenerateStudySchedule(ctx context.Context, level string, subjects []string, examDates []time.Time, availableDays []string, hoursPerDay int) (*ScheduleResponse, error) {
	examDatesStr := make([]string, len(examDates))
	for i, d := range examDates {
		examDatesStr[i] = d.Format("2006-01-02")
	}

	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan jadwal belajar realistis untuk siswa tingkat %s.
Mata pelajaran yang perlu dipelajari: %s
Tanggal ujian terdekat: %s
Hari yang tersedia: %s
Jam belajar per hari: %d jam

Format response HANYA JSON:
{
  "schedule": [
    {
      "date": "YYYY-MM-DD",
      "sessions": [
        { "subject": "Matematika", "duration_minutes": 60, "topic": "Aljabar" }
      ]
    }
  ],
  "tips": ["tip belajar 1", "tip belajar 2"]
}`, level, strings.Join(subjects, ", "), strings.Join(examDatesStr, ", "), strings.Join(availableDays, ", "), hoursPerDay)

	// Call GenerateContent with the content object.
	resp, err := c.GenAI.Models.GenerateContent(ctx, c.ModelName, genai.Text(prompt), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	// The Text() method directly extracts the response text.
	rawText := resp.Text()

	var scheduleRes ScheduleResponse
	if err := json.Unmarshal([]byte(rawText), &scheduleRes); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini response: %w\nResponse was: %s", err, rawText)
	}

	return &scheduleRes, nil
}

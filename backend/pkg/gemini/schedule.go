package gemini

import (
	"context"
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
	today := todayInJakarta()
	nearestExamDate := nearestExamDate(examDates)

	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan jadwal belajar realistis untuk siswa tingkat %s.
Tanggal hari ini: %s
Mata pelajaran yang perlu dipelajari: %s
Tanggal ujian terdekat: %s
Hari yang tersedia: %s
Jam belajar per hari: %d jam
Buat maksimal 7 hari jadwal. Tanggal jadwal HARUS mulai dari hari ini atau setelahnya, tidak boleh tanggal lampau, dan tidak boleh melewati tanggal ujian terdekat.
Gunakan hanya hari yang tersedia. Untuk setiap hari, buat sesi belajar yang ringkas dan realistis sesuai jam per hari.
Tips maksimal 3 item.

Format response HANYA JSON, tanpa markdown dan tanpa code fence:
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
}`, level, today.Format("2006-01-02"), strings.Join(subjects, ", "), strings.Join(examDatesStr, ", "), strings.Join(availableDays, ", "), hoursPerDay)

	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		config := scheduleGenerationConfig()
		if attempt > 0 {
			config.MaxOutputTokens += 1600
		}

		resp, err := c.generateContentWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, config)
		if err != nil {
			return nil, fmt.Errorf("failed to generate content: %w", err)
		}
		if len(resp.Candidates) > 0 && resp.Candidates[0].FinishReason == genai.FinishReasonMaxTokens {
			lastErr = errMaxTokens
			continue
		}

		rawText := resp.Text()

		var scheduleRes ScheduleResponse
		if err := decodeGeminiJSON(rawText, &scheduleRes); err == nil {
			if err := validateScheduleDateBounds(scheduleRes.Schedule, today, nearestExamDate); err != nil {
				lastErr = err
				continue
			}
			return &scheduleRes, nil
		} else {
			lastErr = err
		}
	}

	return nil, fmt.Errorf("failed to parse Gemini response after retry: %w", lastErr)
}

func todayInJakarta() time.Time {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		location = time.FixedZone("WIB", 7*60*60)
	}
	now := time.Now().In(location)
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, location)
}

func nearestExamDate(examDates []time.Time) time.Time {
	if len(examDates) == 0 {
		return time.Time{}
	}

	nearest := examDates[0]
	for _, examDate := range examDates[1:] {
		if examDate.Before(nearest) {
			nearest = examDate
		}
	}
	return dateOnly(nearest)
}

func validateScheduleDateBounds(schedule []DailySchedule, startDate, endDate time.Time) error {
	for _, day := range schedule {
		scheduleDate, err := time.Parse("2006-01-02", day.Date)
		if err != nil {
			return err
		}
		scheduleDate = dateOnly(scheduleDate)
		if scheduleDate.Before(dateOnly(startDate)) {
			return errInvalidScheduleDates
		}
		if !endDate.IsZero() && scheduleDate.After(dateOnly(endDate)) {
			return errInvalidScheduleDates
		}
	}
	return nil
}

func dateOnly(value time.Time) time.Time {
	return time.Date(value.Year(), value.Month(), value.Day(), 0, 0, 0, 0, value.Location())
}

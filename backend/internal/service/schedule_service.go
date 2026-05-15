package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
)

type ScheduleService interface {
	GenerateSchedule(ctx context.Context, userID, level string, req dto.GenerateScheduleRequest) (*dto.ScheduleResponse, error)
	GetSchedules(ctx context.Context, userID string) ([]dto.ScheduleResponse, error)
}

type scheduleService struct {
	repo         repository.ScheduleRepository
	geminiClient *gemini.Client
}

func NewScheduleService(repo repository.ScheduleRepository, geminiClient *gemini.Client) ScheduleService {
	return &scheduleService{
		repo:         repo,
		geminiClient: geminiClient,
	}
}

func (s *scheduleService) GenerateSchedule(ctx context.Context, userID, level string, req dto.GenerateScheduleRequest) (*dto.ScheduleResponse, error) {
	aiSchedule, err := s.geminiClient.GenerateStudySchedule(ctx, level, req.Subjects, req.ExamDates, req.AvailableDays, req.HoursPerDay)
	if err != nil {
		return nil, err
	}

	// Marshall sessions to JSON for DB storage
	sessionsJSON, err := json.Marshal(aiSchedule.Schedule)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal schedule: %v", err)
	}

	// Create model and save to DB
	schedule := &model.StudySchedule{
		ID:        uuid.New().String(),
		UserID:    userID,
		Subject:   fmt.Sprintf("Persiapan %v", req.Subjects),
		Sessions:  string(sessionsJSON),
		CreatedAt: time.Now(),
	}

	// Optional: Parse first exam date if available
	if len(req.ExamDates) > 0 {
		schedule.ExamDate = req.ExamDates[0]
	}

	if err := s.repo.CreateSchedule(ctx, schedule); err != nil {
		return nil, err
	}
	
	var res dto.ScheduleResponse
	res.ID = schedule.ID
	for _, day := range aiSchedule.Schedule {
		var sessions []dto.StudySession
		for _, sess := range day.Sessions {
			sessions = append(sessions, dto.StudySession{
				Subject:         sess.Subject,
				DurationMinutes: sess.DurationMinutes,
				Topic:           sess.Topic,
			})
		}
		res.Schedule = append(res.Schedule, dto.DailySchedule{
			Date:     day.Date,
			Sessions: sessions,
		})
	}
	res.Tips = aiSchedule.Tips

	return &res, nil
}

func (s *scheduleService) GetSchedules(ctx context.Context, userID string) ([]dto.ScheduleResponse, error) {
	schedules, err := s.repo.GetScheduleByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	var res []dto.ScheduleResponse
	for _, sc := range schedules {
		var daily []gemini.DailySchedule
		if err := json.Unmarshal([]byte(sc.Sessions), &daily); err != nil {
			continue
		}

		var dtoDaily []dto.DailySchedule
		for _, d := range daily {
			var dtoSessions []dto.StudySession
			for _, sess := range d.Sessions {
				dtoSessions = append(dtoSessions, dto.StudySession{
					Subject:         sess.Subject,
					DurationMinutes: sess.DurationMinutes,
					Topic:           sess.Topic,
				})
			}
			dtoDaily = append(dtoDaily, dto.DailySchedule{
				Date:     d.Date,
				Sessions: dtoSessions,
			})
		}

		res = append(res, dto.ScheduleResponse{
			ID:       sc.ID,
			Schedule: dtoDaily,
		})
	}

	return res, nil
}

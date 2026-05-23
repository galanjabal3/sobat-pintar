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
	"sobat-pintar/pkg/logger"
)

type ScheduleService interface {
	GenerateSchedule(ctx context.Context, userID, level string, req dto.GenerateScheduleRequest) (*dto.ScheduleResponse, error)
	GetSchedules(ctx context.Context, userID string) ([]dto.ScheduleResponse, error)
	GetScheduleByID(ctx context.Context, userID, id string) (*dto.ScheduleResponse, error)
	DeleteSchedule(ctx context.Context, userID, id string) error
}

type scheduleService struct {
	repo         repository.ScheduleRepository
	geminiClient *gemini.Client
	quota        AIQuotaService
}

func NewScheduleService(repo repository.ScheduleRepository, geminiClient *gemini.Client, quota AIQuotaService) ScheduleService {
	return &scheduleService{
		repo:         repo,
		geminiClient: geminiClient,
		quota:        quota,
	}
}

func (s *scheduleService) GenerateSchedule(ctx context.Context, userID, level string, req dto.GenerateScheduleRequest) (*dto.ScheduleResponse, error) {
	if err := validateScheduleSubjects(req.Subjects); err != nil {
		return nil, err
	}
	if err := validateScheduleExamDates(req.ExamDates); err != nil {
		return nil, err
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureSchedule, ScheduleDailyQuota); err != nil {
		return nil, err
	}

	aiSchedule, err := s.geminiClient.GenerateStudySchedule(ctx, level, req.Subjects, req.ExamDates, req.AvailableDays, req.HoursPerDay)
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		return nil, err
	}

	// Marshall sessions to JSON for DB storage
	sessionsJSON, err := json.Marshal(aiSchedule.Schedule)
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		return nil, fmt.Errorf("failed to marshal schedule: %v", err)
	}
	tipsJSON, err := json.Marshal(aiSchedule.Tips)
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		return nil, fmt.Errorf("failed to marshal schedule tips: %v", err)
	}

	// Create model and save to DB
	schedule := &model.StudySchedule{
		ID:        uuid.New().String(),
		UserID:    userID,
		Subject:   fmt.Sprintf("Persiapan %v", req.Subjects),
		Sessions:  string(sessionsJSON),
		Tips:      string(tipsJSON),
		CreatedAt: time.Now(),
	}

	// Optional: Parse first exam date if available
	if len(req.ExamDates) > 0 {
		schedule.ExamDate = req.ExamDates[0]
	}

	if err := s.repo.CreateSchedule(ctx, schedule); err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		return nil, err
	}

	var res dto.ScheduleResponse
	res.ID = schedule.ID
	if !schedule.ExamDate.IsZero() {
		res.ExamDate = schedule.ExamDate.Format("2006-01-02")
	}
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
			logger.Error(err, "Failed to decode saved schedule sessions", "user_id", userID, "schedule_id", sc.ID)
			continue
		}
		var tips []string
		if err := json.Unmarshal([]byte(sc.Tips), &tips); err != nil {
			logger.Error(err, "Failed to decode saved schedule tips", "user_id", userID, "schedule_id", sc.ID)
			tips = []string{}
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

		item := dto.ScheduleResponse{
			ID:       sc.ID,
			Schedule: dtoDaily,
			Tips:     tips,
		}
		if !sc.ExamDate.IsZero() {
			item.ExamDate = sc.ExamDate.Format("2006-01-02")
		}

		res = append(res, item)
	}

	return res, nil
}

func (s *scheduleService) GetScheduleByID(ctx context.Context, userID, id string) (*dto.ScheduleResponse, error) {
	schedule, err := s.repo.GetScheduleByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if schedule.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	var daily []gemini.DailySchedule
	if err := json.Unmarshal([]byte(schedule.Sessions), &daily); err != nil {
		logger.Error(err, "Failed to decode saved schedule sessions", "user_id", userID, "schedule_id", schedule.ID)
		return nil, err
	}
	var tips []string
	if err := json.Unmarshal([]byte(schedule.Tips), &tips); err != nil {
		logger.Error(err, "Failed to decode saved schedule tips", "user_id", userID, "schedule_id", schedule.ID)
		tips = []string{}
	}

	res := dto.ScheduleResponse{ID: schedule.ID, Tips: tips}
	if !schedule.ExamDate.IsZero() {
		res.ExamDate = schedule.ExamDate.Format("2006-01-02")
	}
	for _, d := range daily {
		var dtoSessions []dto.StudySession
		for _, sess := range d.Sessions {
			dtoSessions = append(dtoSessions, dto.StudySession{
				Subject:         sess.Subject,
				DurationMinutes: sess.DurationMinutes,
				Topic:           sess.Topic,
			})
		}
		res.Schedule = append(res.Schedule, dto.DailySchedule{
			Date:     d.Date,
			Sessions: dtoSessions,
		})
	}

	return &res, nil
}

func (s *scheduleService) DeleteSchedule(ctx context.Context, userID, id string) error {
	return s.repo.DeleteSchedule(ctx, id, userID)
}

func (s *scheduleService) consumeAIQuota(ctx context.Context, userID, feature string, limit int) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Consume(ctx, userID, feature, limit)
}

func (s *scheduleService) refundAIQuota(ctx context.Context, userID, feature string) error {
	if s.quota == nil {
		return nil
	}
	return s.quota.Refund(ctx, userID, feature)
}

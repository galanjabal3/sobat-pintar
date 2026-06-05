package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
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
	UpdateSchedule(ctx context.Context, userID, id string, req dto.UpdateScheduleRequest) (*dto.ScheduleResponse, error)
	DeleteSchedule(ctx context.Context, userID, id string) error
}

const scheduleFailedMessage = "Sobi belum berhasil membuat jadwal belajar. Coba lagi sebentar lagi ya."

type scheduleService struct {
	repo         repository.ScheduleRepository
	geminiClient scheduleGenerator
	quota        AIQuotaService
}

type scheduleGenerator interface {
	GenerateStudySchedule(ctx context.Context, level string, subjects []string, examDates []time.Time, availableDays []string, hoursPerDay int) (*gemini.ScheduleResponse, error)
	ImportStudyScheduleFromImage(ctx context.Context, level, imageURL string) (*gemini.ScheduleResponse, error)
}

func NewScheduleService(repo repository.ScheduleRepository, geminiClient scheduleGenerator, quota AIQuotaService) ScheduleService {
	return &scheduleService{
		repo:         repo,
		geminiClient: geminiClient,
		quota:        quota,
	}
}

func (s *scheduleService) GenerateSchedule(ctx context.Context, userID, level string, req dto.GenerateScheduleRequest) (*dto.ScheduleResponse, error) {
	if err := validateScheduleRequest(req); err != nil {
		return nil, err
	}

	if err := s.consumeAIQuota(ctx, userID, AIFeatureSchedule, dailyQuotaLimit(AIFeatureSchedule)); err != nil {
		return nil, err
	}

	title := scheduleTitle(req)
	emptySessionsJSON, emptyTipsJSON, err := marshalSchedulePayload(&gemini.ScheduleResponse{
		Schedule: []gemini.DailySchedule{},
		Tips:     []string{},
	})
	if err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		return nil, err
	}

	schedule := &model.StudySchedule{
		ID:        uuid.New().String(),
		UserID:    userID,
		Subject:   title,
		Sessions:  emptySessionsJSON,
		Tips:      emptyTipsJSON,
		Status:    AIResultStatusProcessing,
		CreatedAt: time.Now(),
	}
	if len(req.ExamDates) > 0 {
		schedule.ExamDate = req.ExamDates[0]
	}

	if err := s.repo.CreateSchedule(ctx, schedule); err != nil {
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		return nil, err
	}

	go s.completeSchedule(context.Background(), schedule.ID, userID, level, req)

	return s.toScheduleResponse(schedule)
}

func validateScheduleRequest(req dto.GenerateScheduleRequest) error {
	if err := validateScheduleTitle(req.Title); err != nil {
		return err
	}
	if req.SourceType == "image" {
		return validateScheduleImageURL(req.ImageURL)
	}

	if err := validateScheduleSubjects(req.Subjects); err != nil {
		return err
	}
	if err := validateScheduleExamDates(req.ExamDates); err != nil {
		return err
	}
	if err := validateScheduleAvailableDays(req.AvailableDays); err != nil {
		return err
	}
	if err := validateScheduleHoursPerDay(req.HoursPerDay); err != nil {
		return err
	}
	return nil
}

func validateUpdateScheduleRequest(req dto.UpdateScheduleRequest) error {
	if strings.TrimSpace(req.Title) == "" {
		return ErrScheduleTitleRequired
	}
	if err := validateScheduleTitle(req.Title); err != nil {
		return err
	}
	if len(req.Schedule) == 0 {
		return ErrScheduleSessionsRequired
	}
	if len(req.Schedule) > 14 {
		return ErrScheduleSessionInvalid
	}
	for _, day := range req.Schedule {
		if strings.TrimSpace(day.Date) == "" || len(day.Sessions) == 0 || len(day.Sessions) > 8 {
			return ErrScheduleSessionInvalid
		}
		if _, err := time.Parse("2006-01-02", day.Date); err != nil {
			return ErrScheduleSessionInvalid
		}
		for _, session := range day.Sessions {
			if strings.TrimSpace(session.Subject) == "" || strings.TrimSpace(session.Topic) == "" {
				return ErrScheduleSessionInvalid
			}
			if session.DurationMinutes <= 0 || session.DurationMinutes > 8*60 {
				return ErrScheduleSessionInvalid
			}
		}
	}
	return nil
}

func (s *scheduleService) generateSchedule(ctx context.Context, level string, req dto.GenerateScheduleRequest) (*gemini.ScheduleResponse, error) {
	if req.SourceType == "image" {
		return s.geminiClient.ImportStudyScheduleFromImage(ctx, level, req.ImageURL)
	}

	return s.geminiClient.GenerateStudySchedule(ctx, level, req.Subjects, req.ExamDates, req.AvailableDays, req.HoursPerDay)
}

func (s *scheduleService) completeSchedule(ctx context.Context, id, userID, level string, req dto.GenerateScheduleRequest) {
	aiSchedule, err := s.generateSchedule(ctx, level, req)
	if err != nil {
		logger.Error(err, "Failed to generate schedule", "user_id", userID, "schedule_id", id)
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		if updateErr := s.repo.FailSchedule(ctx, id, scheduleFailedMessage); updateErr != nil {
			logger.Error(updateErr, "Failed to mark schedule as failed", "user_id", userID, "schedule_id", id)
		}
		return
	}

	sessionsJSON, tipsJSON, err := marshalSchedulePayload(aiSchedule)
	if err != nil {
		logger.Error(err, "Failed to serialize generated schedule", "user_id", userID, "schedule_id", id)
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		if updateErr := s.repo.FailSchedule(ctx, id, scheduleFailedMessage); updateErr != nil {
			logger.Error(updateErr, "Failed to mark schedule as failed after serialization error", "user_id", userID, "schedule_id", id)
		}
		return
	}

	var completeErr error
	if title := importedScheduleTitle(req, aiSchedule); title != "" {
		completeErr = s.repo.CompleteScheduleWithTitle(ctx, id, title, sessionsJSON, tipsJSON)
	} else {
		completeErr = s.repo.CompleteSchedule(ctx, id, sessionsJSON, tipsJSON)
	}
	if completeErr != nil {
		err := completeErr
		logger.Error(err, "Failed to complete schedule", "user_id", userID, "schedule_id", id)
		logAIQuotaRefundError(s.refundAIQuota(ctx, userID, AIFeatureSchedule), userID, AIFeatureSchedule)
		if updateErr := s.repo.FailSchedule(ctx, id, scheduleFailedMessage); updateErr != nil {
			logger.Error(updateErr, "Failed to mark schedule as failed after completion error", "user_id", userID, "schedule_id", id)
		}
	}
}

func marshalSchedulePayload(aiSchedule *gemini.ScheduleResponse) (string, string, error) {
	if aiSchedule.Schedule == nil {
		aiSchedule.Schedule = []gemini.DailySchedule{}
	}
	if aiSchedule.Tips == nil {
		aiSchedule.Tips = []string{}
	}

	// Marshall sessions to JSON for DB storage
	sessionsJSON, err := json.Marshal(aiSchedule.Schedule)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal schedule: %v", err)
	}
	tipsJSON, err := json.Marshal(aiSchedule.Tips)
	if err != nil {
		return "", "", fmt.Errorf("failed to marshal schedule tips: %v", err)
	}
	return string(sessionsJSON), string(tipsJSON), nil
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
		if tips == nil {
			tips = []string{}
		}

		dtoDaily := []dto.DailySchedule{}
		for _, d := range daily {
			dtoSessions := []dto.StudySession{}
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

		res = append(res, buildScheduleResponse(sc, dtoDaily, tips))
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
	if tips == nil {
		tips = []string{}
	}

	dailyResponse := []dto.DailySchedule{}
	for _, d := range daily {
		dtoSessions := []dto.StudySession{}
		for _, sess := range d.Sessions {
			dtoSessions = append(dtoSessions, dto.StudySession{
				Subject:         sess.Subject,
				DurationMinutes: sess.DurationMinutes,
				Topic:           sess.Topic,
			})
		}
		dailyResponse = append(dailyResponse, dto.DailySchedule{
			Date:     d.Date,
			Sessions: dtoSessions,
		})
	}

	res := buildScheduleResponse(*schedule, dailyResponse, tips)
	return &res, nil
}

func (s *scheduleService) UpdateSchedule(ctx context.Context, userID, id string, req dto.UpdateScheduleRequest) (*dto.ScheduleResponse, error) {
	if err := validateUpdateScheduleRequest(req); err != nil {
		return nil, err
	}

	current, err := s.repo.GetScheduleByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if current.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}
	if current.Status != "" && current.Status != AIResultStatusCompleted {
		return nil, ErrAIResultNotReady
	}

	aiSchedule := &gemini.ScheduleResponse{
		Schedule: toGeminiDailySchedule(req.Schedule),
		Tips:     cleanScheduleTips(req.Tips),
	}
	sessionsJSON, tipsJSON, err := marshalSchedulePayload(aiSchedule)
	if err != nil {
		return nil, err
	}

	title := strings.Join(strings.Fields(req.Title), " ")
	if err := s.repo.UpdateSchedule(ctx, id, userID, title, sessionsJSON, tipsJSON); err != nil {
		return nil, err
	}

	updated := *current
	updated.Subject = title
	updated.Sessions = sessionsJSON
	updated.Tips = tipsJSON
	updated.Status = AIResultStatusCompleted
	return s.toScheduleResponse(&updated)
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

func (s *scheduleService) toScheduleResponse(schedule *model.StudySchedule) (*dto.ScheduleResponse, error) {
	var daily []gemini.DailySchedule
	if err := json.Unmarshal([]byte(schedule.Sessions), &daily); err != nil {
		return nil, err
	}
	var tips []string
	if err := json.Unmarshal([]byte(schedule.Tips), &tips); err != nil {
		tips = []string{}
	}
	dailyResponse := []dto.DailySchedule{}
	for _, d := range daily {
		dtoSessions := []dto.StudySession{}
		for _, sess := range d.Sessions {
			dtoSessions = append(dtoSessions, dto.StudySession{
				Subject:         sess.Subject,
				DurationMinutes: sess.DurationMinutes,
				Topic:           sess.Topic,
			})
		}
		dailyResponse = append(dailyResponse, dto.DailySchedule{
			Date:     d.Date,
			Sessions: dtoSessions,
		})
	}
	response := buildScheduleResponse(*schedule, dailyResponse, tips)
	return &response, nil
}

func buildScheduleResponse(schedule model.StudySchedule, daily []dto.DailySchedule, tips []string) dto.ScheduleResponse {
	if daily == nil {
		daily = []dto.DailySchedule{}
	}
	if tips == nil {
		tips = []string{}
	}
	status := schedule.Status
	if status == "" {
		status = AIResultStatusCompleted
	}
	res := dto.ScheduleResponse{
		ID:           schedule.ID,
		Title:        schedule.Subject,
		Schedule:     daily,
		Tips:         tips,
		Status:       status,
		ErrorMessage: stringValue(schedule.ErrorMessage),
	}
	if !schedule.ExamDate.IsZero() {
		res.ExamDate = schedule.ExamDate.Format("2006-01-02")
	}
	return res
}

func scheduleTitle(req dto.GenerateScheduleRequest) string {
	if title := strings.TrimSpace(req.Title); title != "" {
		return title
	}
	if req.SourceType == "image" {
		return "Jadwal dari Foto"
	}
	if len(req.Subjects) == 0 {
		return "Jadwal Belajar"
	}
	joined := strings.Join(req.Subjects, ", ")
	if runeLen(joined) <= MaxScheduleTitleChars {
		return joined
	}
	return strings.TrimSpace(string([]rune(joined)[:MaxScheduleTitleChars-3])) + "..."
}

func importedScheduleTitle(req dto.GenerateScheduleRequest, aiSchedule *gemini.ScheduleResponse) string {
	if req.SourceType != "image" || strings.TrimSpace(req.Title) != "" {
		return ""
	}
	title := strings.Join(strings.Fields(aiSchedule.Title), " ")
	if title == "" {
		return ""
	}
	if runeLen(title) <= MaxScheduleTitleChars {
		return title
	}
	return strings.TrimSpace(string([]rune(title)[:MaxScheduleTitleChars-3])) + "..."
}

func toGeminiDailySchedule(days []dto.DailySchedule) []gemini.DailySchedule {
	result := make([]gemini.DailySchedule, 0, len(days))
	for _, day := range days {
		sessions := make([]gemini.StudySession, 0, len(day.Sessions))
		for _, session := range day.Sessions {
			sessions = append(sessions, gemini.StudySession{
				Subject:         strings.Join(strings.Fields(session.Subject), " "),
				DurationMinutes: session.DurationMinutes,
				Topic:           strings.Join(strings.Fields(session.Topic), " "),
			})
		}
		result = append(result, gemini.DailySchedule{
			Date:     strings.TrimSpace(day.Date),
			Sessions: sessions,
		})
	}
	return result
}

func cleanScheduleTips(tips []string) []string {
	cleaned := []string{}
	for _, tip := range tips {
		text := strings.Join(strings.Fields(tip), " ")
		if text != "" {
			cleaned = append(cleaned, text)
		}
		if len(cleaned) == 3 {
			break
		}
	}
	return cleaned
}

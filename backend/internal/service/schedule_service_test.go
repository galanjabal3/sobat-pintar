package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
)

type fakeScheduleRepo struct {
	schedules []model.StudySchedule
	schedule  *model.StudySchedule
}

func (r *fakeScheduleRepo) CreateSchedule(ctx context.Context, schedule *model.StudySchedule) error {
	return nil
}

func (r *fakeScheduleRepo) GetScheduleByUserID(ctx context.Context, userID string) ([]model.StudySchedule, error) {
	return r.schedules, nil
}

func (r *fakeScheduleRepo) GetScheduleByID(ctx context.Context, id string) (*model.StudySchedule, error) {
	return r.schedule, nil
}

func (r *fakeScheduleRepo) DeleteSchedule(ctx context.Context, id, userID string) error {
	return nil
}

func (r *fakeScheduleRepo) CreateReminder(ctx context.Context, reminder *model.Reminder) error {
	return nil
}

func (r *fakeScheduleRepo) ListPendingReminders(ctx context.Context) ([]model.Reminder, error) {
	return nil, nil
}

func (r *fakeScheduleRepo) MarkReminderSent(ctx context.Context, id string) error {
	return nil
}

func TestGenerateScheduleRejectsTooManySubjects(t *testing.T) {
	service := NewScheduleService(nil, nil, nil)

	req := dto.GenerateScheduleRequest{
		Subjects: []string{"Matematika", "Bahasa Indonesia", "IPA", "IPS", "Bahasa Inggris", "Fisika", "Kimia", "Biologi", "Sejarah"},
	}

	_, err := service.GenerateSchedule(context.Background(), "user-1", "SMA", req)
	if err == nil {
		t.Fatal("expected too many subjects error")
	}
	if !errors.Is(err, ErrScheduleTooManySubjects) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGenerateScheduleRejectsLongSubject(t *testing.T) {
	service := NewScheduleService(nil, nil, nil)

	req := dto.GenerateScheduleRequest{
		Subjects: []string{strings.Repeat("a", MaxScheduleSubjectChars+1)},
	}

	_, err := service.GenerateSchedule(context.Background(), "user-1", "SMA", req)
	if err == nil {
		t.Fatal("expected long subject error")
	}
	if !errors.Is(err, ErrScheduleSubjectTooLong) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGetScheduleByIDReturnsStoredTips(t *testing.T) {
	repo := &fakeScheduleRepo{
		schedule: &model.StudySchedule{
			ID:       "schedule-1",
			UserID:   "user-1",
			ExamDate: time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
			Sessions: `[{"date":"2026-05-22","sessions":[{"subject":"Matematika","duration_minutes":60,"topic":"Aljabar"}]}]`,
			Tips:     `["Mulai dari topik tersulit.","Istirahat singkat tiap sesi."]`,
		},
	}
	service := NewScheduleService(repo, nil, nil)

	result, err := service.GetScheduleByID(context.Background(), "user-1", "schedule-1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(result.Tips) != 2 {
		t.Fatalf("expected 2 tips, got %d", len(result.Tips))
	}
	if result.Tips[0] != "Mulai dari topik tersulit." {
		t.Fatalf("unexpected first tip: %q", result.Tips[0])
	}
}

func TestGetSchedulesReturnsStoredTips(t *testing.T) {
	repo := &fakeScheduleRepo{
		schedules: []model.StudySchedule{
			{
				ID:       "schedule-1",
				UserID:   "user-1",
				Sessions: `[{"date":"2026-05-22","sessions":[{"subject":"IPA","duration_minutes":45,"topic":"Ekosistem"}]}]`,
				Tips:     `["Review catatan setelah belajar."]`,
			},
		},
	}
	service := NewScheduleService(repo, nil, nil)

	results, err := service.GetSchedules(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(results) != 1 {
		t.Fatalf("expected 1 schedule, got %d", len(results))
	}
	if len(results[0].Tips) != 1 || results[0].Tips[0] != "Review catatan setelah belajar." {
		t.Fatalf("unexpected tips: %#v", results[0].Tips)
	}
}

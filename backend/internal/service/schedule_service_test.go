package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/pkg/gemini"
)

type fakeScheduleRepo struct {
	schedules         []model.StudySchedule
	schedule          *model.StudySchedule
	created           *model.StudySchedule
	completedID       string
	completedTitle    string
	completedSessions string
	completedTips     string
	updatedTitle      string
	updatedSessions   string
	updatedTips       string
	failedID          string
	failedMessage     string
	completeCh        chan struct{}
}

func (r *fakeScheduleRepo) CreateSchedule(ctx context.Context, schedule *model.StudySchedule) error {
	r.created = schedule
	return nil
}

func (r *fakeScheduleRepo) CompleteSchedule(ctx context.Context, id string, sessions string, tips string) error {
	r.completedID = id
	r.completedSessions = sessions
	r.completedTips = tips
	if r.completeCh != nil {
		close(r.completeCh)
	}
	return nil
}

func (r *fakeScheduleRepo) CompleteScheduleWithTitle(ctx context.Context, id string, title string, sessions string, tips string) error {
	r.completedID = id
	r.completedTitle = title
	r.completedSessions = sessions
	r.completedTips = tips
	if r.completeCh != nil {
		close(r.completeCh)
	}
	return nil
}

func (r *fakeScheduleRepo) FailSchedule(ctx context.Context, id string, message string) error {
	r.failedID = id
	r.failedMessage = message
	return nil
}

func (r *fakeScheduleRepo) UpdateSchedule(ctx context.Context, id, userID, title, sessions, tips string) error {
	r.updatedTitle = title
	r.updatedSessions = sessions
	r.updatedTips = tips
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

type fakeScheduleGenerator struct {
	imageURL string
}

func (g *fakeScheduleGenerator) GenerateStudySchedule(ctx context.Context, level string, subjects []string, examDates []time.Time, availableDays []string, hoursPerDay int) (*gemini.ScheduleResponse, error) {
	return &gemini.ScheduleResponse{
		Schedule: []gemini.DailySchedule{
			{Date: "2026-06-06", Sessions: []gemini.StudySession{{Subject: subjects[0], DurationMinutes: 60, Topic: "Topik utama"}}},
		},
		Tips: []string{"Belajar dari topik tersulit."},
	}, nil
}

func (g *fakeScheduleGenerator) ImportStudyScheduleFromImage(ctx context.Context, level, imageURL string) (*gemini.ScheduleResponse, error) {
	g.imageURL = imageURL
	return &gemini.ScheduleResponse{
		Title: "Jadwal Ujian Tengah Semester",
		Schedule: []gemini.DailySchedule{
			{Date: "2026-06-06", Sessions: []gemini.StudySession{{Subject: "Matematika", DurationMinutes: 90, Topic: "Latihan aljabar"}}},
		},
		Tips: []string{"Cek ulang sesi hasil scan sebelum belajar."},
	}, nil
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

func TestGenerateScheduleRejectsMissingExamDate(t *testing.T) {
	service := NewScheduleService(nil, nil, nil)

	_, err := service.GenerateSchedule(context.Background(), "user-1", "SMA", dto.GenerateScheduleRequest{
		Subjects:      []string{"Matematika"},
		AvailableDays: []string{"Senin"},
		HoursPerDay:   2,
	})
	if err == nil {
		t.Fatal("expected missing exam date error")
	}
	if !errors.Is(err, ErrScheduleExamDateRequired) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGenerateScheduleRejectsMissingAvailableDays(t *testing.T) {
	service := NewScheduleService(nil, nil, nil)

	_, err := service.GenerateSchedule(context.Background(), "user-1", "SMA", dto.GenerateScheduleRequest{
		Subjects:    []string{"Matematika"},
		ExamDates:   []time.Time{time.Now().AddDate(0, 0, 7)},
		HoursPerDay: 2,
	})
	if err == nil {
		t.Fatal("expected missing available days error")
	}
	if !errors.Is(err, ErrScheduleDaysRequired) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGenerateScheduleRejectsInvalidHoursPerDay(t *testing.T) {
	service := NewScheduleService(nil, nil, nil)

	_, err := service.GenerateSchedule(context.Background(), "user-1", "SMA", dto.GenerateScheduleRequest{
		Subjects:      []string{"Matematika"},
		ExamDates:     []time.Time{time.Now().AddDate(0, 0, 7)},
		AvailableDays: []string{"Senin"},
		HoursPerDay:   9,
	})
	if err == nil {
		t.Fatal("expected invalid hours error")
	}
	if !errors.Is(err, ErrScheduleHoursInvalid) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGenerateScheduleRejectsInvalidImageURL(t *testing.T) {
	service := NewScheduleService(nil, nil, nil)

	_, err := service.GenerateSchedule(context.Background(), "user-1", "SMA", dto.GenerateScheduleRequest{
		SourceType: "image",
		ImageURL:   "https://example.com/jadwal.jpg",
	})
	if err == nil {
		t.Fatal("expected invalid image URL error")
	}
	if !errors.Is(err, ErrScheduleImageURLInvalid) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestGenerateScheduleFromImage(t *testing.T) {
	repo := &fakeScheduleRepo{completeCh: make(chan struct{})}
	generator := &fakeScheduleGenerator{}
	service := NewScheduleService(repo, generator, nil)
	imageURL := "https://res.cloudinary.com/demo/image/upload/jadwal.jpg"

	result, err := service.GenerateSchedule(context.Background(), "user-1", "SMP", dto.GenerateScheduleRequest{
		SourceType: "image",
		ImageURL:   imageURL,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.created == nil {
		t.Fatal("expected scanned schedule to be saved")
	}
	if repo.created.Subject != "Jadwal dari Foto" {
		t.Fatalf("unexpected stored subject: %q", repo.created.Subject)
	}
	if result.Status != AIResultStatusProcessing || len(result.Schedule) != 0 {
		t.Fatalf("unexpected result: %+v", result)
	}

	select {
	case <-repo.completeCh:
	case <-time.After(time.Second):
		t.Fatal("expected async scan worker to complete")
	}
	if generator.imageURL != imageURL {
		t.Fatalf("expected generator to receive image URL, got %q", generator.imageURL)
	}
	if repo.completedID != result.ID || !strings.Contains(repo.completedSessions, "Matematika") {
		t.Fatalf("expected completed scanned schedule, got id=%q sessions=%q", repo.completedID, repo.completedSessions)
	}
	if repo.completedTitle != "Jadwal Ujian Tengah Semester" {
		t.Fatalf("expected imported title from image, got %q", repo.completedTitle)
	}
}

func TestImportedScheduleTitleUsesOnlyImageTitleWhenUserTitleEmpty(t *testing.T) {
	title := importedScheduleTitle(dto.GenerateScheduleRequest{SourceType: "image"}, &gemini.ScheduleResponse{
		Title: "  Jadwal   Belajar   Mingguan  ",
	})
	if title != "Jadwal Belajar Mingguan" {
		t.Fatalf("unexpected imported title: %q", title)
	}

	title = importedScheduleTitle(dto.GenerateScheduleRequest{SourceType: "image", Title: "Judul User"}, &gemini.ScheduleResponse{
		Title: "Judul dari Foto",
	})
	if title != "" {
		t.Fatalf("expected user title to take precedence, got %q", title)
	}
}

func TestUpdateSchedulePersistsEditedSchedule(t *testing.T) {
	repo := &fakeScheduleRepo{
		schedule: &model.StudySchedule{
			ID:       "schedule-1",
			UserID:   "user-1",
			Subject:  "Jadwal Lama",
			Status:   AIResultStatusCompleted,
			Sessions: `[]`,
			Tips:     `[]`,
		},
	}
	service := NewScheduleService(repo, nil, nil)

	result, err := service.UpdateSchedule(context.Background(), "user-1", "schedule-1", dto.UpdateScheduleRequest{
		Title: " Jadwal   Baru ",
		Schedule: []dto.DailySchedule{
			{
				Date: "2026-06-06",
				Sessions: []dto.StudySession{
					{Subject: " Matematika ", DurationMinutes: 60, Topic: " Aljabar dasar "},
				},
			},
		},
		Tips: []string{" Review  setelah belajar "},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if repo.updatedTitle != "Jadwal Baru" {
		t.Fatalf("unexpected updated title: %q", repo.updatedTitle)
	}
	if !strings.Contains(repo.updatedSessions, "Matematika") || !strings.Contains(repo.updatedTips, "Review setelah belajar") {
		t.Fatalf("unexpected updated payload: sessions=%q tips=%q", repo.updatedSessions, repo.updatedTips)
	}
	if result.Title != "Jadwal Baru" || len(result.Schedule) != 1 {
		t.Fatalf("unexpected result: %+v", result)
	}
}

func TestUpdateScheduleRejectsProcessingSchedule(t *testing.T) {
	repo := &fakeScheduleRepo{
		schedule: &model.StudySchedule{
			ID:       "schedule-1",
			UserID:   "user-1",
			Subject:  "Jadwal Lama",
			Status:   AIResultStatusProcessing,
			Sessions: `[]`,
			Tips:     `[]`,
		},
	}
	service := NewScheduleService(repo, nil, nil)

	_, err := service.UpdateSchedule(context.Background(), "user-1", "schedule-1", dto.UpdateScheduleRequest{
		Title: "Jadwal Baru",
		Schedule: []dto.DailySchedule{
			{Date: "2026-06-06", Sessions: []dto.StudySession{{Subject: "Matematika", DurationMinutes: 60, Topic: "Aljabar"}}},
		},
	})
	if !errors.Is(err, ErrAIResultNotReady) {
		t.Fatalf("expected result not ready error, got %v", err)
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

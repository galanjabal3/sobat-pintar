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

type fakeSummaryRepo struct {
	created          *model.Summary
	byID             *model.Summary
	completedID      string
	completedSummary string
	failedID         string
	failedMessage    string
	completeCh       chan struct{}
	setShareToken    string
	setShareTokenID  string
	setShareTokenUID string
}

func (r *fakeSummaryRepo) Create(ctx context.Context, summary *model.Summary) error {
	r.created = summary
	return nil
}

func (r *fakeSummaryRepo) Complete(ctx context.Context, id string, summaryText string) error {
	r.completedID = id
	r.completedSummary = summaryText
	if r.completeCh != nil {
		close(r.completeCh)
	}
	return nil
}

func (r *fakeSummaryRepo) Fail(ctx context.Context, id string, message string) error {
	r.failedID = id
	r.failedMessage = message
	return nil
}

func (r *fakeSummaryRepo) GetByID(ctx context.Context, id string) (*model.Summary, error) {
	return r.byID, nil
}

func (r *fakeSummaryRepo) GetByShareToken(ctx context.Context, token string) (*model.Summary, error) {
	return nil, nil
}

func (r *fakeSummaryRepo) SetShareToken(ctx context.Context, id string, userID string, token string) error {
	r.setShareTokenID = id
	r.setShareTokenUID = userID
	r.setShareToken = token
	return nil
}

func (r *fakeSummaryRepo) ListByUserID(ctx context.Context, userID string) ([]model.Summary, error) {
	return nil, nil
}

func (r *fakeSummaryRepo) Delete(ctx context.Context, id string, userID string) error {
	return nil
}

type fakeSummaryGenerator struct {
	imageURL string
	err      error
}

func (g *fakeSummaryGenerator) SummarizeMateri(ctx context.Context, level, content string) (string, error) {
	if g.err != nil {
		return "", g.err
	}
	return "ringkasan teks", nil
}

func (g *fakeSummaryGenerator) SummarizeImageMateri(ctx context.Context, level, imageURL string) (string, error) {
	if g.err != nil {
		return "", g.err
	}
	g.imageURL = imageURL
	return "ringkasan foto", nil
}

func TestCreateSummaryRejectsUnsupportedSourceType(t *testing.T) {
	service := NewSummaryService(&fakeSummaryRepo{}, nil, nil, nil)

	_, err := service.CreateSummary(context.Background(), "user-1", "SD", dto.CreateSummaryRequest{
		SourceType: "pdf",
		FileURL:    "https://example.com/materi.pdf",
	})
	if err == nil {
		t.Fatal("expected unsupported source type error")
	}

	if !strings.Contains(err.Error(), "ekstraksi dari pdf belum didukung") {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreateSummaryRejectsLongText(t *testing.T) {
	service := NewSummaryService(&fakeSummaryRepo{}, nil, nil, nil)

	_, err := service.CreateSummary(context.Background(), "user-1", "SD", dto.CreateSummaryRequest{
		SourceType: "text",
		Content:    strings.Repeat("a", MaxSummaryContentChars+1),
	})
	if err == nil {
		t.Fatal("expected long text error")
	}
	if !errors.Is(err, ErrSummaryContentTooLong) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreateSummaryRejectsInvalidImageURL(t *testing.T) {
	service := NewSummaryService(&fakeSummaryRepo{}, nil, nil, nil)

	_, err := service.CreateSummary(context.Background(), "user-1", "SD", dto.CreateSummaryRequest{
		SourceType: "image",
		FileURL:    "https://example.com/materi.jpg",
	})
	if err == nil {
		t.Fatal("expected invalid image URL error")
	}
	if !errors.Is(err, ErrSummaryImageURLInvalid) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestCreateSummaryFromImage(t *testing.T) {
	repo := &fakeSummaryRepo{completeCh: make(chan struct{})}
	generator := &fakeSummaryGenerator{}
	service := NewSummaryService(repo, generator, nil, nil)
	imageURL := "https://res.cloudinary.com/demo/image/upload/materi.jpg"

	response, err := service.CreateSummary(context.Background(), "user-1", "SD", dto.CreateSummaryRequest{
		SourceType: "image",
		FileURL:    imageURL,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if response.Status != AIResultStatusProcessing {
		t.Fatalf("unexpected response: %+v", response)
	}

	select {
	case <-repo.completeCh:
	case <-time.After(time.Second):
		t.Fatal("expected async summary worker to complete")
	}

	if generator.imageURL != imageURL {
		t.Fatalf("expected image generator to receive uploaded URL, got %q", generator.imageURL)
	}
	if repo.created == nil || repo.created.SourceType != "image" || repo.created.FileURL != imageURL {
		t.Fatalf("expected image summary to be persisted, got %+v", repo.created)
	}
	if repo.created.Status != AIResultStatusProcessing {
		t.Fatalf("expected processing summary to be persisted, got %+v", repo.created)
	}
	if repo.completedSummary != "ringkasan foto" {
		t.Fatalf("expected completed summary text, got %q", repo.completedSummary)
	}
}

func TestCreateSummaryRejectsQuotaExceeded(t *testing.T) {
	quota := &fakeQuotaService{err: &QuotaExceededError{Feature: AIFeatureSummary, Limit: SummaryDailyQuota}}
	service := NewSummaryService(&fakeSummaryRepo{}, nil, nil, quota)

	_, err := service.CreateSummary(context.Background(), "user-1", "SD", dto.CreateSummaryRequest{
		SourceType: "text",
		Content:    "Materi singkat",
	})
	if err == nil {
		t.Fatal("expected quota exceeded error")
	}
	var quotaErr *QuotaExceededError
	if !errors.As(err, &quotaErr) {
		t.Fatalf("unexpected error: %v", err)
	}
	if quota.calls != 1 {
		t.Fatalf("expected quota to be checked once, got %d", quota.calls)
	}
}

func TestCreateSummaryMarksFailedWithSafeMessage(t *testing.T) {
	repo := &fakeSummaryRepo{}
	generator := &fakeSummaryGenerator{err: errors.New("provider secret failure")}
	service := NewSummaryService(repo, generator, nil, nil)

	response, err := service.CreateSummary(context.Background(), "user-1", "SD", dto.CreateSummaryRequest{
		SourceType: "text",
		Content:    "Materi singkat",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	deadline := time.After(time.Second)
	for repo.failedID == "" {
		select {
		case <-deadline:
			t.Fatal("expected async summary worker to mark result as failed")
		default:
			time.Sleep(10 * time.Millisecond)
		}
	}

	if repo.failedID != response.ID {
		t.Fatalf("expected failed summary id %q, got %q", response.ID, repo.failedID)
	}
	if strings.Contains(repo.failedMessage, "provider secret failure") {
		t.Fatalf("expected safe failure message, got %q", repo.failedMessage)
	}
	if repo.failedMessage == "" {
		t.Fatal("expected failure message to be stored")
	}
}

func TestCreateSummaryShareTokenRequiresOwner(t *testing.T) {
	repo := &fakeSummaryRepo{byID: &model.Summary{ID: "summary-1", UserID: "owner", Status: AIResultStatusCompleted}}
	service := NewSummaryService(repo, nil, nil, nil)

	_, err := service.CreateShareToken(context.Background(), "other-user", "summary-1")
	if !errors.Is(err, ErrSummaryUnauthorized) {
		t.Fatalf("expected unauthorized error, got %v", err)
	}
	if repo.setShareToken != "" {
		t.Fatal("expected no token to be saved for a non-owner")
	}
}

func TestCreateSummaryShareTokenPersistsOpaqueToken(t *testing.T) {
	repo := &fakeSummaryRepo{byID: &model.Summary{ID: "summary-1", UserID: "owner", Status: AIResultStatusCompleted}}
	service := NewSummaryService(repo, nil, nil, nil)

	token, err := service.CreateShareToken(context.Background(), "owner", "summary-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if token == "" || token != repo.setShareToken {
		t.Fatalf("expected persisted share token, got %q", token)
	}
	if repo.setShareTokenID != "summary-1" || repo.setShareTokenUID != "owner" {
		t.Fatalf("unexpected saved target: %q %q", repo.setShareTokenID, repo.setShareTokenUID)
	}
}

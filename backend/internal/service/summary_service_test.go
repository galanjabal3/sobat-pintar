package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
)

type fakeSummaryRepo struct {
	created *model.Summary
}

func (r *fakeSummaryRepo) Create(ctx context.Context, summary *model.Summary) error {
	r.created = summary
	return nil
}

func (r *fakeSummaryRepo) GetByID(ctx context.Context, id string) (*model.Summary, error) {
	return nil, nil
}

func (r *fakeSummaryRepo) ListByUserID(ctx context.Context, userID string) ([]model.Summary, error) {
	return nil, nil
}

func (r *fakeSummaryRepo) Delete(ctx context.Context, id string, userID string) error {
	return nil
}

type fakeSummaryGenerator struct {
	imageURL string
}

func (g *fakeSummaryGenerator) SummarizeMateri(ctx context.Context, level, content string) (string, error) {
	return "ringkasan teks", nil
}

func (g *fakeSummaryGenerator) SummarizeImageMateri(ctx context.Context, level, imageURL string) (string, error) {
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
	repo := &fakeSummaryRepo{}
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
	if response.Summary != "ringkasan foto" {
		t.Fatalf("unexpected response: %+v", response)
	}
	if generator.imageURL != imageURL {
		t.Fatalf("expected image generator to receive uploaded URL, got %q", generator.imageURL)
	}
	if repo.created == nil || repo.created.SourceType != "image" || repo.created.FileURL != imageURL {
		t.Fatalf("expected image summary to be persisted, got %+v", repo.created)
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

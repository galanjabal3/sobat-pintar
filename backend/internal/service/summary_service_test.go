package service

import (
	"context"
	"strings"
	"testing"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
)

type fakeSummaryRepo struct{}

func (r *fakeSummaryRepo) Create(ctx context.Context, summary *model.Summary) error {
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

func TestCreateSummaryRejectsUnsupportedSourceType(t *testing.T) {
	service := NewSummaryService(&fakeSummaryRepo{}, nil, nil)

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

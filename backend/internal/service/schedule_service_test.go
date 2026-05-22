package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"sobat-pintar/internal/dto"
)

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

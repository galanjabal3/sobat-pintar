package gemini

import (
	"errors"
	"testing"
	"time"
)

func TestValidateScheduleDateBoundsRejectsPastDate(t *testing.T) {
	startDate := time.Date(2026, 5, 22, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2026, 6, 28, 0, 0, 0, 0, time.UTC)

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-05-11"}}, startDate, endDate)
	if !errors.Is(err, errInvalidScheduleDates) {
		t.Fatalf("expected invalid schedule date error, got %v", err)
	}
}

func TestValidateScheduleDateBoundsRejectsDateAfterExam(t *testing.T) {
	startDate := time.Date(2026, 5, 22, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2026, 6, 28, 0, 0, 0, 0, time.UTC)

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-06-29"}}, startDate, endDate)
	if !errors.Is(err, errInvalidScheduleDates) {
		t.Fatalf("expected invalid schedule date error, got %v", err)
	}
}

func TestValidateScheduleDateBoundsAllowsDateInRange(t *testing.T) {
	startDate := time.Date(2026, 5, 22, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2026, 6, 28, 0, 0, 0, 0, time.UTC)

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-06-01"}}, startDate, endDate)
	if err != nil {
		t.Fatalf("expected schedule date to be valid, got %v", err)
	}
}

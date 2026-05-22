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

func TestValidateScheduleResponseRejectsDurationOverDailyLimit(t *testing.T) {
	response := validScheduleResponse()
	response.Schedule[0].Sessions[0].DurationMinutes = 90

	err := validateScheduleResponse(response, []string{"Matematika"}, []string{"Jumat"}, 1)
	if !errors.Is(err, errInvalidScheduleResponse) {
		t.Fatalf("expected invalid schedule response error, got %v", err)
	}
}

func TestValidateScheduleResponseRejectsUnavailableDay(t *testing.T) {
	response := validScheduleResponse()

	err := validateScheduleResponse(response, []string{"Matematika"}, []string{"Senin"}, 2)
	if !errors.Is(err, errInvalidScheduleResponse) {
		t.Fatalf("expected invalid schedule response error, got %v", err)
	}
}

func TestValidateScheduleResponseRejectsUnknownSubject(t *testing.T) {
	response := validScheduleResponse()
	response.Schedule[0].Sessions[0].Subject = "Fisika"

	err := validateScheduleResponse(response, []string{"Matematika"}, []string{"Jumat"}, 2)
	if !errors.Is(err, errInvalidScheduleResponse) {
		t.Fatalf("expected invalid schedule response error, got %v", err)
	}
}

func TestValidateScheduleResponseAllowsValidSchedule(t *testing.T) {
	err := validateScheduleResponse(validScheduleResponse(), []string{"Matematika"}, []string{"Jumat"}, 2)
	if err != nil {
		t.Fatalf("expected valid schedule response, got %v", err)
	}
}

func validScheduleResponse() ScheduleResponse {
	return ScheduleResponse{
		Schedule: []DailySchedule{
			{
				Date: "2026-05-22",
				Sessions: []StudySession{
					{Subject: "Matematika", DurationMinutes: 60, Topic: "Aljabar"},
				},
			},
		},
		Tips: []string{"Belajar bertahap."},
	}
}

package gemini

import (
	"errors"
	"testing"
	"time"
)

func TestValidateScheduleDateBoundsRejectsPastDate(t *testing.T) {
	allowedDates := []string{"2026-05-22", "2026-05-23", "2026-05-26", "2026-05-27", "2026-05-29", "2026-05-30", "2026-06-01"}

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-05-11"}}, allowedDates)
	if !errors.Is(err, errInvalidScheduleDates) {
		t.Fatalf("expected invalid schedule date error, got %v", err)
	}
}

func TestValidateScheduleDateBoundsRejectsDateAfterExam(t *testing.T) {
	allowedDates := []string{"2026-05-22", "2026-05-23", "2026-05-26", "2026-05-27", "2026-05-29", "2026-05-30", "2026-06-01"}

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-06-29"}}, allowedDates)
	if !errors.Is(err, errInvalidScheduleDates) {
		t.Fatalf("expected invalid schedule date error, got %v", err)
	}
}

func TestValidateScheduleDateBoundsAllowsDateInRange(t *testing.T) {
	allowedDates := []string{"2026-06-01"}

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-06-01"}}, allowedDates)
	if err != nil {
		t.Fatalf("expected schedule date to be valid, got %v", err)
	}
}

func TestValidateScheduleDateBoundsAllowsDateEqualToEndDateAcrossTimezones(t *testing.T) {
	allowedDates := []string{"2026-06-28"}

	err := validateScheduleDateBounds([]DailySchedule{{Date: "2026-06-28"}}, allowedDates)
	if err != nil {
		t.Fatalf("expected schedule date equal to end date to be valid across timezones, got %v", err)
	}
}

func TestBuildAllowedScheduleDatesReturnsOnlyAllowedDays(t *testing.T) {
	startDate := time.Date(2026, 5, 22, 0, 0, 0, 0, time.FixedZone("WIB", 7*60*60))
	endDate := time.Date(2026, 5, 30, 0, 0, 0, 0, time.FixedZone("WIB", 7*60*60))

	dates := buildAllowedScheduleDates(startDate, endDate, []string{"Jumat", "Sabtu"}, 7)
	want := []string{"2026-05-22", "2026-05-23", "2026-05-29", "2026-05-30"}
	if len(dates) != len(want) {
		t.Fatalf("unexpected allowed dates length: got %d want %d (%v)", len(dates), len(want), dates)
	}
	for i := range want {
		if dates[i] != want[i] {
			t.Fatalf("unexpected allowed date at %d: got %q want %q", i, dates[i], want[i])
		}
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

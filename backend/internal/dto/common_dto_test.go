package dto

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestErrorResponseHidesDetailsWhenDisabled(t *testing.T) {
	SetExposeErrorDetails(false)

	body, err := json.Marshal(ErrorResponse{Success: false, Message: "Gagal", Error: "database details"})
	if err != nil {
		t.Fatalf("unexpected marshal error: %v", err)
	}
	if strings.Contains(string(body), "database details") || strings.Contains(string(body), `"error"`) {
		t.Fatalf("expected error details to be hidden, got %s", body)
	}
}

func TestErrorResponseIncludesDetailsWhenEnabled(t *testing.T) {
	SetExposeErrorDetails(true)
	t.Cleanup(func() { SetExposeErrorDetails(false) })

	body, err := json.Marshal(ErrorResponse{Success: false, Message: "Gagal", Error: "debug details"})
	if err != nil {
		t.Fatalf("unexpected marshal error: %v", err)
	}
	if !strings.Contains(string(body), "debug details") {
		t.Fatalf("expected error details during development, got %s", body)
	}
}

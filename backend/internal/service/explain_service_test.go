package service

import (
	"context"
	"errors"
	"strings"
	"testing"
)

func TestExplainRejectsLongQuestion(t *testing.T) {
	service := NewExplainService(nil, nil, nil, nil)

	_, err := service.Explain(context.Background(), "user-1", strings.Repeat("a", MaxExplainQuestionChars+1), "", "SD")
	if err == nil {
		t.Fatal("expected long question error")
	}
	if !errors.Is(err, ErrExplainQuestionTooLong) {
		t.Fatalf("unexpected error: %v", err)
	}
}

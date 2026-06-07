package service

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"sobat-pintar/internal/model"
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

func TestExplainRejectsExternalImageURL(t *testing.T) {
	service := NewExplainService(nil, nil, nil, nil)

	_, err := service.Explain(context.Background(), "user-1", "", "https://example.com/soal.jpg", "SD")
	if err == nil {
		t.Fatal("expected invalid image URL error")
	}
	if !errors.Is(err, ErrExplainImageURLInvalid) {
		t.Fatalf("unexpected error: %v", err)
	}
}

type explainRepositoryStub struct {
	original  *model.Explanation
	created   *model.Explanation
	retriedID string
	completed chan struct{}
	once      sync.Once
}

func (r *explainRepositoryStub) Create(_ context.Context, explanation *model.Explanation) error {
	copy := *explanation
	r.created = &copy
	return nil
}

func (r *explainRepositoryStub) Retry(_ context.Context, id, _ string) error {
	r.retriedID = id
	return nil
}

func (r *explainRepositoryStub) Complete(_ context.Context, _ string, _ string) error {
	r.once.Do(func() { close(r.completed) })
	return nil
}

func (r *explainRepositoryStub) Fail(_ context.Context, _ string, _ string) error {
	r.once.Do(func() { close(r.completed) })
	return nil
}

func (r *explainRepositoryStub) GetByUserID(context.Context, string) ([]*model.Explanation, error) {
	return nil, nil
}

func (r *explainRepositoryStub) GetByID(context.Context, string) (*model.Explanation, error) {
	return r.original, nil
}

func (r *explainRepositoryStub) GetByShareToken(context.Context, string) (*model.Explanation, error) {
	return nil, nil
}

func (r *explainRepositoryStub) SetShareToken(context.Context, string, string, string) error {
	return nil
}

func (r *explainRepositoryStub) Delete(context.Context, string) error {
	return nil
}

type explainGeneratorStub struct {
	textCalls      int
	imageCalls     int
	reExplainCalls int
}

func (g *explainGeneratorStub) ExplainQuestion(context.Context, string, string) (string, error) {
	g.textCalls++
	return "answer", nil
}

func (g *explainGeneratorStub) ExplainQuestionWithImage(context.Context, string, string, string) (string, error) {
	g.imageCalls++
	return "answer", nil
}

func (g *explainGeneratorStub) ReExplainQuestion(context.Context, string, string, string) (string, error) {
	g.reExplainCalls++
	return "answer", nil
}

func TestReExplainRetriesSameRecordForCompletedAndFailedResults(t *testing.T) {
	tests := []struct {
		name               string
		status             string
		imageURL           string
		answer             string
		wantTextCalls      int
		wantImageCalls     int
		wantReExplainCalls int
	}{
		{
			name:          "failed text retries original question",
			status:        AIResultStatusFailed,
			wantTextCalls: 1,
		},
		{
			name:               "completed text uses alternate explanation",
			status:             AIResultStatusCompleted,
			answer:             "previous answer",
			wantReExplainCalls: 1,
		},
		{
			name:           "failed image retries original image",
			status:         AIResultStatusFailed,
			imageURL:       "https://storage.example/uploads/question.jpg",
			wantImageCalls: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &explainRepositoryStub{
				original: &model.Explanation{
					ID:           "explain-1",
					UserID:       "user-1",
					QuestionText: "Apa itu fotosintesis?",
					ImageURL:     tt.imageURL,
					Level:        "SMP",
					Answer:       tt.answer,
					Status:       tt.status,
				},
				completed: make(chan struct{}),
			}
			generator := &explainGeneratorStub{}
			service := NewExplainService(repo, generator, nil, nil)

			result, err := service.ReExplain(context.Background(), "user-1", "explain-1")
			if err != nil {
				t.Fatalf("ReExplain returned error: %v", err)
			}
			if result.Status != AIResultStatusProcessing {
				t.Fatalf("expected processing result, got %q", result.Status)
			}
			if result.ID != "explain-1" || repo.retriedID != "explain-1" {
				t.Fatal("expected the original explanation record to be retried")
			}
			if repo.created != nil {
				t.Fatal("expected retry not to create a duplicate explanation")
			}

			select {
			case <-repo.completed:
			case <-time.After(time.Second):
				t.Fatal("timed out waiting for async retry")
			}

			if generator.textCalls != tt.wantTextCalls {
				t.Fatalf("expected %d text calls, got %d", tt.wantTextCalls, generator.textCalls)
			}
			if generator.imageCalls != tt.wantImageCalls {
				t.Fatalf("expected %d image calls, got %d", tt.wantImageCalls, generator.imageCalls)
			}
			if generator.reExplainCalls != tt.wantReExplainCalls {
				t.Fatalf("expected %d re-explain calls, got %d", tt.wantReExplainCalls, generator.reExplainCalls)
			}
		})
	}
}

func TestReExplainRejectsProcessingResult(t *testing.T) {
	repo := &explainRepositoryStub{
		original: &model.Explanation{
			ID:     "explain-1",
			UserID: "user-1",
			Status: AIResultStatusProcessing,
		},
		completed: make(chan struct{}),
	}
	service := NewExplainService(repo, &explainGeneratorStub{}, nil, nil)

	_, err := service.ReExplain(context.Background(), "user-1", "explain-1")
	if !errors.Is(err, ErrAIResultNotReady) {
		t.Fatalf("expected ErrAIResultNotReady, got %v", err)
	}
}

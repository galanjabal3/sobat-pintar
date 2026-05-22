package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/pkg/gemini"
)

type fakeChatRepo struct {
	session          *model.ChatSession
	sessions         []model.ChatSession
	messages         []*model.Message
	titleUpdated     string
	titleUpdateCalls int
}

func (r *fakeChatRepo) CreateSession(ctx context.Context, session *model.ChatSession) error {
	return nil
}

func (r *fakeChatRepo) GetSessionByID(ctx context.Context, id string) (*model.ChatSession, error) {
	if r.session == nil || r.session.ID != id {
		return nil, errors.New("not implemented")
	}
	return r.session, nil
}

func (r *fakeChatRepo) ListSessions(ctx context.Context, userID string) ([]model.ChatSession, error) {
	return r.sessions, nil
}

func (r *fakeChatRepo) DeleteSession(ctx context.Context, id string, userID string) error {
	return nil
}

func (r *fakeChatRepo) UpdateSessionTitle(ctx context.Context, id, title string) error {
	r.titleUpdated = title
	r.titleUpdateCalls++
	if r.session != nil && r.session.ID == id {
		r.session.Title = title
	}
	return nil
}

func (r *fakeChatRepo) CreateMessage(ctx context.Context, message *model.Message) error {
	r.messages = append(r.messages, message)
	return nil
}

func (r *fakeChatRepo) GetMessagesBySessionID(ctx context.Context, sessionID string) ([]*model.Message, error) {
	return r.messages, nil
}

func (r *fakeChatRepo) UpdateSessionTimestamp(ctx context.Context, id string) error {
	return nil
}

func TestChatListSessionsIncludesLastMessage(t *testing.T) {
	lastMessage := "Ini pesan terakhir"
	service := NewChatService(&fakeChatRepo{
		sessions: []model.ChatSession{
			{
				ID:          "session-1",
				UserID:      "user-1",
				Title:       "Obrolan Baru dengan Sobi",
				Level:       "SD",
				LastMessage: &lastMessage,
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
		},
	}, nil, nil, nil)

	sessions, err := service.ListSessions(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("ListSessions returned error: %v", err)
	}

	if len(sessions) != 1 {
		t.Fatalf("expected 1 session, got %d", len(sessions))
	}
	if sessions[0].LastMessage == nil {
		t.Fatal("expected last message to be populated")
	}
	if *sessions[0].LastMessage != lastMessage {
		t.Fatalf("unexpected last message: %s", *sessions[0].LastMessage)
	}
}

type fakeGeminiClient struct {
	response string
}

func (c *fakeGeminiClient) SendChatMessage(ctx context.Context, level string, history []gemini.HistoryMessage, message string) (string, error) {
	return c.response, nil
}

type fakeQuotaService struct {
	err     error
	calls   int
	feature string
	limit   int
}

func (q *fakeQuotaService) Consume(ctx context.Context, userID, feature string, limit int) error {
	q.calls++
	q.feature = feature
	q.limit = limit
	return q.err
}

func (q *fakeQuotaService) Refund(ctx context.Context, userID, feature string) error {
	return nil
}

func (q *fakeQuotaService) GetDailyUsage(ctx context.Context, userID string) (*dto.AIQuotaResponse, error) {
	return &dto.AIQuotaResponse{}, nil
}

func TestChatSendMessageAutoTitlesDefaultSession(t *testing.T) {
	repo := &fakeChatRepo{
		session: &model.ChatSession{
			ID:        "session-1",
			UserID:    "user-1",
			Title:     "Obrolan Baru dengan Sobi",
			Level:     "SD",
			CreatedAt: time.Now().Add(-time.Hour),
			UpdatedAt: time.Now().Add(-time.Hour),
		},
		messages: []*model.Message{},
	}
	service := NewChatService(repo, &fakeGeminiClient{response: "Jawaban Sobi"}, nil, nil)

	_, err := service.SendMessage(context.Background(), "user-1", "session-1", dto.SendMessageRequest{
		Message: "Cara kerja fotosintesis?",
	})
	if err != nil {
		t.Fatalf("SendMessage returned error: %v", err)
	}

	if repo.titleUpdateCalls != 1 {
		t.Fatalf("expected title to be updated once, got %d", repo.titleUpdateCalls)
	}

	expectedTitle := "Cara kerja fotosintesis?"
	if repo.titleUpdated != expectedTitle {
		t.Fatalf("unexpected title update: %q", repo.titleUpdated)
	}
	if repo.session.Title != expectedTitle {
		t.Fatalf("expected session title to be updated, got %q", repo.session.Title)
	}
}

func TestChatSendMessageRejectsLongMessage(t *testing.T) {
	service := NewChatService(nil, nil, nil, nil)

	_, err := service.SendMessage(context.Background(), "user-1", "session-1", dto.SendMessageRequest{
		Message: strings.Repeat("a", MaxChatMessageChars+1),
	})
	if err == nil {
		t.Fatal("expected long message error")
	}
	if !errors.Is(err, ErrChatMessageTooLong) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestChatSendMessageRejectsQuotaExceeded(t *testing.T) {
	repo := &fakeChatRepo{
		session: &model.ChatSession{
			ID:        "session-1",
			UserID:    "user-1",
			Title:     "Obrolan Baru dengan Sobi",
			Level:     "SD",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}
	quota := &fakeQuotaService{err: &QuotaExceededError{Feature: AIFeatureChat, Limit: ChatDailyQuota}}
	service := NewChatService(repo, &fakeGeminiClient{response: "Jawaban Sobi"}, nil, quota)

	_, err := service.SendMessage(context.Background(), "user-1", "session-1", dto.SendMessageRequest{
		Message: "Cara kerja fotosintesis?",
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
	if len(repo.messages) != 0 {
		t.Fatalf("expected no messages to be stored, got %d", len(repo.messages))
	}
}

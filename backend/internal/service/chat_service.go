package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/gemini"
)

const defaultChatSessionTitle = "Obrolan Baru dengan Sobi"

type ChatService interface {
	CreateSession(ctx context.Context, userID string, req dto.CreateChatSessionRequest) (*dto.ChatSessionResponse, error)
	ListSessions(ctx context.Context, userID string) ([]dto.ChatSessionResponse, error)
	GetSessionDetail(ctx context.Context, userID string, sessionID string) (*dto.ChatDetailResponse, error)
	SendMessage(ctx context.Context, userID string, sessionID string, req dto.SendMessageRequest) (*dto.MessageResponse, error)
	DeleteSession(ctx context.Context, userID string, sessionID string) error
}

type chatGenerator interface {
	SendChatMessage(ctx context.Context, level string, history []gemini.HistoryMessage, message string) (string, error)
}

type chatService struct {
	repo         repository.ChatRepository
	geminiClient chatGenerator
	gamify       GamificationService
}

func NewChatService(repo repository.ChatRepository, geminiClient chatGenerator, gamify GamificationService) ChatService {
	return &chatService{
		repo:         repo,
		geminiClient: geminiClient,
		gamify:       gamify,
	}
}

func (s *chatService) CreateSession(ctx context.Context, userID string, req dto.CreateChatSessionRequest) (*dto.ChatSessionResponse, error) {
	if req.Level == "" {
		req.Level = "SD"
	}

	session := &model.ChatSession{
		ID:        uuid.New().String(),
		UserID:    userID,
		Title:     req.Title,
		Level:     req.Level,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}

	return &dto.ChatSessionResponse{
		ID:        session.ID,
		Title:     session.Title,
		Level:     session.Level,
		CreatedAt: session.CreatedAt,
		UpdatedAt: session.UpdatedAt,
	}, nil
}

func (s *chatService) ListSessions(ctx context.Context, userID string) ([]dto.ChatSessionResponse, error) {
	sessions, err := s.repo.ListSessions(ctx, userID)
	if err != nil {
		return nil, err
	}

	var res []dto.ChatSessionResponse
	for _, s := range sessions {
		res = append(res, dto.ChatSessionResponse{
			ID:          s.ID,
			Title:       s.Title,
			Level:       s.Level,
			LastMessage: s.LastMessage,
			CreatedAt:   s.CreatedAt,
			UpdatedAt:   s.UpdatedAt,
		})
	}
	return res, nil
}

func (s *chatService) GetSessionDetail(ctx context.Context, userID string, sessionID string) (*dto.ChatDetailResponse, error) {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if session.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	messages, err := s.repo.GetMessagesBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	var msgRes []dto.MessageResponse
	for _, m := range messages {
		msgRes = append(msgRes, dto.MessageResponse{
			ID:        m.ID,
			Role:      m.Role,
			Content:   m.Content,
			CreatedAt: m.CreatedAt,
			Status:    m.Status,
		})
	}

	return &dto.ChatDetailResponse{
		Session: dto.ChatSessionResponse{
			ID:        session.ID,
			Title:     session.Title,
			Level:     session.Level,
			CreatedAt: session.CreatedAt,
			UpdatedAt: session.UpdatedAt,
		},
		Messages: msgRes,
	}, nil
}

func (s *chatService) SendMessage(ctx context.Context, userID string, sessionID string, req dto.SendMessageRequest) (*dto.MessageResponse, error) {
	session, err := s.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if session.UserID != userID {
		return nil, fmt.Errorf("unauthorized")
	}

	// 1. Save user message
	userMsg := &model.Message{
		ID:        uuid.New().String(),
		SessionID: sessionID,
		Role:      "user",
		Content:   req.Message,
		Status:    "sent",
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreateMessage(ctx, userMsg); err != nil {
		return nil, err
	}

	if shouldAutoTitleChatSession(session.Title) {
		nextTitle := buildChatSessionTitle(req.Message)
		if nextTitle != session.Title {
			if err := s.repo.UpdateSessionTitle(ctx, sessionID, nextTitle); err == nil {
				session.Title = nextTitle
			}
		}
	}

	// 2. Get history for Gemini
	messages, err := s.repo.GetMessagesBySessionID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	var history []gemini.HistoryMessage
	for _, m := range messages {
		// Don't include the message we just sent in history if Gemini SendMessage handles it as current message
		if m.ID == userMsg.ID {
			continue
		}
		history = append(history, gemini.HistoryMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	// 3. Call Gemini
	aiResponse, err := s.geminiClient.SendChatMessage(ctx, session.Level, history, req.Message)
	if err != nil {
		failedMsg := &model.Message{
			ID:        uuid.New().String(),
			SessionID: sessionID,
			Role:      "assistant",
			Content:   "Maaf, Sobi belum bisa menjawab sekarang. Coba kirim lagi sebentar lagi ya.",
			Status:    "failed",
			CreatedAt: time.Now(),
		}
		if createErr := s.repo.CreateMessage(ctx, failedMsg); createErr != nil {
			return nil, createErr
		}
		return &dto.MessageResponse{
			ID:        failedMsg.ID,
			Role:      failedMsg.Role,
			Content:   failedMsg.Content,
			CreatedAt: failedMsg.CreatedAt,
			Status:    failedMsg.Status,
		}, nil
	}

	// 4. Save AI response
	aiMsg := &model.Message{
		ID:        uuid.New().String(),
		SessionID: sessionID,
		Role:      "assistant",
		Content:   aiResponse,
		Status:    "sent",
		CreatedAt: time.Now(),
	}
	if err := s.repo.CreateMessage(ctx, aiMsg); err != nil {
		return nil, err
	}

	// 5. Update session timestamp
	_ = s.repo.UpdateSessionTimestamp(ctx, sessionID)

	// Award points for chatting
	if s.gamify != nil {
		_ = s.gamify.AddPoints(ctx, userID, 5, "chat_message")
	}

	return &dto.MessageResponse{
		ID:        aiMsg.ID,
		Role:      aiMsg.Role,
		Content:   aiMsg.Content,
		CreatedAt: aiMsg.CreatedAt,
		Status:    "sent",
	}, nil
}

func (s *chatService) DeleteSession(ctx context.Context, userID string, sessionID string) error {
	return s.repo.DeleteSession(ctx, sessionID, userID)
}

func shouldAutoTitleChatSession(title string) bool {
	normalized := strings.TrimSpace(title)
	return normalized == "" || normalized == defaultChatSessionTitle
}

func buildChatSessionTitle(message string) string {
	cleaned := strings.Join(strings.Fields(message), " ")
	if cleaned == "" {
		return defaultChatSessionTitle
	}

	const maxTitleLength = 48
	runes := []rune(cleaned)
	if len(runes) <= maxTitleLength {
		return cleaned
	}

	return strings.TrimSpace(string(runes[:maxTitleLength])) + "..."
}

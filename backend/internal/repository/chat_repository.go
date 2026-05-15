package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type ChatRepository interface {
	CreateSession(ctx context.Context, session *model.ChatSession) error
	GetSessionByID(ctx context.Context, id string) (*model.ChatSession, error)
	ListSessions(ctx context.Context, userID string) ([]model.ChatSession, error)
	DeleteSession(ctx context.Context, id string, userID string) error
	CreateMessage(ctx context.Context, message *model.Message) error
	GetMessagesBySessionID(ctx context.Context, sessionID string) ([]*model.Message, error)
	UpdateSessionTimestamp(ctx context.Context, id string) error
}

type chatRepository struct {
	db *pgxpool.Pool
}

func NewChatRepository(db *pgxpool.Pool) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) CreateSession(ctx context.Context, session *model.ChatSession) error {
	query := `INSERT INTO chat_sessions (id, user_id, title, level, created_at, updated_at) 
			  VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, session.ID, session.UserID, session.Title, session.Level, session.CreatedAt, session.UpdatedAt)
	return err
}

func (r *chatRepository) GetSessionByID(ctx context.Context, id string) (*model.ChatSession, error) {
	query := `SELECT id, user_id, title, level, created_at, updated_at FROM chat_sessions WHERE id = $1`
	session := &model.ChatSession{}
	err := r.db.QueryRow(ctx, query, id).Scan(&session.ID, &session.UserID, &session.Title, &session.Level, &session.CreatedAt, &session.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *chatRepository) ListSessions(ctx context.Context, userID string) ([]model.ChatSession, error) {
	query := `SELECT id, user_id, title, level, created_at, updated_at FROM chat_sessions WHERE user_id = $1 ORDER BY updated_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []model.ChatSession
	for rows.Next() {
		var s model.ChatSession
		if err := rows.Scan(&s.ID, &s.UserID, &s.Title, &s.Level, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (r *chatRepository) DeleteSession(ctx context.Context, id string, userID string) error {
	query := `DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, id, userID)
	return err
}

func (r *chatRepository) CreateMessage(ctx context.Context, message *model.Message) error {
	query := `INSERT INTO chat_messages (id, session_id, role, content, created_at) 
			  VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, message.ID, message.SessionID, message.Role, message.Content, message.CreatedAt)
	if err != nil {
		return err
	}

	// Update session updated_at
	_, err = r.db.Exec(ctx, "UPDATE chat_sessions SET updated_at = $1 WHERE id = $2", message.CreatedAt, message.SessionID)
	return err
}

func (r *chatRepository) GetMessagesBySessionID(ctx context.Context, sessionID string) ([]*model.Message, error) {
	query := `SELECT id, session_id, role, content, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC`
	rows, err := r.db.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*model.Message
	for rows.Next() {
		m := &model.Message{}
		if err := rows.Scan(&m.ID, &m.SessionID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}
func (r *chatRepository) UpdateSessionTimestamp(ctx context.Context, id string) error {
	query := `UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

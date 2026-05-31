package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type SummaryRepository interface {
	Create(ctx context.Context, summary *model.Summary) error
	Complete(ctx context.Context, id string, summaryText string) error
	Fail(ctx context.Context, id string, message string) error
	GetByID(ctx context.Context, id string) (*model.Summary, error)
	GetByShareToken(ctx context.Context, token string) (*model.Summary, error)
	SetShareToken(ctx context.Context, id, userID, token string) error
	ListByUserID(ctx context.Context, userID string) ([]model.Summary, error)
	Delete(ctx context.Context, id string, userID string) error
}

type summaryRepository struct {
	db *pgxpool.Pool
}

func NewSummaryRepository(db *pgxpool.Pool) SummaryRepository {
	return &summaryRepository{db: db}
}

func (r *summaryRepository) Create(ctx context.Context, summary *model.Summary) error {
	query := `INSERT INTO summaries (id, user_id, source_type, file_url, content, summary, status, error_message, created_at, completed_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.Exec(ctx, query, summary.ID, summary.UserID, summary.SourceType, summary.FileURL, summary.Content, summary.Summary, summary.Status, summary.ErrorMessage, summary.CreatedAt, summary.CompletedAt)
	return err
}

func (r *summaryRepository) Complete(ctx context.Context, id string, summaryText string) error {
	query := `UPDATE summaries SET summary = $1, status = 'completed', error_message = NULL, completed_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, summaryText, id)
	return err
}

func (r *summaryRepository) Fail(ctx context.Context, id string, message string) error {
	query := `UPDATE summaries SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, message, id)
	return err
}

func (r *summaryRepository) GetByID(ctx context.Context, id string) (*model.Summary, error) {
	query := `SELECT id, user_id, source_type, file_url, content, summary, status, error_message, share_token, created_at, completed_at FROM summaries WHERE id = $1`
	s := &model.Summary{}
	err := r.db.QueryRow(ctx, query, id).Scan(&s.ID, &s.UserID, &s.SourceType, &s.FileURL, &s.Content, &s.Summary, &s.Status, &s.ErrorMessage, &s.ShareToken, &s.CreatedAt, &s.CompletedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *summaryRepository) GetByShareToken(ctx context.Context, token string) (*model.Summary, error) {
	query := `SELECT id, user_id, source_type, file_url, content, summary, status, error_message, share_token, created_at, completed_at FROM summaries WHERE share_token = $1 AND status = 'completed'`
	s := &model.Summary{}
	err := r.db.QueryRow(ctx, query, token).Scan(&s.ID, &s.UserID, &s.SourceType, &s.FileURL, &s.Content, &s.Summary, &s.Status, &s.ErrorMessage, &s.ShareToken, &s.CreatedAt, &s.CompletedAt)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *summaryRepository) SetShareToken(ctx context.Context, id, userID, token string) error {
	query := `UPDATE summaries SET share_token = $1 WHERE id = $2 AND user_id = $3 AND status = 'completed'`
	_, err := r.db.Exec(ctx, query, token, id, userID)
	return err
}

func (r *summaryRepository) ListByUserID(ctx context.Context, userID string) ([]model.Summary, error) {
	query := `SELECT id, user_id, source_type, file_url, content, summary, status, error_message, created_at, completed_at
			  FROM summaries
			  WHERE user_id = $1
			  ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []model.Summary
	for rows.Next() {
		var s model.Summary
		err := rows.Scan(&s.ID, &s.UserID, &s.SourceType, &s.FileURL, &s.Content, &s.Summary, &s.Status, &s.ErrorMessage, &s.CreatedAt, &s.CompletedAt)
		if err != nil {
			return nil, err
		}
		summaries = append(summaries, s)
	}
	return summaries, nil
}

func (r *summaryRepository) Delete(ctx context.Context, id string, userID string) error {
	query := `DELETE FROM summaries WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, id, userID)
	return err
}

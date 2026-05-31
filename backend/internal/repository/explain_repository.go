package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type ExplainRepository interface {
	Create(ctx context.Context, explanation *model.Explanation) error
	Complete(ctx context.Context, id string, answer string) error
	Fail(ctx context.Context, id string, message string) error
	GetByUserID(ctx context.Context, userID string) ([]*model.Explanation, error)
	GetByID(ctx context.Context, id string) (*model.Explanation, error)
	GetByShareToken(ctx context.Context, token string) (*model.Explanation, error)
	SetShareToken(ctx context.Context, id, userID, token string) error
	Delete(ctx context.Context, id string) error
}

type explainRepository struct {
	db *pgxpool.Pool
}

func NewExplainRepository(db *pgxpool.Pool) ExplainRepository {
	return &explainRepository{db: db}
}

func (r *explainRepository) Create(ctx context.Context, e *model.Explanation) error {
	query := `INSERT INTO explanations (id, user_id, question_text, image_url, level, answer, status, error_message, created_at, completed_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.Exec(ctx, query, e.ID, e.UserID, e.QuestionText, e.ImageURL, e.Level, e.Answer, e.Status, e.ErrorMessage, e.CreatedAt, e.CompletedAt)
	return err
}

func (r *explainRepository) Complete(ctx context.Context, id string, answer string) error {
	query := `UPDATE explanations SET answer = $1, status = 'completed', error_message = NULL, completed_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, answer, id)
	return err
}

func (r *explainRepository) Fail(ctx context.Context, id string, message string) error {
	query := `UPDATE explanations SET status = 'failed', error_message = $1, completed_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, message, id)
	return err
}

func (r *explainRepository) GetByUserID(ctx context.Context, userID string) ([]*model.Explanation, error) {
	query := `SELECT id, user_id, question_text, image_url, level, answer, status, error_message, created_at, completed_at
			  FROM explanations
			  WHERE user_id = $1
			  ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var explanations []*model.Explanation
	for rows.Next() {
		e := &model.Explanation{}
		err := rows.Scan(&e.ID, &e.UserID, &e.QuestionText, &e.ImageURL, &e.Level, &e.Answer, &e.Status, &e.ErrorMessage, &e.CreatedAt, &e.CompletedAt)
		if err != nil {
			return nil, err
		}
		explanations = append(explanations, e)
	}
	return explanations, nil
}

func (r *explainRepository) GetByID(ctx context.Context, id string) (*model.Explanation, error) {
	query := `SELECT id, user_id, question_text, image_url, level, answer, status, error_message, share_token, created_at, completed_at FROM explanations WHERE id = $1`
	e := &model.Explanation{}
	err := r.db.QueryRow(ctx, query, id).Scan(&e.ID, &e.UserID, &e.QuestionText, &e.ImageURL, &e.Level, &e.Answer, &e.Status, &e.ErrorMessage, &e.ShareToken, &e.CreatedAt, &e.CompletedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *explainRepository) GetByShareToken(ctx context.Context, token string) (*model.Explanation, error) {
	query := `SELECT id, user_id, question_text, image_url, level, answer, status, error_message, share_token, created_at, completed_at FROM explanations WHERE share_token = $1 AND status = 'completed'`
	e := &model.Explanation{}
	err := r.db.QueryRow(ctx, query, token).Scan(&e.ID, &e.UserID, &e.QuestionText, &e.ImageURL, &e.Level, &e.Answer, &e.Status, &e.ErrorMessage, &e.ShareToken, &e.CreatedAt, &e.CompletedAt)
	if err != nil {
		return nil, err
	}
	return e, nil
}

func (r *explainRepository) SetShareToken(ctx context.Context, id, userID, token string) error {
	query := `UPDATE explanations SET share_token = $1 WHERE id = $2 AND user_id = $3 AND status = 'completed'`
	_, err := r.db.Exec(ctx, query, token, id, userID)
	return err
}

func (r *explainRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM explanations WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

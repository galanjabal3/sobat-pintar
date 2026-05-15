package repository

import (
	"context"
	"database/sql"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type PracticeRepository interface {
	CreateSession(ctx context.Context, session *model.PracticeSession) error
	GetSessionByID(ctx context.Context, id string) (*model.PracticeSession, error)
	GetHistoryByUserID(ctx context.Context, userID string) ([]*model.PracticeSession, error)
	CreateQuestions(ctx context.Context, questions []*model.Question) error
	GetQuestionsBySessionID(ctx context.Context, sessionID string) ([]*model.Question, error)
	GetQuestionByID(ctx context.Context, questionID string) (*model.Question, error)
	UpdateQuestionAnswer(ctx context.Context, questionID string, userAnswer string, isCorrect bool) error
	CompleteSession(ctx context.Context, sessionID string, score int) error
}

func (r *practiceRepository) GetHistoryByUserID(ctx context.Context, userID string) ([]*model.PracticeSession, error) {
	query := `SELECT id, user_id, subject, difficulty, score, created_at, completed_at 
			  FROM practice_sessions 
			  WHERE user_id = $1 AND completed_at IS NOT NULL 
			  ORDER BY completed_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*model.PracticeSession
	for rows.Next() {
		s := &model.PracticeSession{}
		var score sql.NullInt64
		err := rows.Scan(&s.ID, &s.UserID, &s.Subject, &s.Difficulty, &score, &s.CreatedAt, &s.CompletedAt)
		if err != nil {
			return nil, err
		}
		s.Score = score
		sessions = append(sessions, s)
	}
	return sessions, nil
}

type practiceRepository struct {
	db *pgxpool.Pool
}

func NewPracticeRepository(db *pgxpool.Pool) PracticeRepository {
	return &practiceRepository{db: db}
}

func (r *practiceRepository) CreateSession(ctx context.Context, session *model.PracticeSession) error {
	query := `INSERT INTO practice_sessions (id, user_id, subject, difficulty, created_at) 
			  VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, session.ID, session.UserID, session.Subject, session.Difficulty, session.CreatedAt)
	return err
}

func (r *practiceRepository) GetSessionByID(ctx context.Context, id string) (*model.PracticeSession, error) {
	query := `SELECT id, user_id, subject, difficulty, score, created_at, completed_at FROM practice_sessions WHERE id = $1`
	s := &model.PracticeSession{}
	var score sql.NullInt64
	err := r.db.QueryRow(ctx, query, id).Scan(&s.ID, &s.UserID, &s.Subject, &s.Difficulty, &score, &s.CreatedAt, &s.CompletedAt)
	if err != nil {
		return nil, err
	}
	s.Score = score
	return s, nil
}

func (r *practiceRepository) CreateQuestions(ctx context.Context, questions []*model.Question) error {
	for _, q := range questions {
		query := `INSERT INTO questions (id, session_id, question_text, options, correct_answer, explanation) 
				  VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.db.Exec(ctx, query, q.ID, q.SessionID, q.QuestionText, q.Options, q.CorrectAnswer, q.Explanation)
		if err != nil {
			return err
		}
	}
	return nil
}

func (r *practiceRepository) GetQuestionsBySessionID(ctx context.Context, sessionID string) ([]*model.Question, error) {
	query := `SELECT id, session_id, question_text, options, correct_answer, user_answer, is_correct, explanation FROM questions WHERE session_id = $1`
	rows, err := r.db.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var questions []*model.Question
	for rows.Next() {
		q := &model.Question{}
		var isCorrect sql.NullBool
		err := rows.Scan(&q.ID, &q.SessionID, &q.QuestionText, &q.Options, &q.CorrectAnswer, &q.UserAnswer, &isCorrect, &q.Explanation)
		if err != nil {
			return nil, err
		}
		if isCorrect.Valid {
			val := isCorrect.Bool
			q.IsCorrect = &val
		}
		questions = append(questions, q)
	}
	return questions, nil
}

func (r *practiceRepository) GetQuestionByID(ctx context.Context, questionID string) (*model.Question, error) {
	query := `SELECT id, session_id, question_text, options, correct_answer, user_answer, is_correct, explanation FROM questions WHERE id = $1`
	q := &model.Question{}
	var isCorrect sql.NullBool
	err := r.db.QueryRow(ctx, query, questionID).Scan(&q.ID, &q.SessionID, &q.QuestionText, &q.Options, &q.CorrectAnswer, &q.UserAnswer, &isCorrect, &q.Explanation)
	if err != nil {
		return nil, err
	}
	if isCorrect.Valid {
		val := isCorrect.Bool
		q.IsCorrect = &val
	}
	return q, nil
}

func (r *practiceRepository) UpdateQuestionAnswer(ctx context.Context, questionID string, userAnswer string, isCorrect bool) error {
	query := `UPDATE questions SET user_answer = $1, is_correct = $2 WHERE id = $3`
	_, err := r.db.Exec(ctx, query, userAnswer, isCorrect, questionID)
	return err
}

func (r *practiceRepository) CompleteSession(ctx context.Context, sessionID string, score int) error {
	query := `UPDATE practice_sessions SET score = $1, completed_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, score, sessionID)
	return err
}

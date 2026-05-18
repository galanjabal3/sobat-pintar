package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	GetByEmail(ctx context.Context, email string) (*model.User, error)
	GetByID(ctx context.Context, id string) (*model.User, error)
	Update(ctx context.Context, user *model.User) error
}

type userRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	query := `INSERT INTO users (id, name, email, password_hash, google_id, level, created_at) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, user.ID, user.Name, user.Email, user.PasswordHash, user.GoogleID, user.Level, user.CreatedAt)
	return err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `SELECT id, name, email, password_hash, google_id, level, points, streak, last_activity_at, created_at FROM users WHERE email = $1`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.GoogleID, &user.Level, &user.Points, &user.Streak, &user.LastActivityAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `SELECT id, name, email, password_hash, google_id, level, points, streak, last_activity_at, created_at FROM users WHERE id = $1`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.GoogleID, &user.Level, &user.Points, &user.Streak, &user.LastActivityAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) Update(ctx context.Context, user *model.User) error {
	query := `UPDATE users SET name = $1, level = $2, points = $3, streak = $4, last_activity_at = $5 WHERE id = $6`
	_, err := r.db.Exec(ctx, query, user.Name, user.Level, user.Points, user.Streak, user.LastActivityAt, user.ID)
	return err
}

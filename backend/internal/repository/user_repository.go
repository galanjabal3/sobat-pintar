package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type UserRepository interface {
	Create(ctx context.Context, user *model.User) error
	GetByEmail(ctx context.Context, email string) (*model.User, error)
	GetByID(ctx context.Context, id string) (*model.User, error)
	GetByVerificationTokenHash(ctx context.Context, tokenHash string) (*model.User, error)
	Update(ctx context.Context, user *model.User) error
	UpdateEmailVerification(ctx context.Context, userID string, emailVerified bool, tokenHash *string, tokenExpiresAt *time.Time) error
	UpdateProfile(ctx context.Context, userID, name, level string, avatarURL, avatarPublicID *string) error
}

type userRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *model.User) error {
	query := `INSERT INTO users (id, name, email, password_hash, google_id, level, email_verified, email_verification_token_hash, email_verification_expires_at, created_at)
			  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.Exec(ctx, query, user.ID, user.Name, user.Email, user.PasswordHash, user.GoogleID, user.Level, user.EmailVerified, user.EmailVerificationTokenHash, user.EmailVerificationExpiresAt, user.CreatedAt)
	return err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	query := `SELECT id, name, email, password_hash, google_id, level, email_verified, avatar_url, avatar_public_id, points, streak, email_verification_token_hash, email_verification_expires_at, last_activity_at, created_at FROM users WHERE LOWER(email) = LOWER($1)`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.GoogleID, &user.Level, &user.EmailVerified, &user.AvatarURL, &user.AvatarPublicID, &user.Points, &user.Streak, &user.EmailVerificationTokenHash, &user.EmailVerificationExpiresAt, &user.LastActivityAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) GetByID(ctx context.Context, id string) (*model.User, error) {
	query := `SELECT id, name, email, password_hash, google_id, level, email_verified, avatar_url, avatar_public_id, points, streak, email_verification_token_hash, email_verification_expires_at, last_activity_at, created_at FROM users WHERE id = $1`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, id).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.GoogleID, &user.Level, &user.EmailVerified, &user.AvatarURL, &user.AvatarPublicID, &user.Points, &user.Streak, &user.EmailVerificationTokenHash, &user.EmailVerificationExpiresAt, &user.LastActivityAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) GetByVerificationTokenHash(ctx context.Context, tokenHash string) (*model.User, error) {
	query := `SELECT id, name, email, password_hash, google_id, level, email_verified, avatar_url, avatar_public_id, points, streak, email_verification_token_hash, email_verification_expires_at, last_activity_at, created_at
		FROM users
		WHERE email_verification_token_hash = $1`
	user := &model.User{}
	err := r.db.QueryRow(ctx, query, tokenHash).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.GoogleID, &user.Level, &user.EmailVerified, &user.AvatarURL, &user.AvatarPublicID, &user.Points, &user.Streak, &user.EmailVerificationTokenHash, &user.EmailVerificationExpiresAt, &user.LastActivityAt, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) Update(ctx context.Context, user *model.User) error {
	query := `UPDATE users SET name = $1, level = $2, points = $3, streak = $4, last_activity_at = $5, google_id = $6 WHERE id = $7`
	_, err := r.db.Exec(ctx, query, user.Name, user.Level, user.Points, user.Streak, user.LastActivityAt, user.GoogleID, user.ID)
	return err
}

func (r *userRepository) UpdateEmailVerification(ctx context.Context, userID string, emailVerified bool, tokenHash *string, tokenExpiresAt *time.Time) error {
	query := `UPDATE users SET email_verified = $1, email_verification_token_hash = $2, email_verification_expires_at = $3 WHERE id = $4`
	_, err := r.db.Exec(ctx, query, emailVerified, tokenHash, tokenExpiresAt, userID)
	return err
}

func (r *userRepository) UpdateProfile(ctx context.Context, userID, name, level string, avatarURL, avatarPublicID *string) error {
	query := `UPDATE users SET name = $1, level = $2, avatar_url = $3, avatar_public_id = $4 WHERE id = $5`
	_, err := r.db.Exec(ctx, query, name, level, avatarURL, avatarPublicID, userID)
	return err
}

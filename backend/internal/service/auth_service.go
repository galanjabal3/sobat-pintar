package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/jwt"
)

type AuthService interface {
	Register(ctx context.Context, name, email, password, level string) (*model.User, error)
	Login(ctx context.Context, email, password string) (string, string, *model.User, error)
	GetProfile(ctx context.Context, userID string) (*model.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
}

type authService struct {
	repo       repository.UserRepository
	jwtService *jwt.JWTService
}

func NewAuthService(repo repository.UserRepository, jwtService *jwt.JWTService) AuthService {
	return &authService{
		repo:       repo,
		jwtService: jwtService,
	}
}

func (s *authService) Register(ctx context.Context, name, email, password, level string) (*model.User, error) {
	// Check if user already exists
	existing, err := s.repo.GetByEmail(ctx, email)
	if err != nil && !strings.Contains(err.Error(), "no rows") {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &model.User{
		ID:           uuid.New().String(),
		Name:         name,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Level:          level,
		LastActivityAt: time.Now(),
		CreatedAt:      time.Now(),
	}

	err = s.repo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (string, string, *model.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	accessToken, refreshToken, err := s.jwtService.GenerateToken(user.ID, user.Level)
	if err != nil {
		return "", "", nil, err
	}

	// Calculate Streak
	now := time.Now()
	lastActivity := user.LastActivityAt

	// Reset time to midnight for day comparison
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	lastDay := time.Date(lastActivity.Year(), lastActivity.Month(), lastActivity.Day(), 0, 0, 0, 0, lastActivity.Location())

	daysDiff := int(today.Sub(lastDay).Hours() / 24)

	if daysDiff == 1 {
		// Continued streak
		user.Streak++
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	} else if daysDiff > 1 {
		// Streak broken
		user.Streak = 1
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	} else if daysDiff == 0 && user.Streak == 0 {
		// First activity of the day (for new users or if streak was 0)
		user.Streak = 1
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	} else {
		// Already active today, just update last activity time
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	}

	return accessToken, refreshToken, user, nil
}

func (s *authService) GetProfile(ctx context.Context, userID string) (*model.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	claims, err := s.jwtService.ValidateToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	user, err := s.repo.GetByID(ctx, claims.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}

	accessToken, _, err := s.jwtService.GenerateToken(user.ID, user.Level)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

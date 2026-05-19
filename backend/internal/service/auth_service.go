package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/cloudinary"
	"sobat-pintar/pkg/jwt"
	"sobat-pintar/pkg/logger"
)

type AuthService interface {
	Register(ctx context.Context, name, email, password, level string) (*model.User, error)
	Login(ctx context.Context, email, password string) (string, string, *model.User, error)
	GoogleLogin(ctx context.Context, idToken string) (string, string, *model.User, error)
	GetProfile(ctx context.Context, userID string) (*model.User, error)
	UpdateProfile(ctx context.Context, userID, name, level string, avatarURL, avatarPublicID *string) (*model.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
}

type authService struct {
	repo           repository.UserRepository
	jwtService     *jwt.JWTService
	googleClientID string
	cloudinary     *cloudinary.Client
}

func NewAuthService(repo repository.UserRepository, jwtService *jwt.JWTService, googleClientID string, cloudinaryClient *cloudinary.Client) AuthService {
	return &authService{
		repo:           repo,
		jwtService:     jwtService,
		googleClientID: googleClientID,
		cloudinary:     cloudinaryClient,
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

	hashedPasswordStr := string(hashedPassword)
	user := &model.User{
		ID:             uuid.New().String(),
		Name:           name,
		Email:          email,
		PasswordHash:   &hashedPasswordStr,
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

	if user.PasswordHash == nil {
		return "", "", nil, errors.New("this account uses Google Login. Please sign in with Google")
	}

	err = bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password))
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	accessToken, refreshToken, err := s.jwtService.GenerateToken(user.ID, user.Level)
	if err != nil {
		return "", "", nil, err
	}

	// Update Streak
	s.updateStreak(ctx, user)

	return accessToken, refreshToken, user, nil
}

func (s *authService) GoogleLogin(ctx context.Context, idToken string) (string, string, *model.User, error) {
	payload, err := idtoken.Validate(ctx, idToken, s.googleClientID)
	if err != nil {
		return "", "", nil, errors.New("invalid google token")
	}

	email := payload.Claims["email"].(string)
	name := payload.Claims["name"].(string)
	googleID := payload.Subject

	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil && !strings.Contains(err.Error(), "no rows") {
		return "", "", nil, err
	}

	if user == nil {
		// Auto-register
		user = &model.User{
			ID:             uuid.New().String(),
			Name:           name,
			Email:          email,
			GoogleID:       &googleID,
			Level:          "SD", // Default level
			LastActivityAt: time.Now(),
			CreatedAt:      time.Now(),
		}
		err = s.repo.Create(ctx, user)
		if err != nil {
			return "", "", nil, err
		}
	} else {
		// Update GoogleID if not set
		if user.GoogleID == nil {
			user.GoogleID = &googleID
			_ = s.repo.Update(ctx, user)
		}
	}

	accessToken, refreshToken, err := s.jwtService.GenerateToken(user.ID, user.Level)
	if err != nil {
		return "", "", nil, err
	}

	s.updateStreak(ctx, user)

	return accessToken, refreshToken, user, nil
}

func (s *authService) updateStreak(ctx context.Context, user *model.User) {
	now := time.Now()
	lastActivity := user.LastActivityAt

	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	lastDay := time.Date(lastActivity.Year(), lastActivity.Month(), lastActivity.Day(), 0, 0, 0, 0, lastActivity.Location())

	daysDiff := int(today.Sub(lastDay).Hours() / 24)

	if daysDiff == 1 {
		user.Streak++
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	} else if daysDiff > 1 {
		user.Streak = 1
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	} else if daysDiff == 0 && user.Streak == 0 {
		user.Streak = 1
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	} else {
		user.LastActivityAt = now
		_ = s.repo.Update(ctx, user)
	}
}

func (s *authService) GetProfile(ctx context.Context, userID string) (*model.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *authService) UpdateProfile(ctx context.Context, userID, name, level string, avatarURL, avatarPublicID *string) (*model.User, error) {
	currentUser, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if shouldDeleteAvatar(currentUser.AvatarPublicID, avatarPublicID) {
		if s.cloudinary == nil {
			logger.Info("Skipping old avatar deletion because Cloudinary client is not initialized", "user_id", userID)
		} else if err := s.cloudinary.DeleteImage(*currentUser.AvatarPublicID); err != nil {
			logger.Error(err, "Failed to delete old profile avatar", "user_id", userID, "public_id", *currentUser.AvatarPublicID)
		}
	}

	if err := s.repo.UpdateProfile(ctx, userID, name, level, avatarURL, avatarPublicID); err != nil {
		return nil, err
	}

	return s.repo.GetByID(ctx, userID)
}

func shouldDeleteAvatar(currentPublicID, nextPublicID *string) bool {
	if currentPublicID == nil || *currentPublicID == "" {
		return false
	}

	if nextPublicID == nil || *nextPublicID == "" {
		return true
	}

	return *currentPublicID != *nextPublicID
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

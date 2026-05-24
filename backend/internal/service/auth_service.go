package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/cloudinary"
	"sobat-pintar/pkg/jwt"
	"sobat-pintar/pkg/logger"
	"sobat-pintar/pkg/mailer"
)

type AuthService interface {
	Register(ctx context.Context, name, email, password, level string) (*model.User, bool, error)
	Login(ctx context.Context, email, password string) (string, string, *model.User, error)
	GoogleLogin(ctx context.Context, idToken string) (string, string, *model.User, error)
	VerifyEmail(ctx context.Context, token string) (*model.User, error)
	ResendVerificationEmail(ctx context.Context, email string) (bool, error)
	GetProfile(ctx context.Context, userID string) (*model.User, error)
	UpdateProfile(ctx context.Context, userID, name, level string, avatarURL, avatarPublicID *string) (*model.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
}

var (
	ErrEmailAlreadyRegistered   = errors.New("email already registered")
	ErrEmailNotVerified         = errors.New("email not verified")
	ErrVerificationTokenInvalid = errors.New("verification token invalid")
	ErrVerificationTokenExpired = errors.New("verification token expired")
)

const verificationResendCooldown = time.Minute

type authService struct {
	repo            repository.UserRepository
	jwtService      *jwt.JWTService
	googleClientID  string
	cloudinary      *cloudinary.Client
	emailSender     mailer.Sender
	appBaseURL      string
	verificationTTL time.Duration
}

func NewAuthService(
	repo repository.UserRepository,
	jwtService *jwt.JWTService,
	googleClientID string,
	cloudinaryClient *cloudinary.Client,
	emailSender mailer.Sender,
	appBaseURL string,
	verificationTTL time.Duration,
) AuthService {
	return &authService{
		repo:            repo,
		jwtService:      jwtService,
		googleClientID:  googleClientID,
		cloudinary:      cloudinaryClient,
		emailSender:     emailSender,
		appBaseURL:      strings.TrimRight(appBaseURL, "/"),
		verificationTTL: verificationTTL,
	}
}

func (s *authService) Register(ctx context.Context, name, email, password, level string) (*model.User, bool, error) {
	// Check if user already exists
	normalizedEmail := normalizeEmail(email)
	existing, err := s.repo.GetByEmail(ctx, normalizedEmail)
	if err != nil && !isNoRowsError(err) {
		return nil, false, err
	}
	if existing != nil {
		return nil, false, ErrEmailAlreadyRegistered
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, false, err
	}

	verificationToken, verificationTokenHash, verificationExpiresAt, err := s.buildVerificationToken()
	if err != nil {
		return nil, false, err
	}

	hashedPasswordStr := string(hashedPassword)
	user := &model.User{
		ID:                         uuid.New().String(),
		Name:                       name,
		Email:                      normalizedEmail,
		PasswordHash:               &hashedPasswordStr,
		Level:                      level,
		EmailVerified:              false,
		EmailVerificationTokenHash: &verificationTokenHash,
		EmailVerificationExpiresAt: &verificationExpiresAt,
		LastActivityAt:             time.Now(),
		CreatedAt:                  time.Now(),
	}

	err = s.repo.Create(ctx, user)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, false, ErrEmailAlreadyRegistered
		}
		return nil, false, err
	}

	sent := s.sendVerificationEmail(ctx, user, verificationToken)
	return user, sent, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (string, string, *model.User, error) {
	user, err := s.repo.GetByEmail(ctx, normalizeEmail(email))
	if err != nil {
		if isNoRowsError(err) {
			return "", "", nil, errors.New("invalid email or password")
		}
		return "", "", nil, err
	}

	if user.PasswordHash == nil {
		return "", "", nil, errors.New("this account uses Google Login. Please sign in with Google")
	}
	if !user.EmailVerified {
		return "", "", nil, ErrEmailNotVerified
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

	email, name, err := googleProfileFromClaims(payload.Claims, payload.Subject)
	if err != nil {
		return "", "", nil, err
	}
	googleID := strings.TrimSpace(payload.Subject)

	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil && !isNoRowsError(err) {
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
			EmailVerified:  true,
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
		}
		if !user.EmailVerified {
			user.EmailVerified = true
			if err := s.repo.UpdateEmailVerification(ctx, user.ID, true, nil, nil); err != nil {
				return "", "", nil, err
			}
		}
		if err := s.repo.Update(ctx, user); err != nil {
			return "", "", nil, err
		}
	}

	accessToken, refreshToken, err := s.jwtService.GenerateToken(user.ID, user.Level)
	if err != nil {
		return "", "", nil, err
	}

	s.updateStreak(ctx, user)

	return accessToken, refreshToken, user, nil
}

func (s *authService) VerifyEmail(ctx context.Context, token string) (*model.User, error) {
	normalizedToken := strings.TrimSpace(token)
	if normalizedToken == "" {
		return nil, ErrVerificationTokenInvalid
	}

	tokenHash := hashVerificationToken(normalizedToken)
	user, err := s.repo.GetByVerificationTokenHash(ctx, tokenHash)
	if err != nil {
		if isNoRowsError(err) {
			return nil, ErrVerificationTokenInvalid
		}
		return nil, err
	}

	if user.EmailVerificationExpiresAt != nil && time.Now().After(*user.EmailVerificationExpiresAt) {
		return nil, ErrVerificationTokenExpired
	}

	now := time.Now()
	if err := s.repo.UpdateEmailVerification(ctx, user.ID, true, nil, nil); err != nil {
		return nil, err
	}

	user.EmailVerified = true
	user.EmailVerificationTokenHash = nil
	user.EmailVerificationExpiresAt = nil
	user.LastActivityAt = now
	if err := s.repo.Update(ctx, user); err != nil {
		logger.Error(err, "Failed to refresh user after email verification", "user_id", user.ID)
	}

	return user, nil
}

func (s *authService) ResendVerificationEmail(ctx context.Context, email string) (bool, error) {
	normalizedEmail := normalizeEmail(email)
	logger.Info("Resend verification email requested", "email", normalizedEmail)

	user, err := s.repo.GetByEmail(ctx, normalizedEmail)
	if err != nil {
		if isNoRowsError(err) {
			logger.Info("Resend verification skipped because email was not found", "email", normalizedEmail)
			return false, nil
		}
		return false, err
	}

	if user.EmailVerified {
		logger.Info("Resend verification skipped because user is already verified", "user_id", user.ID, "email", user.Email)
		return false, nil
	}

	if s.verificationWasRecentlySent(user, time.Now()) {
		logger.Info("Resend verification skipped because request is within cooldown", "user_id", user.ID, "email", user.Email)
		return false, nil
	}

	verificationToken, verificationTokenHash, verificationExpiresAt, err := s.buildVerificationToken()
	if err != nil {
		return false, err
	}

	if err := s.repo.UpdateEmailVerification(ctx, user.ID, false, &verificationTokenHash, &verificationExpiresAt); err != nil {
		return false, err
	}

	user.EmailVerificationTokenHash = &verificationTokenHash
	user.EmailVerificationExpiresAt = &verificationExpiresAt

	sent := s.sendVerificationEmail(ctx, user, verificationToken)
	logger.Info("Resend verification email finished", "user_id", user.ID, "email", user.Email, "sent", sent)
	return sent, nil
}

func (s *authService) verificationWasRecentlySent(user *model.User, now time.Time) bool {
	if user.EmailVerificationExpiresAt == nil || s.verificationTTL <= 0 {
		return false
	}

	sentAt := user.EmailVerificationExpiresAt.Add(-s.verificationTTL)
	return now.Before(sentAt.Add(verificationResendCooldown))
}

func isNoRowsError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "no rows")
}

func isUniqueViolation(err error) bool {
	var postgresError *pgconn.PgError
	return errors.As(err, &postgresError) && postgresError.Code == "23505"
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func googleProfileFromClaims(claims map[string]interface{}, subject string) (string, string, error) {
	email, ok := claims["email"].(string)
	email = normalizeEmail(email)
	if !ok || email == "" || strings.TrimSpace(subject) == "" {
		return "", "", errors.New("invalid google token profile")
	}

	emailVerified, ok := claims["email_verified"].(bool)
	if !ok || !emailVerified {
		return "", "", errors.New("google email is not verified")
	}

	name, _ := claims["name"].(string)
	name = strings.TrimSpace(name)
	if name == "" {
		name = strings.TrimSpace(strings.Split(email, "@")[0])
	}
	if name == "" {
		name = "Siswa Sobat Pintar"
	}

	return email, name, nil
}

func (s *authService) buildVerificationToken() (string, string, time.Time, error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", "", time.Time{}, err
	}

	token := base64.RawURLEncoding.EncodeToString(tokenBytes)
	tokenHash := hashVerificationToken(token)
	expiresAt := time.Now().Add(s.verificationTTL)

	return token, tokenHash, expiresAt, nil
}

func hashVerificationToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *authService) sendVerificationEmail(ctx context.Context, user *model.User, token string) bool {
	if s.emailSender == nil {
		logger.Error(fmt.Errorf("email sender is not configured"), "Failed to send verification email", "user_id", user.ID, "email", user.Email)
		return false
	}

	link := s.buildVerificationLink(token, user.Email)
	if err := s.emailSender.SendVerificationEmail(ctx, user.Email, user.Name, link); err != nil {
		logger.Error(err, "Failed to send verification email", "user_id", user.ID, "email", user.Email)
		return false
	}

	return true
}

func (s *authService) buildVerificationLink(token, email string) string {
	baseURL := strings.TrimRight(s.appBaseURL, "/")
	if baseURL == "" {
		baseURL = "http://localhost:3000"
	}

	return fmt.Sprintf("%s/verify-email?token=%s&email=%s", baseURL, url.QueryEscape(token), url.QueryEscape(normalizeEmail(email)))
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
	} else if daysDiff > 1 {
		user.Streak = 1
		user.LastActivityAt = now
	} else if daysDiff == 0 && user.Streak == 0 {
		user.Streak = 1
		user.LastActivityAt = now
	} else {
		user.LastActivityAt = now
	}

	if err := s.repo.Update(ctx, user); err != nil {
		logger.Error(err, "Failed to update login streak", "user_id", user.ID)
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

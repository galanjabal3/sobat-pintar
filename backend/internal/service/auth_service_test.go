package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
	"sobat-pintar/internal/model"
	"sobat-pintar/pkg/jwt"
)

type fakeAuthRepo struct {
	byEmail map[string]*model.User
	byID    map[string]*model.User

	createErr                       error
	createCalled                    bool
	updateCalled                    bool
	updateEmailVerificationCalled   bool
	updateProfileCalled             bool
	lastUpdatedUser                 *model.User
	lastVerificationUserID          string
	lastVerificationEmailVerified   bool
	lastVerificationTokenHash       *string
	lastVerificationTokenExpiresAt  *time.Time
	lastProfileUpdateID             string
	lastProfileUpdateName           string
	lastProfileUpdateLevel          string
	lastProfileUpdateAvatarURL      *string
	lastProfileUpdateAvatarPublicID *string
}

type fakeEmailSender struct {
	sent      bool
	sendCount int
}

func newFakeAuthRepo(users ...*model.User) *fakeAuthRepo {
	repo := &fakeAuthRepo{
		byEmail: make(map[string]*model.User),
		byID:    make(map[string]*model.User),
	}

	for _, user := range users {
		repo.byEmail[normalizeEmail(user.Email)] = user
		repo.byID[user.ID] = user
	}

	return repo
}

func (r *fakeAuthRepo) Create(ctx context.Context, user *model.User) error {
	r.createCalled = true
	if r.createErr != nil {
		return r.createErr
	}
	r.byEmail[normalizeEmail(user.Email)] = user
	r.byID[user.ID] = user
	return nil
}

func (r *fakeAuthRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	user, ok := r.byEmail[normalizeEmail(email)]
	if !ok {
		return nil, errors.New("no rows in result set")
	}
	return user, nil
}

func (r *fakeAuthRepo) GetByID(ctx context.Context, id string) (*model.User, error) {
	user, ok := r.byID[id]
	if !ok {
		return nil, errors.New("no rows in result set")
	}
	return user, nil
}

func (r *fakeAuthRepo) GetByVerificationTokenHash(ctx context.Context, tokenHash string) (*model.User, error) {
	for _, user := range r.byID {
		if user.EmailVerificationTokenHash != nil && *user.EmailVerificationTokenHash == tokenHash {
			return user, nil
		}
	}
	return nil, errors.New("no rows in result set")
}

func (r *fakeAuthRepo) Update(ctx context.Context, user *model.User) error {
	r.updateCalled = true
	r.lastUpdatedUser = user
	r.byID[user.ID] = user
	r.byEmail[normalizeEmail(user.Email)] = user
	return nil
}

func (r *fakeAuthRepo) UpdateProfile(ctx context.Context, userID, name, level string, avatarURL, avatarPublicID *string) error {
	r.updateProfileCalled = true
	r.lastProfileUpdateID = userID
	r.lastProfileUpdateName = name
	r.lastProfileUpdateLevel = level
	r.lastProfileUpdateAvatarURL = avatarURL
	r.lastProfileUpdateAvatarPublicID = avatarPublicID

	user, ok := r.byID[userID]
	if !ok {
		return errors.New("user not found")
	}

	user.Name = name
	user.Level = level
	user.AvatarURL = avatarURL
	user.AvatarPublicID = avatarPublicID
	return nil
}

func (r *fakeAuthRepo) UpdateEmailVerification(ctx context.Context, userID string, emailVerified bool, tokenHash *string, tokenExpiresAt *time.Time) error {
	r.updateEmailVerificationCalled = true
	r.lastVerificationUserID = userID
	r.lastVerificationEmailVerified = emailVerified
	r.lastVerificationTokenHash = tokenHash
	r.lastVerificationTokenExpiresAt = tokenExpiresAt

	user, ok := r.byID[userID]
	if !ok {
		return errors.New("user not found")
	}

	user.EmailVerified = emailVerified
	user.EmailVerificationTokenHash = tokenHash
	user.EmailVerificationExpiresAt = tokenExpiresAt
	return nil
}

func (s *fakeEmailSender) SendVerificationEmail(ctx context.Context, to, name, verifyURL string) error {
	s.sent = true
	s.sendCount++
	return nil
}

func TestAuthRegisterRejectsDuplicateEmail(t *testing.T) {
	repo := newFakeAuthRepo(&model.User{
		ID:    "user-1",
		Name:  "Existing User",
		Email: "existing@example.com",
	})

	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, &fakeEmailSender{}, "http://localhost:3000", 24*time.Hour)

	_, _, err := service.Register(context.Background(), "User Baru", " Existing@Example.com ", "password123", "SD")
	if err == nil {
		t.Fatal("expected duplicate email error")
	}

	if !errors.Is(err, ErrEmailAlreadyRegistered) {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.createCalled {
		t.Fatal("expected duplicate email to skip create")
	}
}

func TestAuthRegisterStoresUnverifiedUserAndSendsVerificationEmail(t *testing.T) {
	repo := newFakeAuthRepo()
	emailSender := &fakeEmailSender{}
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, emailSender, "http://localhost:3000", 24*time.Hour)

	user, sent, err := service.Register(context.Background(), "Siswa Baru", " Baru@Example.com ", "password123", "SD")
	if err != nil {
		t.Fatalf("Register returned error: %v", err)
	}
	if user == nil {
		t.Fatal("expected user to be returned")
	}
	if !sent {
		t.Fatal("expected verification email to be sent")
	}
	if !repo.createCalled {
		t.Fatal("expected user to be created")
	}
	if !emailSender.sent {
		t.Fatal("expected verification email sender to be called")
	}
	stored := repo.byEmail["baru@example.com"]
	if stored == nil {
		t.Fatal("expected stored user to exist")
	}
	if user.Email != "baru@example.com" {
		t.Fatalf("expected normalized email, got %q", user.Email)
	}
	if stored.EmailVerified {
		t.Fatal("expected new user to remain unverified")
	}
	if stored.EmailVerificationTokenHash == nil {
		t.Fatal("expected verification token hash to be stored")
	}
}

func TestAuthRegisterMapsUniqueInsertFailureToDuplicateEmail(t *testing.T) {
	repo := newFakeAuthRepo()
	repo.createErr = &pgconn.PgError{Code: "23505"}
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, &fakeEmailSender{}, "http://localhost:3000", 24*time.Hour)

	_, _, err := service.Register(context.Background(), "Siswa", "siswa@example.com", "password123", "SD")
	if !errors.Is(err, ErrEmailAlreadyRegistered) {
		t.Fatalf("expected duplicate email error, got %v", err)
	}
}

func TestAuthLoginIncrementsStreakAndReturnsTokens(t *testing.T) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	lastActivity := time.Now().AddDate(0, 0, -1)
	user := &model.User{
		ID:             "user-1",
		Name:           "Siswa",
		Email:          "siswa@example.com",
		PasswordHash:   ptrString(string(hashedPassword)),
		Level:          "SMP",
		EmailVerified:  true,
		Points:         120,
		Streak:         2,
		LastActivityAt: lastActivity,
		CreatedAt:      time.Now().AddDate(0, 0, -7),
	}
	repo := newFakeAuthRepo(user)
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, &fakeEmailSender{}, "http://localhost:3000", 24*time.Hour)

	accessToken, refreshToken, loggedInUser, err := service.Login(context.Background(), " SISWA@Example.com ", "password123")
	if err != nil {
		t.Fatalf("Login returned error: %v", err)
	}

	if accessToken == "" || refreshToken == "" {
		t.Fatal("expected access and refresh tokens to be returned")
	}
	if loggedInUser == nil {
		t.Fatal("expected logged in user")
	}
	if !repo.updateCalled {
		t.Fatal("expected streak update to persist user")
	}
	if repo.lastUpdatedUser == nil {
		t.Fatal("expected last updated user to be captured")
	}
	if repo.lastUpdatedUser.Streak != 3 {
		t.Fatalf("expected streak to increase to 3, got %d", repo.lastUpdatedUser.Streak)
	}
	if !repo.lastUpdatedUser.LastActivityAt.After(lastActivity) {
		t.Fatal("expected last activity to be refreshed")
	}
	if loggedInUser.Streak != 3 {
		t.Fatalf("expected returned user streak to be 3, got %d", loggedInUser.Streak)
	}
}

func TestAuthLoginRejectsUnverifiedEmail(t *testing.T) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	user := &model.User{
		ID:            "user-2",
		Name:          "Siswa Baru",
		Email:         "baru@example.com",
		PasswordHash:  ptrString(string(hashedPassword)),
		Level:         "SD",
		EmailVerified: false,
		CreatedAt:     time.Now().AddDate(0, 0, -7),
	}
	repo := newFakeAuthRepo(user)
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, &fakeEmailSender{}, "http://localhost:3000", 24*time.Hour)

	_, _, _, err = service.Login(context.Background(), "baru@example.com", "password123")
	if err == nil {
		t.Fatal("expected email not verified error")
	}
	if !errors.Is(err, ErrEmailNotVerified) {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestAuthVerifyEmailMarksUserVerified(t *testing.T) {
	token := "verify-token"
	tokenHash := hashVerificationToken(token)
	expiresAt := time.Now().Add(24 * time.Hour)

	user := &model.User{
		ID:                         "user-3",
		Name:                       "Siswa",
		Email:                      "siswa@example.com",
		Level:                      "SMP",
		EmailVerified:              false,
		EmailVerificationTokenHash: &tokenHash,
		EmailVerificationExpiresAt: &expiresAt,
		CreatedAt:                  time.Now().AddDate(0, 0, -7),
	}
	repo := newFakeAuthRepo(user)
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, &fakeEmailSender{}, "http://localhost:3000", 24*time.Hour)

	verifiedUser, err := service.VerifyEmail(context.Background(), token)
	if err != nil {
		t.Fatalf("VerifyEmail returned error: %v", err)
	}
	if verifiedUser == nil {
		t.Fatal("expected verified user")
	}
	if !verifiedUser.EmailVerified {
		t.Fatal("expected user to be marked verified")
	}
	if !repo.updateEmailVerificationCalled {
		t.Fatal("expected verification update to reach repository")
	}
}

func TestAuthResendVerificationNormalizesEmail(t *testing.T) {
	user := &model.User{
		ID:            "user-4",
		Name:          "Siswa",
		Email:         "siswa@example.com",
		Level:         "SD",
		EmailVerified: false,
	}
	repo := newFakeAuthRepo(user)
	emailSender := &fakeEmailSender{}
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, emailSender, "http://localhost:3000", 24*time.Hour)

	sent, err := service.ResendVerificationEmail(context.Background(), " SISWA@Example.com ")
	if err != nil {
		t.Fatalf("ResendVerificationEmail returned error: %v", err)
	}
	if !sent || !emailSender.sent {
		t.Fatal("expected resend email to be sent")
	}
	if !repo.updateEmailVerificationCalled {
		t.Fatal("expected token update before resend")
	}
}

func TestAuthResendVerificationSkipsRequestWithinCooldown(t *testing.T) {
	tokenHash := "existing-token-hash"
	expiresAt := time.Now().Add(24 * time.Hour)
	user := &model.User{
		ID:                         "user-5",
		Name:                       "Siswa",
		Email:                      "siswa@example.com",
		Level:                      "SD",
		EmailVerified:              false,
		EmailVerificationTokenHash: &tokenHash,
		EmailVerificationExpiresAt: &expiresAt,
	}
	repo := newFakeAuthRepo(user)
	emailSender := &fakeEmailSender{}
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, emailSender, "http://localhost:3000", 24*time.Hour)

	sent, err := service.ResendVerificationEmail(context.Background(), "siswa@example.com")
	if err != nil {
		t.Fatalf("ResendVerificationEmail returned error: %v", err)
	}
	if sent || emailSender.sendCount != 0 {
		t.Fatal("expected recent verification email to prevent another send")
	}
	if repo.updateEmailVerificationCalled {
		t.Fatal("expected cooldown request to keep existing token unchanged")
	}
}

func TestAuthUpdateProfileUpdatesStoredUser(t *testing.T) {
	currentAvatarURL := "https://example.com/avatar-old.png"
	currentAvatarPublicID := "avatar-old"
	nextAvatarURL := "https://example.com/avatar-new.png"
	nextAvatarPublicID := "avatar-new"

	user := &model.User{
		ID:             "user-1",
		Name:           "Nama Lama",
		Email:          "user@example.com",
		Level:          "SD",
		AvatarURL:      &currentAvatarURL,
		AvatarPublicID: &currentAvatarPublicID,
		CreatedAt:      time.Now().AddDate(0, 0, -7),
	}

	repo := newFakeAuthRepo(user)
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil, &fakeEmailSender{}, "http://localhost:3000", 24*time.Hour)

	updatedUser, err := service.UpdateProfile(
		context.Background(),
		"user-1",
		"Nama Baru",
		"SMP",
		&nextAvatarURL,
		&nextAvatarPublicID,
	)
	if err != nil {
		t.Fatalf("UpdateProfile returned error: %v", err)
	}

	if !repo.updateProfileCalled {
		t.Fatal("expected profile update to reach repository")
	}
	if repo.lastProfileUpdateID != "user-1" {
		t.Fatalf("unexpected profile update id: %s", repo.lastProfileUpdateID)
	}
	if repo.lastProfileUpdateName != "Nama Baru" {
		t.Fatalf("unexpected updated name: %s", repo.lastProfileUpdateName)
	}
	if repo.lastProfileUpdateLevel != "SMP" {
		t.Fatalf("unexpected updated level: %s", repo.lastProfileUpdateLevel)
	}
	if repo.lastProfileUpdateAvatarURL == nil || *repo.lastProfileUpdateAvatarURL != nextAvatarURL {
		t.Fatalf("unexpected updated avatar url: %v", repo.lastProfileUpdateAvatarURL)
	}
	if repo.lastProfileUpdateAvatarPublicID == nil || *repo.lastProfileUpdateAvatarPublicID != nextAvatarPublicID {
		t.Fatalf("unexpected updated avatar public id: %v", repo.lastProfileUpdateAvatarPublicID)
	}
	if updatedUser.Name != "Nama Baru" || updatedUser.Level != "SMP" {
		t.Fatalf("unexpected returned user: %+v", updatedUser)
	}
	if updatedUser.AvatarURL == nil || *updatedUser.AvatarURL != nextAvatarURL {
		t.Fatalf("unexpected returned avatar url: %v", updatedUser.AvatarURL)
	}
}

func TestGoogleProfileFromClaimsRejectsMissingRequiredClaims(t *testing.T) {
	tests := []struct {
		name    string
		claims  map[string]interface{}
		subject string
	}{
		{name: "missing email", claims: map[string]interface{}{"name": "Siswa"}, subject: "google-1"},
		{name: "invalid email type", claims: map[string]interface{}{"email": true}, subject: "google-1"},
		{name: "missing subject", claims: map[string]interface{}{"email": "siswa@example.com", "email_verified": true}, subject: ""},
		{name: "missing verified claim", claims: map[string]interface{}{"email": "siswa@example.com"}, subject: "google-1"},
		{name: "email is not verified", claims: map[string]interface{}{"email": "siswa@example.com", "email_verified": false}, subject: "google-1"},
		{name: "invalid verified type", claims: map[string]interface{}{"email": "siswa@example.com", "email_verified": "true"}, subject: "google-1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := googleProfileFromClaims(tt.claims, tt.subject)
			if err == nil {
				t.Fatal("expected invalid Google token profile error")
			}
		})
	}
}

func TestGoogleProfileFromClaimsUsesEmailPrefixAsNameFallback(t *testing.T) {
	email, name, err := googleProfileFromClaims(
		map[string]interface{}{"email": " SISWA.PINTAR@Example.com ", "email_verified": true},
		"google-1",
	)
	if err != nil {
		t.Fatalf("googleProfileFromClaims returned error: %v", err)
	}
	if email != "siswa.pintar@example.com" {
		t.Fatalf("unexpected email: %s", email)
	}
	if name != "siswa.pintar" {
		t.Fatalf("unexpected fallback name: %s", name)
	}
}

func TestNormalizeEmail(t *testing.T) {
	if got := normalizeEmail(" Siswa@Example.com "); got != "siswa@example.com" {
		t.Fatalf("unexpected normalized email: %q", got)
	}
	if strings.Contains(normalizeEmail("SISWA@EXAMPLE.COM"), "SISWA") {
		t.Fatal("expected normalized email to be lowercase")
	}
}

func TestShouldDeleteAvatar(t *testing.T) {
	tests := []struct {
		name     string
		current  *string
		next     *string
		expected bool
	}{
		{
			name:     "no current avatar",
			current:  nil,
			next:     nil,
			expected: false,
		},
		{
			name:     "same avatar id",
			current:  ptrString("avatar-1"),
			next:     ptrString("avatar-1"),
			expected: false,
		},
		{
			name:     "avatar removed",
			current:  ptrString("avatar-1"),
			next:     nil,
			expected: true,
		},
		{
			name:     "avatar changed",
			current:  ptrString("avatar-1"),
			next:     ptrString("avatar-2"),
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := shouldDeleteAvatar(tt.current, tt.next)
			if got != tt.expected {
				t.Fatalf("expected %v, got %v", tt.expected, got)
			}
		})
	}
}

func ptrString(value string) *string {
	return &value
}

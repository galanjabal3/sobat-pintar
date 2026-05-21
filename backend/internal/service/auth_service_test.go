package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
	"sobat-pintar/internal/model"
	"sobat-pintar/pkg/jwt"
)

type fakeAuthRepo struct {
	byEmail map[string]*model.User
	byID    map[string]*model.User

	createCalled                    bool
	updateCalled                    bool
	updateProfileCalled             bool
	lastUpdatedUser                 *model.User
	lastProfileUpdateID             string
	lastProfileUpdateName           string
	lastProfileUpdateLevel          string
	lastProfileUpdateAvatarURL      *string
	lastProfileUpdateAvatarPublicID *string
}

func newFakeAuthRepo(users ...*model.User) *fakeAuthRepo {
	repo := &fakeAuthRepo{
		byEmail: make(map[string]*model.User),
		byID:    make(map[string]*model.User),
	}

	for _, user := range users {
		repo.byEmail[user.Email] = user
		repo.byID[user.ID] = user
	}

	return repo
}

func (r *fakeAuthRepo) Create(ctx context.Context, user *model.User) error {
	r.createCalled = true
	r.byEmail[user.Email] = user
	r.byID[user.ID] = user
	return nil
}

func (r *fakeAuthRepo) GetByEmail(ctx context.Context, email string) (*model.User, error) {
	user, ok := r.byEmail[email]
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

func (r *fakeAuthRepo) Update(ctx context.Context, user *model.User) error {
	r.updateCalled = true
	r.lastUpdatedUser = user
	r.byID[user.ID] = user
	r.byEmail[user.Email] = user
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

func TestAuthRegisterRejectsDuplicateEmail(t *testing.T) {
	repo := newFakeAuthRepo(&model.User{
		ID:    "user-1",
		Name:  "Existing User",
		Email: "existing@example.com",
	})

	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil)

	_, err := service.Register(context.Background(), "User Baru", "existing@example.com", "password123", "SD")
	if err == nil {
		t.Fatal("expected duplicate email error")
	}

	if err.Error() != "email already registered" {
		t.Fatalf("unexpected error: %v", err)
	}

	if repo.createCalled {
		t.Fatal("expected duplicate email to skip create")
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
		Points:         120,
		Streak:         2,
		LastActivityAt: lastActivity,
		CreatedAt:      time.Now().AddDate(0, 0, -7),
	}
	repo := newFakeAuthRepo(user)
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil)

	accessToken, refreshToken, loggedInUser, err := service.Login(context.Background(), "siswa@example.com", "password123")
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
	service := NewAuthService(repo, jwt.NewJWTService("secret", time.Hour, time.Hour), "", nil)

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

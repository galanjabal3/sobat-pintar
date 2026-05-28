package dto

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Level    string `json:"level" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User UserResponse `json:"user"`
}

type RegisterResponse struct {
	User               UserResponse `json:"user"`
	VerificationSent   bool         `json:"verification_sent"`
	VerificationNeeded bool         `json:"verification_needed"`
}

type UserResponse struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	Email         string  `json:"email"`
	Level         string  `json:"level"`
	EmailVerified bool    `json:"email_verified"`
	AvatarURL     *string `json:"avatar_url"`
	// Keep this field available for profile update bookkeeping. UI does not need to display it.
	AvatarPublicID *string `json:"avatar_public_id,omitempty"`
	Points         int     `json:"points"`
	Streak         int     `json:"streak"`
}

type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required"`
}

type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type UpdateProfileRequest struct {
	Name           string  `json:"name" binding:"required,min=2"`
	Level          string  `json:"level" binding:"required,oneof=TK SD SMP SMA"`
	AvatarURL      *string `json:"avatar_url"`
	AvatarPublicID *string `json:"avatar_public_id"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type RefreshResponse struct {
	Refreshed bool `json:"refreshed"`
}

type GoogleLoginRequest struct {
	AuthorizationCode string `json:"authorization_code"`
	RedirectURI       string `json:"redirect_uri"`
	IDToken           string `json:"id_token"`
}

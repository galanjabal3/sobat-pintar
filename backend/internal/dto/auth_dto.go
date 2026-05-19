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
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	Level     string  `json:"level"`
	AvatarURL *string `json:"avatar_url"`
	// Keep this field available for profile update bookkeeping. UI does not need to display it.
	AvatarPublicID *string `json:"avatar_public_id,omitempty"`
	Points         int     `json:"points"`
	Streak         int     `json:"streak"`
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
	AccessToken string `json:"access_token"`
}

type GoogleLoginRequest struct {
	IDToken string `json:"id_token" binding:"required"`
}

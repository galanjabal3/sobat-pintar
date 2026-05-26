package jwt

import (
	"testing"
	"time"
)

func TestTokenTypesCannotBeInterchanged(t *testing.T) {
	service := NewJWTService("secret", time.Hour, 24*time.Hour)
	accessToken, refreshToken, err := service.GenerateToken("user-1", "SD")
	if err != nil {
		t.Fatalf("unexpected token generation error: %v", err)
	}

	if _, err := service.ValidateToken(accessToken); err != nil {
		t.Fatalf("expected access token validation to pass: %v", err)
	}
	if _, err := service.ValidateRefreshToken(refreshToken); err != nil {
		t.Fatalf("expected refresh token validation to pass: %v", err)
	}
	if _, err := service.ValidateRefreshToken(accessToken); err == nil {
		t.Fatal("expected access token to be rejected for refresh")
	}
	if _, err := service.ValidateToken(refreshToken); err == nil {
		t.Fatal("expected refresh token to be rejected for API access")
	}
}

package jwt

import "github.com/golang-jwt/jwt/v5"

type Claims struct {
	UserID string `json:"user_id"`
	Level  string `json:"level"`
	jwt.RegisteredClaims
}

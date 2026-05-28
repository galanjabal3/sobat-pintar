package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/pkg/jwt"
)

func AuthMiddleware(jwtService *jwt.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := ""
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				c.JSON(http.StatusUnauthorized, dto.FailureResponse("Sesi tidak valid", "Authorization header format must be Bearer {token}"))
				c.Abort()
				return
			}
			token = parts[1]
		}
		if token == "" {
			if cookieToken, err := c.Cookie("sobat_access_token"); err == nil {
				token = cookieToken
			}
		}
		if token == "" {
			c.JSON(http.StatusUnauthorized, dto.FailureResponse("Sesi tidak valid", "Access token is required"))
			c.Abort()
			return
		}

		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, dto.FailureResponse("Sesi telah berakhir, silakan login kembali", "Invalid or expired token"))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("level", claims.Level)
		c.Next()
	}
}

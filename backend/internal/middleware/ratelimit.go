package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RateLimit returns a gin.HandlerFunc for rate limiting
func RateLimit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: Implement rate limiting logic (e.g. using Redis)
		c.Next()
	}
}

// HandleRateLimitError handles rate limit errors
func HandleRateLimitError(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"success": false,
		"message": "Terlalu banyak permintaan. Silakan coba lagi nanti.",
	})
}

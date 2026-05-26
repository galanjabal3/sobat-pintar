package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
)

type rateLimitEntry struct {
	count     int
	expiresAt time.Time
}

// RateLimit limits requests per authenticated user, or per client IP for public routes.
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	var mu sync.Mutex
	entries := make(map[string]rateLimitEntry)
	lastCleanup := time.Now()

	return func(c *gin.Context) {
		now := time.Now()
		key := c.GetString("user_id")
		if key == "" {
			key = c.ClientIP()
		}

		mu.Lock()
		if now.Sub(lastCleanup) >= window {
			for itemKey, item := range entries {
				if !now.Before(item.expiresAt) {
					delete(entries, itemKey)
				}
			}
			lastCleanup = now
		}

		entry, found := entries[key]
		if !found || !now.Before(entry.expiresAt) {
			entry = rateLimitEntry{expiresAt: now.Add(window)}
		}
		entry.count++
		entries[key] = entry
		blocked := entry.count > limit
		mu.Unlock()

		if blocked {
			HandleRateLimitError(c)
			return
		}
		c.Next()
	}
}

// HandleRateLimitError handles rate limit errors
func HandleRateLimitError(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusTooManyRequests, dto.FailureResponse("Terlalu banyak permintaan. Silakan coba lagi nanti."))
}

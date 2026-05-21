package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/pkg/logger"
)

func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error(nil, "Recovered from panic", "error", err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, dto.FailureResponse("Terjadi kesalahan pada server"))
			}
		}()
		c.Next()
	}
}

package middleware

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"sobat-pintar/pkg/logger"
)

// Logger returns a gin.HandlerFunc for structured logging using zerolog
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		// Fill the log record
		latency := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method

		if raw != "" {
			path = path + "?" + raw
		}

		msg := fmt.Sprintf("HTTP Request method=%s path=%s status=%d latency=%.3fs", method, path, status, latency.Seconds())
		
		if status >= 500 {
			logger.Error(nil, msg)
		} else if status >= 400 {
			// Using a generic logger.Info because the requirement requested ✅ INF for status=404 in the example.
			// But standard practice is often WARN. Since the example specifically shows ✅ INF for status=404, keeping it as Info.
			logger.Info(msg)
		} else {
			logger.Info(msg)
		}
	}
}

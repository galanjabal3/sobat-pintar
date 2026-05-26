package router

import (
	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/handler"
	"sobat-pintar/internal/middleware"
	"sobat-pintar/internal/router/modules"
	"sobat-pintar/pkg/jwt"
)

func SetupRouter(
	aiHandler *handler.AIHandler,
	authHandler *handler.AuthHandler,
	explainHandler *handler.ExplainHandler,
	chatHandler *handler.ChatHandler,
	practiceHandler *handler.PracticeHandler,
	summaryHandler *handler.SummaryHandler,
	scheduleHandler *handler.ScheduleHandler,
	gamificationHandler *handler.GamificationHandler,
	healthHandler *handler.HealthHandler,
	jwtService *jwt.JWTService,
	uploadHandler *handler.UploadHandler,
	corsAllowedOrigins []string,
) *gin.Engine {
	r := gin.New()

	// Global Middlewares
	r.Use(middleware.CORS(corsAllowedOrigins))
	r.Use(middleware.Logger())
	r.Use(middleware.Recovery())

	api := r.Group("/api/v1")
	{
		// Health check
		api.GET("/health", healthHandler.HealthCheck)

		// Auth routes
		modules.RegisterAuthRoutes(api, authHandler)

		// Public routes
		modules.RegisterPublicRoutes(api, explainHandler, summaryHandler)

		// Protected routes
		modules.RegisterProtectedRoutes(api, jwtService, aiHandler, authHandler, explainHandler, chatHandler, practiceHandler, summaryHandler, scheduleHandler, gamificationHandler, uploadHandler)
	}

	return r
}

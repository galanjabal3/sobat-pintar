package modules

import (
	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/handler"
	"sobat-pintar/internal/middleware"
	"sobat-pintar/pkg/jwt"
)

func RegisterPublicRoutes(rg *gin.RouterGroup, explainH *handler.ExplainHandler, summaryH *handler.SummaryHandler) {
	public := rg.Group("/public")
	{
		public.GET("/explain/:id", explainH.GetPublicExplanation)
		public.GET("/summary/:id", summaryH.GetPublicSummary)
	}
}

func RegisterAuthRoutes(rg *gin.RouterGroup, h *handler.AuthHandler) {
	auth := rg.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/google", h.GoogleLogin)
		auth.POST("/refresh", h.Refresh)
	}
}

func RegisterProtectedRoutes(rg *gin.RouterGroup, jwtService *jwt.JWTService,
	authH *handler.AuthHandler,
	explainH *handler.ExplainHandler,
	chatH *handler.ChatHandler,
	practiceH *handler.PracticeHandler,
	summaryH *handler.SummaryHandler,
	scheduleH *handler.ScheduleHandler,
	gamificationH *handler.GamificationHandler,
	uploadH *handler.UploadHandler,
) {
	protected := rg.Group("/")
	protected.Use(middleware.AuthMiddleware(jwtService))
	{
		protected.GET("/user/profile", authH.GetProfile)

		// Upload routes
		if uploadH != nil {
			upload := protected.Group("/upload")
			{
				upload.POST("/profile", uploadH.UploadProfileImage)
				upload.POST("/posts", uploadH.UploadPostImage)
				upload.POST("/attachments", uploadH.UploadAttachment)
			}
		}

		// Explain routes
		explain := protected.Group("/explain")
		{
			explain.POST("", explainH.Explain)
			explain.GET("/history", explainH.GetHistory)
			explain.GET("/:id", explainH.GetExplanation)
			explain.POST("/:id/re-explain", explainH.ReExplain)
		}
		// Chat routes
		chat := protected.Group("/chat")
		{
			chat.POST("/sessions", chatH.CreateSession)
			chat.GET("/sessions", chatH.ListSessions)
			chat.GET("/sessions/:id", chatH.GetSession)
			chat.POST("/sessions/:id/messages", chatH.SendMessage)
			chat.DELETE("/sessions/:id", chatH.DeleteSession)
		}

		// Practice routes
		practice := protected.Group("/practice")
		{
			practice.POST("/start", practiceH.StartSession)
			practice.POST("/questions/:id/answer", practiceH.SubmitAnswer)
			practice.GET("/sessions/:id/result", practiceH.GetResult)
			practice.GET("/history", practiceH.GetHistory)
			practice.GET("/progress", practiceH.GetDailyProgress)
		}

		// Summary routes
		summary := protected.Group("/summary")
		{
			summary.POST("", summaryH.CreateSummary)
			summary.GET("/history", summaryH.GetHistory)
			summary.GET("/:id", summaryH.GetSummary)
			summary.DELETE("/:id", summaryH.DeleteSummary)
		}

		// Schedule routes
		schedule := protected.Group("/schedule")
		{
			schedule.POST("/generate", scheduleH.GenerateSchedule)
			schedule.GET("", scheduleH.GetSchedules)
		}

		// Gamification routes
		gamification := protected.Group("/gamification")
		{
			gamification.GET("/points", gamificationH.GetPoints)
			gamification.GET("/badges", gamificationH.GetBadges)
			gamification.GET("/leaderboard", gamificationH.GetLeaderboard)
		}
	}
}

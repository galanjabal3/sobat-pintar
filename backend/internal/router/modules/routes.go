package modules

import (
	"time"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/config"
	"sobat-pintar/internal/handler"
	"sobat-pintar/internal/middleware"
	"sobat-pintar/pkg/jwt"
)

func RegisterPublicRoutes(rg *gin.RouterGroup, explainH *handler.ExplainHandler, summaryH *handler.SummaryHandler, rateLimit config.RateLimitConfig) {
	public := rg.Group("/public")
	public.Use(middleware.RateLimit(rateLimit.PublicPerMinute, time.Minute))
	{
		public.GET("/explain/:token", explainH.GetPublicExplanation)
		public.GET("/summary/:token", summaryH.GetPublicSummary)
	}
}

func RegisterAuthRoutes(rg *gin.RouterGroup, h *handler.AuthHandler, rateLimit config.RateLimitConfig) {
	auth := rg.Group("/auth")
	auth.Use(middleware.RateLimit(rateLimit.AuthPerMinute, time.Minute))
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
		auth.POST("/google", h.GoogleLogin)
		auth.POST("/verify-email", h.VerifyEmail)
		auth.POST("/resend-verification", h.ResendVerificationEmail)
		auth.POST("/refresh", h.Refresh)
		auth.POST("/logout", h.Logout)
	}
}

func RegisterProtectedRoutes(rg *gin.RouterGroup, jwtService *jwt.JWTService,
	aiH *handler.AIHandler,
	authH *handler.AuthHandler,
	explainH *handler.ExplainHandler,
	chatH *handler.ChatHandler,
	practiceH *handler.PracticeHandler,
	summaryH *handler.SummaryHandler,
	scheduleH *handler.ScheduleHandler,
	gamificationH *handler.GamificationHandler,
	uploadH *handler.UploadHandler,
	rateLimit config.RateLimitConfig,
) {
	protected := rg.Group("/")
	protected.Use(middleware.AuthMiddleware(jwtService))
	{
		protected.GET("/user/profile", authH.GetProfile)
		protected.PATCH("/user/profile", authH.UpdateProfile)
		protected.GET("/ai/usage", aiH.GetUsage)

		// Upload routes
		if uploadH != nil {
			upload := protected.Group("/upload")
			upload.Use(middleware.RateLimit(rateLimit.UploadPerMinute, time.Minute))
			{
				upload.POST("/profile", uploadH.UploadProfileImage)
				upload.POST("/posts", uploadH.UploadPostImage)
				upload.POST("/attachments", uploadH.UploadAttachment)
			}
		}

		// Explain routes
		explain := protected.Group("/explain")
		{
			explain.POST("", middleware.RateLimit(rateLimit.AIWritePerMinute, time.Minute), explainH.Explain)
			explain.GET("/history", explainH.GetHistory)
			explain.GET("/:id", explainH.GetExplanation)
			explain.POST("/:id/re-explain", middleware.RateLimit(rateLimit.AIWritePerMinute, time.Minute), explainH.ReExplain)
			explain.POST("/:id/share", middleware.RateLimit(rateLimit.SharePerMinute, time.Minute), explainH.CreateShareLink)
		}
		// Chat routes
		chat := protected.Group("/chat")
		{
			chat.POST("/sessions", middleware.RateLimit(rateLimit.ChatPerMinute, time.Minute), chatH.CreateSession)
			chat.GET("/sessions", chatH.ListSessions)
			chat.GET("/sessions/:id", chatH.GetSession)
			chat.POST("/sessions/:id/messages", middleware.RateLimit(rateLimit.ChatPerMinute, time.Minute), chatH.SendMessage)
			chat.DELETE("/sessions/:id", chatH.DeleteSession)
		}

		// Practice routes
		practice := protected.Group("/practice")
		{
			practice.POST("/start", middleware.RateLimit(rateLimit.AIWritePerMinute, time.Minute), practiceH.StartSession)
			practice.POST("/questions/:id/answer", practiceH.SubmitAnswer)
			practice.GET("/sessions/:id", practiceH.GetSession)
			practice.POST("/sessions/:id/finish", practiceH.FinishSession)
			practice.GET("/sessions/:id/result", practiceH.GetResult)
			practice.GET("/history", practiceH.GetHistory)
			practice.GET("/progress", practiceH.GetDailyProgress)
		}

		// Summary routes
		summary := protected.Group("/summary")
		{
			summary.POST("", middleware.RateLimit(rateLimit.AIWritePerMinute, time.Minute), summaryH.CreateSummary)
			summary.GET("/history", summaryH.GetHistory)
			summary.GET("/:id", summaryH.GetSummary)
			summary.DELETE("/:id", summaryH.DeleteSummary)
			summary.POST("/:id/share", middleware.RateLimit(rateLimit.SharePerMinute, time.Minute), summaryH.CreateShareLink)
		}

		// Schedule routes
		schedule := protected.Group("/schedule")
		{
			schedule.POST("/generate", middleware.RateLimit(rateLimit.AIWritePerMinute, time.Minute), scheduleH.GenerateSchedule)
			schedule.GET("", scheduleH.GetSchedules)
			schedule.GET("/:id", scheduleH.GetSchedule)
			schedule.DELETE("/:id", scheduleH.DeleteSchedule)
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

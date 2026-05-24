package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/config"
	"sobat-pintar/internal/handler"
	"sobat-pintar/internal/repository"
	"sobat-pintar/internal/router"
	"sobat-pintar/internal/service"
	"sobat-pintar/pkg/cloudinary"
	"sobat-pintar/pkg/gemini"
	"sobat-pintar/pkg/jwt"
	"sobat-pintar/pkg/logger"
	"sobat-pintar/pkg/mailer"
)

func main() {
	// Set Gin to release mode to hide startup logs
	gin.SetMode(gin.ReleaseMode)

	// Load config
	cfg := config.LoadConfig()

	// Initialize logger
	logger.Init(cfg.AppEnv)

	// Connect to DB
	db := config.ConnectDB(cfg)
	defer db.Close()

	// Initialize services
	jwtService := jwt.NewJWTService(cfg.JWTSecret, cfg.JWTAccessTTL, cfg.JWTRefreshTTL)

	ctx := context.Background()
	geminiClient := gemini.NewClient(ctx, cfg.GeminiAPIKey, cfg.GeminiModel)
	defer geminiClient.Close()

	var err error
	emailSender, err := mailer.NewSender(cfg)
	if err != nil {
		logger.Fatal(err, "Failed to initialize email sender")
	}

	var cloudinaryClient *cloudinary.Client
	var uploadService *service.UploadService
	var uploadHandler *handler.UploadHandler

	cloudinaryClient, err = cloudinary.NewClient(cfg)
	if err != nil {
		logger.Info("Cloudinary client not initialized, upload features will be disabled.")
	} else {
		// Initialize ImageRepository
		imageRepo := repository.NewImageRepository(db)
		uploadService = service.NewUploadService(cfg, cloudinaryClient, imageRepo)
		uploadHandler = handler.NewUploadHandler(uploadService)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	explainRepo := repository.NewExplainRepository(db)
	chatRepo := repository.NewChatRepository(db)
	practiceRepo := repository.NewPracticeRepository(db)
	summaryRepo := repository.NewSummaryRepository(db)
	scheduleRepo := repository.NewScheduleRepository(db)
	gamificationRepo := repository.NewGamificationRepository(db)
	aiQuotaRepo := repository.NewAIQuotaRepository(db)

	// Initialize app services
	gamificationService := service.NewGamificationService(gamificationRepo)
	aiQuotaService := service.NewAIQuotaService(aiQuotaRepo)
	authService := service.NewAuthService(userRepo, jwtService, cfg.GoogleClientID, cloudinaryClient, emailSender, cfg.AppBaseURL, cfg.EmailVerificationTTL)
	explainService := service.NewExplainService(explainRepo, geminiClient, gamificationService, aiQuotaService)
	chatService := service.NewChatService(chatRepo, geminiClient, gamificationService, aiQuotaService)
	practiceService := service.NewPracticeService(practiceRepo, userRepo, geminiClient, gamificationService, aiQuotaService)
	summaryService := service.NewSummaryService(summaryRepo, geminiClient, gamificationService, aiQuotaService)
	scheduleService := service.NewScheduleService(scheduleRepo, geminiClient, aiQuotaService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	aiHandler := handler.NewAIHandler(aiQuotaService)
	explainHandler := handler.NewExplainHandler(explainService)
	chatHandler := handler.NewChatHandler(chatService)
	practiceHandler := handler.NewPracticeHandler(practiceService)
	summaryHandler := handler.NewSummaryHandler(summaryService)
	scheduleHandler := handler.NewScheduleHandler(scheduleService)
	gamificationHandler := handler.NewGamificationHandler(gamificationService)
	healthHandler := handler.NewHealthHandler()

	// Setup router
	r := router.SetupRouter(
		aiHandler,
		authHandler,
		explainHandler,
		chatHandler,
		practiceHandler,
		summaryHandler,
		scheduleHandler,
		gamificationHandler,
		healthHandler,
		jwtService,
		uploadHandler,
	)

	// Start server
	addr := "0.0.0.0:" + cfg.AppPort
	logger.Info("Starting server", "address", addr)

	go func() {
		if err := r.Run(addr); err != nil {
			logger.Fatal(err, "Failed to run server")
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")
}

package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"sobat-pintar/pkg/logger"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort            string
	AppEnv             string
	CORSAllowedOrigins []string
	RateLimit          RateLimitConfig
	AIQuota            AIQuotaConfig

	DatabaseURL string
	DBHost      string
	DBPort      string
	DBName      string
	DBUser      string
	DBPassword  string
	DBSSLMode   string

	RedisEnabled  bool
	RedisHost     string
	RedisPort     string
	RedisPassword string

	GeminiAPIKey string
	GeminiModel  string

	JWTSecret     string
	JWTAccessTTL  time.Duration
	JWTRefreshTTL time.Duration

	CloudinaryCloudName string
	CloudinaryAPIKey    string
	CloudinaryAPISecret string

	GoogleClientID     string
	GoogleClientSecret string

	AppBaseURL           string
	EmailFrom            string
	SMTPHost             string
	SMTPPort             string
	SMTPUsername         string
	SMTPPassword         string
	EmailVerificationTTL time.Duration
}

type RateLimitConfig struct {
	PublicPerMinute  int
	AuthPerMinute    int
	UploadPerMinute  int
	AIWritePerMinute int
	SharePerMinute   int
	ChatPerMinute    int
}

type AIQuotaConfig struct {
	ChatDaily     int
	ExplainDaily  int
	SummaryDaily  int
	PracticeDaily int
	ScheduleDaily int
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		logger.Info("No .env file found, using system environment variables")
	}

	cfg := &Config{
		AppPort: getEnv("APP_PORT", "8080"),
		AppEnv:  getEnv("APP_ENV", "development"),
		RateLimit: RateLimitConfig{
			PublicPerMinute:  getIntEnv("RATE_LIMIT_PUBLIC_PER_MINUTE", 60),
			AuthPerMinute:    getIntEnv("RATE_LIMIT_AUTH_PER_MINUTE", 10),
			UploadPerMinute:  getIntEnv("RATE_LIMIT_UPLOAD_PER_MINUTE", 10),
			AIWritePerMinute: getIntEnv("RATE_LIMIT_AI_WRITE_PER_MINUTE", 8),
			SharePerMinute:   getIntEnv("RATE_LIMIT_SHARE_PER_MINUTE", 10),
			ChatPerMinute:    getIntEnv("RATE_LIMIT_CHAT_PER_MINUTE", 10),
		},
		AIQuota: AIQuotaConfig{
			ChatDaily:     getIntEnv("AI_QUOTA_CHAT_DAILY", 5),
			ExplainDaily:  getIntEnv("AI_QUOTA_EXPLAIN_DAILY", 2),
			SummaryDaily:  getIntEnv("AI_QUOTA_SUMMARY_DAILY", 1),
			PracticeDaily: getIntEnv("AI_QUOTA_PRACTICE_DAILY", 2),
			ScheduleDaily: getIntEnv("AI_QUOTA_SCHEDULE_DAILY", 1),
		},

		DatabaseURL: getEnv("DATABASE_URL", ""),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBName:      getEnv("DB_NAME", "sobat_pintar"),
		DBUser:      getEnv("DB_USER", "postgres"),
		DBPassword:  getEnv("DB_PASSWORD", ""),
		DBSSLMode:   getEnv("DB_SSL_MODE", "disable"),

		RedisEnabled:  getBoolEnv("REDIS_ENABLED", false),
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		GeminiAPIKey: getEnv("GEMINI_API_KEY", ""),
		GeminiModel:  getEnv("GEMINI_MODEL", "gemini-2.5-flash"),

		JWTSecret:     getEnv("JWT_SECRET", ""),
		JWTAccessTTL:  getDurationEnv("JWT_ACCESS_TTL", 15*time.Minute),
		JWTRefreshTTL: getDurationEnv("JWT_REFRESH_TTL", 7*24*time.Hour),

		CloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME", ""),
		CloudinaryAPIKey:    getEnv("CLOUDINARY_API_KEY", ""),
		CloudinaryAPISecret: getEnv("CLOUDINARY_API_SECRET", ""),

		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),

		AppBaseURL:           getEnv("APP_BASE_URL", "http://localhost:3000"),
		EmailFrom:            getEnv("EMAIL_FROM", ""),
		SMTPHost:             getEnv("SMTP_HOST", ""),
		SMTPPort:             getEnv("SMTP_PORT", ""),
		SMTPUsername:         getEnv("SMTP_USERNAME", ""),
		SMTPPassword:         getEnv("SMTP_PASSWORD", ""),
		EmailVerificationTTL: getDurationEnv("EMAIL_VERIFICATION_TTL", 24*time.Hour),
	}
	cfg.CORSAllowedOrigins = getListEnv("CORS_ALLOWED_ORIGINS", []string{cfg.AppBaseURL})

	// Validate critical environment variables
	if cfg.GeminiAPIKey == "" {
		logger.Fatal(nil, "GEMINI_API_KEY is not set")
	}
	if cfg.JWTSecret == "" {
		logger.Fatal(nil, "JWT_SECRET is not set")
	}
	if cfg.DatabaseURL == "" {
		if cfg.DBName == "" {
			logger.Fatal(nil, "DB_NAME is not set")
		}
		if cfg.DBUser == "" {
			logger.Fatal(nil, "DB_USER is not set")
		}
		if cfg.DBPassword == "" {
			logger.Fatal(nil, "DB_PASSWORD is not set")
		}
	}
	if cfg.AppEnv == "production" {
		if cfg.GoogleClientID == "" || cfg.GoogleClientSecret == "" {
			logger.Fatal(nil, "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set")
		}
		if cfg.CloudinaryCloudName == "" {
			logger.Fatal(nil, "CLOUDINARY_CLOUD_NAME is not set")
		}
		if cfg.CloudinaryAPIKey == "" {
			logger.Fatal(nil, "CLOUDINARY_API_KEY is not set")
		}
		if cfg.CloudinaryAPISecret == "" {
			logger.Fatal(nil, "CLOUDINARY_API_SECRET is not set")
		}
	} else {
		if cfg.CloudinaryCloudName == "" || cfg.CloudinaryAPIKey == "" || cfg.CloudinaryAPISecret == "" {
			logger.Info("Cloudinary credentials not fully set, cloud image upload features will be disabled")
		}
	}

	if cfg.AppEnv == "production" {
		if cfg.SMTPHost == "" {
			logger.Fatal(nil, "SMTP_HOST is not set")
		}
		if cfg.SMTPPort == "" {
			logger.Fatal(nil, "SMTP_PORT is not set")
		}
		if cfg.EmailFrom == "" {
			logger.Fatal(nil, "EMAIL_FROM is not set")
		}
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	value := getEnv(key, "")
	if value == "" {
		return fallback
	}
	d, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return d
}

func getBoolEnv(key string, fallback bool) bool {
	value := getEnv(key, "")
	if value == "" {
		return fallback
	}
	b, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return b
}

func getIntEnv(key string, fallback int) int {
	value := getEnv(key, "")
	if value == "" {
		return fallback
	}
	i, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return i
}

func getListEnv(key string, fallback []string) []string {
	value := strings.TrimSpace(getEnv(key, ""))
	if value == "" {
		return fallback
	}

	var items []string
	for _, item := range strings.Split(value, ",") {
		item = strings.TrimSpace(item)
		if item != "" {
			items = append(items, item)
		}
	}
	if len(items) == 0 {
		return fallback
	}
	return items
}

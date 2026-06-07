package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

const confirmationText = "CLEAN_ALL_APP_DATA"

var userDataTables = []string{
	"ai_usage_quotas",
	"chat_messages",
	"explanations",
	"group_members",
	"group_notes",
	"images",
	"points_log",
	"practice_sessions",
	"questions",
	"reminders",
	"study_groups",
	"study_schedules",
	"summaries",
	"user_badges",
	"users",
}

func main() {
	var (
		confirm              string
		allowProduction      bool
		includeReferenceData bool
	)

	flag.StringVar(&confirm, "confirm", "", "required confirmation text")
	flag.BoolVar(&allowProduction, "allow-production", false, "allow cleaning when APP_ENV=production")
	flag.BoolVar(&includeReferenceData, "include-reference-data", false, "also remove seeded reference data such as badges")
	flag.Parse()

	_ = godotenv.Load()

	appEnv := strings.ToLower(strings.TrimSpace(envOrDefault("APP_ENV", "development")))
	if confirm != confirmationText {
		exitWithUsage("confirmation missing or invalid")
	}
	if appEnv == "production" && (!allowProduction || os.Getenv("ALLOW_PRODUCTION_DATABASE_CLEAN") != confirmationText) {
		exitWithUsage("production clean requires --allow-production and ALLOW_PRODUCTION_DATABASE_CLEAN=" + confirmationText)
	}

	dsn, err := databaseDSN()
	if err != nil {
		exitWithError(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	db, err := pgxpool.New(ctx, dsn)
	if err != nil {
		exitWithError(fmt.Errorf("connect database: %w", err))
	}
	defer db.Close()

	if err := db.Ping(ctx); err != nil {
		exitWithError(fmt.Errorf("ping database: %w", err))
	}

	tables := append([]string{}, userDataTables...)
	if includeReferenceData {
		tables = append(tables, "badges")
	}

	query := "TRUNCATE TABLE " + strings.Join(qualifiedTables(tables), ", ") + " RESTART IDENTITY CASCADE"
	tx, err := db.Begin(ctx)
	if err != nil {
		exitWithError(fmt.Errorf("begin clean transaction: %w", err))
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, query); err != nil {
		exitWithError(fmt.Errorf("clean database: %w", err))
	}
	if err := tx.Commit(ctx); err != nil {
		exitWithError(fmt.Errorf("commit clean transaction: %w", err))
	}

	fmt.Printf("Database clean completed for APP_ENV=%s.\n", appEnv)
	fmt.Printf("Cleaned %d application tables. schema_migrations was preserved.\n", len(tables))
	if !includeReferenceData {
		fmt.Println("Seeded reference data in badges was preserved.")
	}
}

func databaseDSN() (string, error) {
	if dsn := strings.TrimSpace(os.Getenv("DATABASE_URL")); dsn != "" {
		return dsn, nil
	}

	host := envOrDefault("DB_HOST", "localhost")
	port := envOrDefault("DB_PORT", "5432")
	name := envOrDefault("DB_NAME", "sobat_pintar")
	user := envOrDefault("DB_USER", "postgres")
	password := os.Getenv("DB_PASSWORD")
	sslMode := envOrDefault("DB_SSL_MODE", "disable")

	if strings.TrimSpace(password) == "" {
		return "", fmt.Errorf("DATABASE_URL or DB_PASSWORD must be set")
	}

	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user,
		password,
		host,
		port,
		name,
		sslMode,
	), nil
}

func qualifiedTables(tables []string) []string {
	qualified := make([]string, 0, len(tables))
	for _, table := range tables {
		qualified = append(qualified, "public."+table)
	}
	return qualified
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func exitWithUsage(message string) {
	fmt.Fprintln(os.Stderr, "Refusing to clean database:", message)
	fmt.Fprintln(os.Stderr, "Usage:")
	fmt.Fprintln(os.Stderr, "  go run cmd/clean-db/main.go --confirm", confirmationText)
	fmt.Fprintln(os.Stderr, "Production additionally requires:")
	fmt.Fprintln(os.Stderr, "  ALLOW_PRODUCTION_DATABASE_CLEAN="+confirmationText+" go run cmd/clean-db/main.go --confirm "+confirmationText+" --allow-production")
	os.Exit(2)
}

func exitWithError(err error) {
	fmt.Fprintln(os.Stderr, "Database clean failed:", err)
	os.Exit(1)
}

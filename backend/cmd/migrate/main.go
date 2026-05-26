package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"sobat-pintar/internal/config"
	"sobat-pintar/pkg/logger"
)

func main() {
	cfg := config.LoadConfig()
	logger.Init(cfg.AppEnv)

	db := config.ConnectDB(cfg)
	defer db.Close()

	if len(os.Args) < 2 {
		fmt.Println("Usage: migrate [up|down]")
		os.Exit(1)
	}

	command := os.Args[1]
	ctx := context.Background()
	if _, err := db.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		filename TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`); err != nil {
		logger.Fatal(err, "Failed to initialize migration tracking")
	}

	switch command {
	case "up":
		fmt.Println("Running migrations up...")
		files, err := os.ReadDir("migrations")
		if err != nil {
			logger.Fatal(err, "Failed to read migrations directory")
		}

		var sqlFiles []string
		for _, f := range files {
			if !f.IsDir() && strings.HasSuffix(f.Name(), ".sql") {
				sqlFiles = append(sqlFiles, f.Name())
			}
		}
		sort.Strings(sqlFiles)

		for _, f := range sqlFiles {
			var alreadyApplied bool
			if err := db.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE filename = $1)`, f).Scan(&alreadyApplied); err != nil {
				logger.Fatal(err, "Failed to check migration state", "file", f)
			}
			if alreadyApplied {
				fmt.Printf("Skipping migration already applied: %s\n", f)
				continue
			}

			fmt.Printf("Executing migration: %s\n", f)
			content, err := os.ReadFile(filepath.Join("migrations", f))
			if err != nil {
				logger.Fatal(err, "Failed to read migration file", "file", f)
			}

			tx, err := db.Begin(ctx)
			if err != nil {
				logger.Fatal(err, "Failed to begin migration transaction", "file", f)
			}
			if _, err = tx.Exec(ctx, string(content)); err != nil {
				_ = tx.Rollback(ctx)
				logger.Fatal(err, "Failed to execute migration", "file", f)
			}
			if _, err = tx.Exec(ctx, `INSERT INTO schema_migrations (filename) VALUES ($1)`, f); err != nil {
				_ = tx.Rollback(ctx)
				logger.Fatal(err, "Failed to record migration", "file", f)
			}
			if err = tx.Commit(ctx); err != nil {
				logger.Fatal(err, "Failed to commit migration", "file", f)
			}
		}
	case "down":
		fmt.Println("Running migrations down...")
		fmt.Println("Down migrations not implemented yet.")
	default:
		fmt.Println("Unknown command:", command)
		os.Exit(1)
	}

	fmt.Println("Migration command completed.")
}

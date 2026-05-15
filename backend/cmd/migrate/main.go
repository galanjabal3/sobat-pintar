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
			fmt.Printf("Executing migration: %s\n", f)
			content, err := os.ReadFile(filepath.Join("migrations", f))
			if err != nil {
				logger.Fatal(err, "Failed to read migration file", "file", f)
			}

			_, err = db.Exec(ctx, string(content))
			if err != nil {
				logger.Fatal(err, "Failed to execute migration", "file", f)
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

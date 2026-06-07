package main

import (
	"flag"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	var outputDir string
	flag.StringVar(&outputDir, "output-dir", "backups", "directory for database backup files")
	flag.Parse()

	_ = godotenv.Load()

	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dsn == "" {
		exitWithError(fmt.Errorf("DATABASE_URL must be set"))
	}

	pgDump, err := exec.LookPath("pg_dump")
	if err != nil {
		exitWithError(fmt.Errorf("pg_dump was not found; install PostgreSQL client tools first"))
	}

	if err := os.MkdirAll(outputDir, 0o700); err != nil {
		exitWithError(fmt.Errorf("create backup directory: %w", err))
	}

	databaseName := databaseNameFromDSN(dsn)
	timestamp := time.Now().Format("20060102-150405")
	outputPath := filepath.Join(outputDir, fmt.Sprintf("%s-%s.dump", databaseName, timestamp))

	command := exec.Command(
		pgDump,
		"--format=custom",
		"--no-owner",
		"--no-privileges",
		"--file="+outputPath,
		dsn,
	)
	command.Stdout = os.Stdout
	command.Stderr = os.Stderr

	fmt.Printf("Creating database backup at %s...\n", outputPath)
	if err := command.Run(); err != nil {
		_ = os.Remove(outputPath)
		exitWithError(fmt.Errorf("pg_dump failed: %w", err))
	}

	info, err := os.Stat(outputPath)
	if err != nil {
		exitWithError(fmt.Errorf("verify backup file: %w", err))
	}
	if info.Size() == 0 {
		_ = os.Remove(outputPath)
		exitWithError(fmt.Errorf("pg_dump created an empty backup file"))
	}

	fmt.Printf("Backup completed: %s (%s)\n", outputPath, formatBytes(info.Size()))
}

func databaseNameFromDSN(dsn string) string {
	parsed, err := url.Parse(dsn)
	if err != nil || (parsed.Scheme != "postgres" && parsed.Scheme != "postgresql") || parsed.Host == "" {
		return "sobat-pintar"
	}

	name := strings.Trim(strings.TrimSpace(parsed.Path), "/")
	if name == "" {
		return "sobat-pintar"
	}

	var safe strings.Builder
	for _, character := range name {
		switch {
		case character >= 'a' && character <= 'z':
			safe.WriteRune(character)
		case character >= 'A' && character <= 'Z':
			safe.WriteRune(character)
		case character >= '0' && character <= '9':
			safe.WriteRune(character)
		case character == '-' || character == '_':
			safe.WriteRune(character)
		default:
			safe.WriteRune('-')
		}
	}

	return safe.String()
}

func formatBytes(size int64) string {
	const (
		kib = int64(1024)
		mib = 1024 * kib
		gib = 1024 * mib
	)

	switch {
	case size >= gib:
		return fmt.Sprintf("%.2f GiB", float64(size)/float64(gib))
	case size >= mib:
		return fmt.Sprintf("%.2f MiB", float64(size)/float64(mib))
	case size >= kib:
		return fmt.Sprintf("%.2f KiB", float64(size)/float64(kib))
	default:
		return fmt.Sprintf("%d bytes", size)
	}
}

func exitWithError(err error) {
	fmt.Fprintln(os.Stderr, "Database backup failed:", err)
	os.Exit(1)
}

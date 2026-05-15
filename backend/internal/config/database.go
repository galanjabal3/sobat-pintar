package config

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/pkg/logger"
)

func ConnectDB(cfg *Config) *pgxpool.Pool {
	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSSLMode)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		logger.Fatal(err, "Failed to connect to database")
	}

	err = pool.Ping(ctx)
	if err != nil {
		logger.Fatal(err, "Failed to ping database")
	}

	logger.Info("Successfully connected to database")
	return pool
}

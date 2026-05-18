package redis

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"sobat-pintar/pkg/logger"
)

type Client struct {
	Redis *redis.Client
}

func ConnectRedis(host, port, password string, enabled bool) (*Client, error) {
	if !enabled {
		logger.Info("Redis is disabled")
		return nil, nil
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: password,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		closeErr := rdb.Close()
		if closeErr != nil {
			err = errors.Join(err, closeErr)
		}
		return nil, fmt.Errorf("failed to connect to redis: %w", err)
	}

	logger.Info("Successfully connected to redis")
	return &Client{Redis: rdb}, nil
}

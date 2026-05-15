package redis

import (
	"context"
	"fmt"
	"time"
)

// SetSession stores a session value
func (c *Client) SetSession(ctx context.Context, userID, key, value string, ttl time.Duration) error {
	sessionKey := fmt.Sprintf("session:%s:%s", userID, key)
	return c.Redis.Set(ctx, sessionKey, value, ttl).Err()
}

// GetSession retrieves a session value
func (c *Client) GetSession(ctx context.Context, userID, key string) (string, error) {
	sessionKey := fmt.Sprintf("session:%s:%s", userID, key)
	return c.Redis.Get(ctx, sessionKey).Result()
}

// DeleteSession removes a session value
func (c *Client) DeleteSession(ctx context.Context, userID, key string) error {
	sessionKey := fmt.Sprintf("session:%s:%s", userID, key)
	return c.Redis.Del(ctx, sessionKey).Err()
}

package redis

import (
	"context"
	"encoding/json"
	"time"
)

// Set caches a value with a given key and TTL
func (c *Client) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return c.Redis.Set(ctx, key, data, ttl).Err()
}

// Get retrieves a cached value by key
func (c *Client) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := c.Redis.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

// Delete removes a cached value by key
func (c *Client) Delete(ctx context.Context, key string) error {
	return c.Redis.Del(ctx, key).Err()
}

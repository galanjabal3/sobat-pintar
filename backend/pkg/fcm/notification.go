package fcm

import (
	"context"
)

func (c *Client) SendNotification(ctx context.Context, token, title, body string) error {
	// TODO: Implement actual FCM send logic
	return nil
}

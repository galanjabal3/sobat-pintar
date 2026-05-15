package storage

import (
	"context"
	"io"
)

type R2Client struct {
	Bucket    string
	PublicURL string
}

func NewR2Client(ctx context.Context, accountID, accessKey, secretKey, bucket, publicURL string) (*R2Client, error) {
	// TODO: Implement with actual S3 client when available
	return &R2Client{
		Bucket:    bucket,
		PublicURL: publicURL,
	}, nil
}

func (c *R2Client) Upload(ctx context.Context, key string, body io.Reader, contentType string) (string, error) {
	// TODO: Implement actual upload logic
	return "", nil
}

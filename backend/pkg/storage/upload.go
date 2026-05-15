package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"

	"github.com/google/uuid"
)

type Storage interface {
	Upload(ctx context.Context, key string, body io.Reader, contentType string) (string, error)
}

func UploadFile(ctx context.Context, s Storage, folder string, filename string, body io.Reader, contentType string) (string, error) {
	ext := filepath.Ext(filename)
	key := fmt.Sprintf("%s/%s%s", folder, uuid.New().String(), ext)
	return s.Upload(ctx, key, body, contentType)
}

package gemini

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const maxAIImageBytes = 5 << 20

func fetchUploadedImage(ctx context.Context, imageURL string) ([]byte, string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return nil, "", fmt.Errorf("failed to prepare image request: %w", err)
	}

	httpClient := &http.Client{
		Timeout: 15 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return fmt.Errorf("too many image redirects")
			}
			if req.URL.Scheme != "https" || req.URL.Hostname() != "res.cloudinary.com" {
				return fmt.Errorf("image redirect host is invalid")
			}
			return nil
		},
	}

	httpResp, err := httpClient.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("failed to fetch image: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		return nil, "", fmt.Errorf("failed to fetch image: status code %d", httpResp.StatusCode)
	}

	mimeType := strings.TrimSpace(strings.Split(httpResp.Header.Get("Content-Type"), ";")[0])
	if !strings.HasPrefix(mimeType, "image/") {
		return nil, "", fmt.Errorf("image content type is invalid")
	}

	imgData, err := io.ReadAll(io.LimitReader(httpResp.Body, maxAIImageBytes+1))
	if err != nil {
		return nil, "", fmt.Errorf("failed to read image data: %w", err)
	}
	if len(imgData) > maxAIImageBytes {
		return nil, "", fmt.Errorf("image exceeds the maximum size of 5MB")
	}

	return imgData, mimeType, nil
}

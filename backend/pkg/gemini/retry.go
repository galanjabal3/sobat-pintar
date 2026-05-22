package gemini

import (
	"context"
	"errors"
	"time"

	"google.golang.org/genai"
)

func (c *Client) generateContentWithRetry(ctx context.Context, contents []*genai.Content, config *genai.GenerateContentConfig) (*genai.GenerateContentResponse, error) {
	backoffs := []time.Duration{0, 250 * time.Millisecond, 750 * time.Millisecond}
	var lastErr error

	for attempt := range backoffs {
		if attempt > 0 {
			timer := time.NewTimer(backoffs[attempt])
			select {
			case <-ctx.Done():
				timer.Stop()
				return nil, ctx.Err()
			case <-timer.C:
			}
		}

		resp, err := c.GenAI.Models.GenerateContent(ctx, c.ModelName, contents, config)
		if err == nil {
			return resp, nil
		}

		lastErr = err
		if !isRetryableGeminiError(err) {
			break
		}
	}

	return nil, lastErr
}

func (c *Client) generateCompleteTextWithRetry(ctx context.Context, contents []*genai.Content, config *genai.GenerateContentConfig) (string, error) {
	resp, err := c.generateContentWithRetry(ctx, contents, config)
	if err != nil {
		return "", err
	}

	text, err := responseText(resp)
	if !errors.Is(err, errMaxTokens) {
		return text, err
	}

	retryConfig := *config
	retryConfig.MaxOutputTokens = config.MaxOutputTokens + 1200
	retryResp, retryErr := c.generateContentWithRetry(ctx, contents, &retryConfig)
	if retryErr != nil {
		return "", retryErr
	}

	return responseText(retryResp)
}

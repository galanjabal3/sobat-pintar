package gemini

import (
	"context"

	"google.golang.org/genai"
	"sobat-pintar/pkg/logger"
)

type Client struct {
	GenAI     *genai.Client
	ModelName string
}

func NewClient(ctx context.Context, apiKey, modelName string) *Client {
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		logger.Fatal(err, "Failed to create Gemini client")
	}

	logger.Info("Successfully created Gemini client", "model", modelName)
	return &Client{
		GenAI:     client,
		ModelName: modelName,
	}
}

func (c *Client) Close() {
	// genai.Client in v1+ does not require explicit closing
}

package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) ExplainImage(ctx context.Context, level string, imageData []byte, mimeType string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jelaskan soal dalam gambar berikut kepada siswa tingkat %s dengan bahasa yang mudah dipahami.
Gunakan analogi yang sederhana jika perlu.
Jangan langsung kasih jawaban — jelaskan konsepnya dulu step by step.`, level)

	// Create parts for text and image data as pointers.
	parts := []*genai.Part{
		{Text: prompt},
		{
			InlineData: &genai.Blob{
				Data:     imageData,
				MIMEType: mimeType,
			},
		},
	}

	// Construct the content object with multiple parts.
	content := &genai.Content{
		Role:  "user",
		Parts: parts,
	}

	// Call GenerateContent with the content object.
	resp, err := c.GenAI.Models.GenerateContent(ctx, c.ModelName, []*genai.Content{content}, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	// The Text() method directly extracts the response text.
	return resp.Text(), nil
}

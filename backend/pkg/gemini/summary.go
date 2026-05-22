package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) SummarizeMateri(ctx context.Context, level, content string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan rangkuman dari materi berikut untuk siswa tingkat %s.
Langsung masuk ke isi rangkuman tanpa salam pembuka atau filler.
Format rangkuman:
1. Poin-poin penting (bullet points, max 10)
2. Kesimpulan singkat (2-3 kalimat)
3. Tips untuk mengingat materi ini
%s

Materi: %s`, level, textFormattingInstruction(), content)

	summary, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, summaryGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return summary, nil
}

package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) SummarizeMateri(ctx context.Context, level, content string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan rangkuman dari materi berikut untuk siswa tingkat %s.
Format rangkuman:
1. Poin-poin penting (bullet points, max 10)
2. Kesimpulan singkat (2-3 kalimat)
3. Tips untuk mengingat materi ini
%s

Materi: %s`, level, textFormattingInstruction(), content)

	// Call GenerateContent with the content object.
	resp, err := c.GenAI.Models.GenerateContent(ctx, c.ModelName, genai.Text(prompt), nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return resp.Text(), nil
}

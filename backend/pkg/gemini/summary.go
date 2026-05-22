package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) SummarizeMateri(ctx context.Context, level, content string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan rangkuman dari materi berikut untuk siswa tingkat %s.
Langsung masuk ke isi rangkuman tanpa salam pembuka atau filler.
Gunakan format Markdown berikut secara konsisten:

## Poin-poin penting
- Tulis maksimal 8 bullet pendek.
- Setiap bullet fokus pada satu ide penting.
- Jangan gunakan numbered list.

## Kesimpulan
Tulis 2-3 kalimat singkat yang merangkum inti materi.

## Tips Sobi
- Tulis maksimal 3 bullet tips mengingat materi.
- Buat tips yang praktis untuk siswa sekolah.

Jangan membuat rangkuman untuk membantu kecurangan ujian, plagiarisme, atau permintaan di luar konteks belajar sekolah.
%s
%s

Materi: %s`, level, learningSafetyInstruction(), textFormattingInstruction(), content)

	summary, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, summaryGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return summary, nil
}

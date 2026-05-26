package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) SummarizeMateri(ctx context.Context, level, content string) (string, error) {
	prompt := summaryPrompt(level, "Materi:\n"+content)

	summary, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, summaryGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return summary, nil
}

func (c *Client) SummarizeImageMateri(ctx context.Context, level, imageURL string) (string, error) {
	imgData, mimeType, err := fetchUploadedImage(ctx, imageURL)
	if err != nil {
		return "", err
	}

	prompt := summaryPrompt(level, "Baca materi belajar yang terlihat pada gambar terlampir. Jika teks utama tidak terbaca jelas atau gambar bukan materi belajar, jelaskan singkat bahwa siswa perlu mengunggah foto materi yang lebih jelas.")
	contents := []*genai.Content{{
		Role: "user",
		Parts: []*genai.Part{
			genai.NewPartFromText(prompt),
			genai.NewPartFromBytes(imgData, mimeType),
		},
	}}

	summary, err := c.generateCompleteTextWithRetry(ctx, contents, summaryGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return summary, nil
}

func summaryPrompt(level, materialInstruction string) string {
	return fmt.Sprintf(`Kamu adalah Sobi. Buatkan rangkuman dari materi berikut untuk siswa tingkat %s.
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

%s`, level, learningSafetyInstruction(), textFormattingInstruction(), materialInstruction)
}

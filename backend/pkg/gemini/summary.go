package gemini

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

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
	const maxSummaryImageBytes = 5 << 20

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, imageURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to prepare image request: %w", err)
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
		return "", fmt.Errorf("failed to fetch image: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch image: status code %d", httpResp.StatusCode)
	}

	mimeType := strings.TrimSpace(strings.Split(httpResp.Header.Get("Content-Type"), ";")[0])
	if !strings.HasPrefix(mimeType, "image/") {
		return "", fmt.Errorf("image content type is invalid")
	}

	imgData, err := io.ReadAll(io.LimitReader(httpResp.Body, maxSummaryImageBytes+1))
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %w", err)
	}
	if len(imgData) > maxSummaryImageBytes {
		return "", fmt.Errorf("image exceeds the maximum size of 5MB")
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

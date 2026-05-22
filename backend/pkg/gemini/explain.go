package gemini

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"google.golang.org/genai"
)

func (c *Client) ExplainQuestion(ctx context.Context, question, level string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.
Mulai dari inti jawaban lalu lanjutkan dengan penjelasan sederhana.
Jika pertanyaannya umum seperti "apa itu kimia", berikan definisi yang ringkas dan jelas terlebih dahulu.
Jelaskan soal berikut kepada siswa tingkat %s dengan bahasa yang mudah dipahami.
Gunakan analogi yang sederhana jika perlu.
Jangan langsung kasih jawaban — jelaskan konsepnya dulu step by step.
%s

Soal: %s`, level, textFormattingInstruction(), question)

	answer, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, explainGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

func (c *Client) ExplainQuestionWithImage(ctx context.Context, question, imageURL, level string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.
Mulai dari inti jawaban lalu lanjutkan dengan penjelasan sederhana.
Jelaskan soal pada gambar berikut kepada siswa tingkat %s dengan bahasa yang mudah dipahami.
Gunakan analogi yang sederhana jika perlu.
Jangan langsung kasih jawaban — jelaskan konsepnya dulu step by step.
%s

Soal tambahan: %s`, level, textFormattingInstruction(), question)

	// Fetch image data
	httpResp, err := http.Get(imageURL)
	if err != nil {
		return "", fmt.Errorf("failed to fetch image: %w", err)
	}
	defer httpResp.Body.Close()

	if httpResp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch image: status code %d", httpResp.StatusCode)
	}

	imgData, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read image data: %w", err)
	}

	// Prepare multimodal parts
	mimeType := httpResp.Header.Get("Content-Type")
	if mimeType == "" {
		return "", fmt.Errorf("image content type is missing from response headers")
	}

	contents := []*genai.Content{
		{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromText(prompt),
				genai.NewPartFromBytes(imgData, mimeType),
			},
		},
	}

	answer, err := c.generateCompleteTextWithRetry(ctx, contents, explainGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

func (c *Client) ReExplainQuestion(ctx context.Context, question, previousExplanation, level string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi. Siswa tingkat %s masih bingung dengan penjelasan sebelumnya.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.
Coba jelaskan dengan cara yang BERBEDA — gunakan analogi lain, contoh nyata dalam kehidupan sehari-hari, atau ilustrasi yang lebih sederhana.
Jangan bikin siswa merasa bodoh — semangati mereka.
%s

Penjelasan sebelumnya: %s
Soal: %s`, level, textFormattingInstruction(), previousExplanation, question)

	answer, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, explainGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) ExplainQuestion(ctx context.Context, question, level string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.
Mulai dari inti konsep, lanjutkan dengan langkah penyelesaian sederhana, lalu berikan jawaban akhir hanya jika dibutuhkan untuk memahami.
Jika pertanyaannya umum seperti "apa itu kimia", berikan definisi yang ringkas dan jelas terlebih dahulu.
Jelaskan soal berikut kepada siswa tingkat %s dengan bahasa yang mudah dipahami.
Gunakan analogi yang sederhana jika perlu.
Jika soal tampak seperti ujian atau kuis aktif, jangan berikan jawaban final. Berikan konsep, petunjuk, dan langkah belajar untuk soal sejenis.
%s
%s

Soal: %s`, level, learningSafetyInstruction(), textFormattingInstruction(), question)

	answer, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, explainGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

func (c *Client) ExplainQuestionWithImage(ctx context.Context, question, imageURL, level string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.
Mulai dari inti konsep, lanjutkan dengan langkah penyelesaian sederhana, lalu berikan jawaban akhir hanya jika dibutuhkan untuk memahami.
Jelaskan soal pada gambar berikut kepada siswa tingkat %s dengan bahasa yang mudah dipahami.
Gunakan analogi yang sederhana jika perlu.
Jika gambar tampak seperti ujian atau kuis aktif, jangan berikan jawaban final. Berikan konsep, petunjuk, dan langkah belajar untuk soal sejenis.
%s
%s

Soal tambahan: %s`, level, learningSafetyInstruction(), textFormattingInstruction(), question)

	imgData, mimeType, err := fetchUploadedImage(ctx, imageURL)
	if err != nil {
		return "", err
	}

	contents := []*genai.Content{{
		Role: "user",
		Parts: []*genai.Part{
			genai.NewPartFromText(prompt),
			genai.NewPartFromBytes(imgData, mimeType),
		},
	}}

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
Jika soal tampak seperti ujian atau kuis aktif, jangan berikan jawaban final. Fokus pada konsep dan langkah berpikir.
%s
%s

Penjelasan sebelumnya: %s
Soal: %s`, level, learningSafetyInstruction(), textFormattingInstruction(), previousExplanation, question)

	answer, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, explainGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

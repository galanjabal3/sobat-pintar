package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

func (c *Client) ExplainQuestion(ctx context.Context, question, level string) (string, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jelaskan soal berikut kepada siswa tingkat %s.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.

%s
%s
%s

%s
%s
%s

Soal: %s`, level, explainStructurePrompt(), levelTonePrompt(), generalQuestionHintPrompt(), activeExamRefusalPrompt(), learningSafetyInstruction(), textFormattingInstruction(), question)

	answer, err := c.generateCompleteTextWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, explainGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

func (c *Client) ExplainQuestionWithImage(ctx context.Context, question, imageURL, level string) (string, error) {
	additionalQuestion := ""
	if question != "" {
		additionalQuestion = "\nSoal tambahan: " + question
	}

	prompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly dan sabar.
Jelaskan soal pada gambar berikut kepada siswa tingkat %s.
Jawab langsung tanpa salam pembuka, tanpa pengulangan pertanyaan, dan tanpa filler.

%s
%s

Jika gambar tampak seperti ujian atau kuis aktif, jangan berikan jawaban final. Katakan: "Kayaknya ini soal ujian ya? Aku bantu kamu ngerti konsepnya biar bisa jawab sendiri!" lalu berikan konsep dan langkah berpikir.
%s
%s

%s`, level, explainStructurePrompt(), levelTonePrompt(), learningSafetyInstruction(), textFormattingInstruction(), additionalQuestion)

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

Tugas kamu sekarang adalah menjelaskan ulang dengan cara yang BENAR-BENAR BERBEDA:
- Gunakan analogi baru yang belum dipakai di penjelasan sebelumnya.
- Mulai dari sudut pandang yang berbeda — misalnya dari contoh nyata dulu baru ke konsep, atau dari akibat/hasil dulu baru ke sebab.
- Pecah konsep jadi bagian lebih kecil jika sebelumnya terlalu banyak sekaligus.
- Gunakan perbandingan atau kontras jika membantu.
- Jika ada langkah yang mungkin membingungkan, highlight bagian itu dan jelaskan lebih detail.

Jangan bikin siswa merasa bodoh. Buka dengan kalimat yang menyemangati dan wajarkan kebingungan mereka.
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

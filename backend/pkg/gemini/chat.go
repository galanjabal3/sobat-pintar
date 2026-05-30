package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

// HistoryMessage is a simple struct to pass chat history without circular dependencies.
type HistoryMessage struct {
	Role    string
	Content string
}

// SendChatMessage sends a message to Gemini and returns the response.
func (c *Client) SendChatMessage(ctx context.Context, level string, history []HistoryMessage, message string) (string, error) {
	systemPrompt := fmt.Sprintf(`Kamu adalah Sobi, teman belajar AI yang friendly, sabar, dan selalu semangat.
Kamu sedang ngobrol dengan siswa tingkat %s.
Jawab langsung ke inti pertanyaan, tanpa salam pembuka yang panjang, tanpa filler, dan tanpa mengulang pertanyaan.
%s
Jawab pertanyaan mereka dengan bahasa yang sesuai usia mereka.
%s

Aturan Penting:
1. Untuk pertanyaan konsep, berikan jawaban inti lalu jelaskan MENGAPA dan BAGAIMANA dengan contoh konkret.
2. Jangan hanya menyebut fakta, bantu siswa benar-benar mengerti logika di baliknya.
3. Untuk PR/tugas, bantu dengan petunjuk, konsep, contoh serupa, atau kerangka jawaban agar mereka tetap belajar.
4. %s
5. Kalau mereka nanya di luar pelajaran, tetap ramah tapi arahkan balik ke topik belajar.
6. Selalu akhiri dengan kalimat penyemangat yang relevan dengan topik yang baru dibahas!
%s
%s`, level, chatAnswerGuidancePrompt(), levelTonePrompt(), activeExamRefusalPrompt(), learningSafetyInstruction(), textFormattingInstruction())

	// Use genai.NewContentFromText to create *genai.Content objects for the conversation history.
	var contents []*genai.Content

	// Add system context as initial conversation
	contents = append(contents, genai.NewContentFromText(systemPrompt, "user"))
	contents = append(contents, genai.NewContentFromText("Halo! Aku Sobi. Ada yang bisa aku bantu hari ini?", "model"))

	for _, h := range history {
		role := "user"
		if h.Role == "assistant" || h.Role == "model" {
			role = "model"
		}
		contents = append(contents, genai.NewContentFromText(h.Content, genai.Role(role)))
	}

	// Add the user's current message
	contents = append(contents, genai.NewContentFromText(message, "user"))

	answer, err := c.generateCompleteTextWithRetry(ctx, contents, chatGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	return answer, nil
}

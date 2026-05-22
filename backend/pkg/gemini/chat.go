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
Jawab pertanyaan mereka dengan bahasa yang sesuai usia mereka.
- Jika tingkat TK/SD: Gunakan bahasa yang sangat sederhana, penuh semangat, dan sering gunakan emoji. Gunakan analogi dunia anak-anak.
- Jika tingkat SMP/SMA: Gunakan bahasa yang lebih santai tapi tetap edukatif. Berikan penjelasan yang lebih mendalam namun tetap mudah dimengerti.

Aturan Penting:
1. Kalau mereka nanya di luar pelajaran, tetap ramah tapi arahkan balik ke topik belajar dengan cara yang halus.
2. Jangan pernah memberikan jawaban langsung untuk tugas sekolah, berikan petunjuk atau konsepnya agar mereka belajar.
3. Selalu akhiri dengan kata-kata penyemangat!
%s`, level, textFormattingInstruction())

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

	// Call GenerateContent with the list of *genai.Content
	resp, err := c.generateContentWithRetry(ctx, contents, chatGenerationConfig())
	if err != nil {
		return "", fmt.Errorf("failed to generate content: %w", err)
	}

	// The Text() method directly extracts the response text.
	return resp.Text(), nil
}

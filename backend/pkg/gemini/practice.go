package gemini

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

type PracticeQuestion struct {
	Question      string            `json:"question"`
	Options       map[string]string `json:"options"`
	CorrectAnswer string            `json:"correct_answer"`
	Explanation   string            `json:"explanation"`
}

type PracticeResponse struct {
	Questions []PracticeQuestion `json:"questions"`
}

func (c *Client) GeneratePracticeQuestions(ctx context.Context, level, subject, difficulty string, count int) ([]PracticeQuestion, error) {
	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan %d soal latihan mata pelajaran %s untuk siswa tingkat %s.
Tingkat kesulitan: %s (mudah/sedang/sulit).
%s
Format response HANYA JSON seperti ini, tanpa teks lain:
{
  "questions": [
    {
      "question": "teks soal",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "A",
      "explanation": "kenapa jawabannya A"
    }
  ]
}`, count, subject, level, difficulty, textFormattingInstruction())

	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		resp, err := c.generateContentWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, practiceGenerationConfig())
		if err != nil {
			return nil, fmt.Errorf("failed to generate content: %w", err)
		}

		rawText := resp.Text()

		var practiceRes PracticeResponse
		if err := decodeGeminiJSON(rawText, &practiceRes); err == nil {
			return practiceRes.Questions, nil
		} else {
			lastErr = err
		}
	}

	return nil, fmt.Errorf("failed to parse Gemini response after retry: %w", lastErr)
}

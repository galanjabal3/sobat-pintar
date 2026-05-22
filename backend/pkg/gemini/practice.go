package gemini

import (
	"context"
	"fmt"
	"strings"

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
Soal harus bertujuan untuk latihan belajar, bukan meniru ujian aktif atau membocorkan jawaban ujian.
Buat tepat %d soal. Setiap soal harus punya tepat 4 opsi A, B, C, D.
correct_answer harus salah satu dari A, B, C, atau D, dan hanya boleh ada satu jawaban benar.
Explanation harus menjelaskan konsep dan langkah berpikir secara singkat, bukan hanya menyebut jawaban.
%s
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
}`, count, subject, level, difficulty, count, learningSafetyInstruction(), textFormattingInstruction())

	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		resp, err := c.generateContentWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, practiceGenerationConfig())
		if err != nil {
			return nil, fmt.Errorf("failed to generate content: %w", err)
		}

		rawText := resp.Text()

		var practiceRes PracticeResponse
		if err := decodeGeminiJSON(rawText, &practiceRes); err == nil {
			if err := validatePracticeResponse(practiceRes.Questions, count); err != nil {
				lastErr = err
				continue
			}
			return practiceRes.Questions, nil
		} else {
			lastErr = err
		}
	}

	return nil, fmt.Errorf("failed to parse Gemini response after retry: %w", lastErr)
}

func validatePracticeResponse(questions []PracticeQuestion, expectedCount int) error {
	if len(questions) != expectedCount {
		return errInvalidPracticeResponse
	}

	for _, question := range questions {
		if strings.TrimSpace(question.Question) == "" || strings.TrimSpace(question.Explanation) == "" {
			return errInvalidPracticeResponse
		}

		if !isValidAnswerKey(question.CorrectAnswer) {
			return errInvalidPracticeResponse
		}

		if len(question.Options) != 4 {
			return errInvalidPracticeResponse
		}

		for _, key := range []string{"A", "B", "C", "D"} {
			if strings.TrimSpace(question.Options[key]) == "" {
				return errInvalidPracticeResponse
			}
		}
	}

	return nil
}

func isValidAnswerKey(value string) bool {
	switch value {
	case "A", "B", "C", "D":
		return true
	default:
		return false
	}
}

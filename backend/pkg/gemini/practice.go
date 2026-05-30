package gemini

import (
	"context"
	"errors"
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

func (c *Client) GeneratePracticeQuestions(ctx context.Context, level, subject, difficulty string, count int, sourceContent string) ([]PracticeQuestion, error) {
	sourceInstruction := "Buat soal berdasarkan cakupan umum mata pelajaran dan jenjang siswa."
	if strings.TrimSpace(sourceContent) != "" {
		sourceInstruction = fmt.Sprintf(`Buat soal HANYA berdasarkan materi berikut. Jangan menambahkan konsep di luar materi jika tidak diperlukan.

Materi siswa:
%s`, strings.TrimSpace(sourceContent))
	}

	prompt := fmt.Sprintf(`Kamu adalah Sobi. Buatkan %d soal latihan mata pelajaran %s untuk siswa tingkat %s.
Tingkat kesulitan: %s (mudah/sedang/sulit).
%s
Soal harus bertujuan untuk latihan belajar, bukan meniru ujian aktif atau membocorkan jawaban ujian.
Buat tepat %d soal. Setiap soal harus punya tepat 4 opsi A, B, C, D.
correct_answer harus salah satu dari A, B, C, atau D, dan hanya boleh ada satu jawaban benar.
Semua opsi jawaban harus berbeda makna dan berbeda teks. Jangan membuat dua opsi yang sama persis atau hanya beda kapitalisasi/tanda baca.
Distractor (opsi salah) harus masuk akal dan mewakili kesalahan umum siswa — jangan buat opsi yang terlalu jelas salah.
Teks soal harus jelas, tidak ambigu, dan sesuai jenjang siswa.
Explanation harus menjelaskan: (1) mengapa jawaban benar itu benar, (2) logika atau konsep yang mendasarinya, (3) mengapa minimal satu opsi salah yang paling sering dipilih itu salah. Jangan hanya menyebut jawaban.
Jangan gunakan formatting markdown di dalam field JSON. Hindari LaTeX mentah seperti \pi, \times, atau ^2; tulis simbol matematikanya secara langsung jika memungkinkan.
%s
Format response HANYA JSON seperti ini, tanpa teks lain:
{
  "questions": [
    {
      "question": "teks soal",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "A",
      "explanation": "kenapa jawabannya A, logika di baliknya, dan kenapa opsi lain salah"
    }
  ]
}`, count, subject, level, difficulty, sourceInstruction, count, learningSafetyInstruction())

	var lastErr error
	for attempt := 0; attempt < 2; attempt++ {
		config := practiceGenerationConfig()
		if attempt > 0 {
			config.MaxOutputTokens += 1600
		}

		resp, err := c.generateContentWithRetry(ctx, []*genai.Content{genai.NewContentFromText(prompt, "user")}, config)
		if err != nil {
			return nil, fmt.Errorf("failed to generate content: %w", err)
		}

		if len(resp.Candidates) > 0 && resp.Candidates[0].FinishReason == genai.FinishReasonMaxTokens {
			lastErr = errMaxTokens
			continue
		}

		rawText, err := responseText(resp)
		if err != nil {
			lastErr = err
			continue
		}

		var practiceRes PracticeResponse
		if err := decodeGeminiJSON(rawText, &practiceRes); err == nil {
			normalizePracticeResponse(&practiceRes)
			if err := validatePracticeResponse(practiceRes.Questions, count); err != nil {
				lastErr = err
				continue
			}
			return practiceRes.Questions, nil
		} else {
			lastErr = err
		}
	}

	if errors.Is(lastErr, errInvalidPracticeResponse) {
		return nil, fmt.Errorf("failed to validate Gemini practice response after retry: %w", lastErr)
	}

	return nil, fmt.Errorf("failed to parse Gemini response after retry: %w", lastErr)
}

func normalizePracticeResponse(response *PracticeResponse) {
	for i := range response.Questions {
		question := &response.Questions[i]
		question.Question = normalizePracticeText(question.Question)
		question.Explanation = normalizePracticeText(question.Explanation)
		question.CorrectAnswer = strings.ToUpper(strings.TrimSpace(question.CorrectAnswer))

		if len(question.Options) == 0 {
			continue
		}

		normalizedOptions := make(map[string]string, len(question.Options))
		for key, value := range question.Options {
			normalizedKey := strings.ToUpper(strings.TrimSpace(key))
			normalizedOptions[normalizedKey] = normalizePracticeText(value)
		}
		question.Options = normalizedOptions
	}
}

func normalizePracticeText(value string) string {
	replacer := strings.NewReplacer(
		`\\pi`, "π",
		`\pi`, "π",
		`\\times`, "×",
		`\times`, "×",
		`\\cdot`, "·",
		`\cdot`, "·",
		`\\frac{1}{2}`, "1/2",
		`\\frac{1}{4}`, "1/4",
		`\\frac{3}{4}`, "3/4",
		`^2`, "²",
		`^3`, "³",
	)
	return strings.TrimSpace(replacer.Replace(value))
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

		seenOptions := make(map[string]struct{}, 4)
		for _, key := range []string{"A", "B", "C", "D"} {
			optionText := strings.TrimSpace(question.Options[key])
			if optionText == "" {
				return errInvalidPracticeResponse
			}
			normalizedOption := normalizePracticeOptionText(optionText)
			if _, exists := seenOptions[normalizedOption]; exists {
				return errInvalidPracticeResponse
			}
			seenOptions[normalizedOption] = struct{}{}
		}
	}

	return nil
}

func normalizePracticeOptionText(value string) string {
	return strings.Join(strings.Fields(strings.ToLower(strings.TrimSpace(value))), " ")
}

func isValidAnswerKey(value string) bool {
	switch value {
	case "A", "B", "C", "D":
		return true
	default:
		return false
	}
}

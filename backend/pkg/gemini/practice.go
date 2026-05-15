package gemini

import (
	"context"
	"encoding/json"
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
}`, count, subject, level, difficulty)

	// Call GenerateContent with the content object.
	resp, err := c.GenAI.Models.GenerateContent(ctx, c.ModelName, genai.Text(prompt), nil)
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	rawText := resp.Text() // Use resp.Text() to get the response string

	// Robust JSON extraction
	start := strings.Index(rawText, "{")
	end := strings.LastIndex(rawText, "}")
	if start == -1 || end == -1 || end < start {
		return nil, fmt.Errorf("failed to find JSON in Gemini response: %s", rawText)
	}
	cleanText := rawText[start : end+1]

	var practiceRes PracticeResponse
	if err := json.Unmarshal([]byte(cleanText), &practiceRes); err != nil {
		return nil, fmt.Errorf("failed to parse Gemini response: %w\nResponse was: %s", err, cleanText)
	}

	return practiceRes.Questions, nil
}

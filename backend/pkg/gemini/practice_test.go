package gemini

import (
	"errors"
	"testing"
)

func TestValidatePracticeResponseRejectsWrongQuestionCount(t *testing.T) {
	questions := []PracticeQuestion{validPracticeQuestion()}

	err := validatePracticeResponse(questions, 2)
	if !errors.Is(err, errInvalidPracticeResponse) {
		t.Fatalf("expected invalid practice response error, got %v", err)
	}
}

func TestValidatePracticeResponseRejectsInvalidCorrectAnswer(t *testing.T) {
	question := validPracticeQuestion()
	question.CorrectAnswer = "E"

	err := validatePracticeResponse([]PracticeQuestion{question}, 1)
	if !errors.Is(err, errInvalidPracticeResponse) {
		t.Fatalf("expected invalid practice response error, got %v", err)
	}
}

func TestValidatePracticeResponseRejectsMissingOption(t *testing.T) {
	question := validPracticeQuestion()
	delete(question.Options, "D")

	err := validatePracticeResponse([]PracticeQuestion{question}, 1)
	if !errors.Is(err, errInvalidPracticeResponse) {
		t.Fatalf("expected invalid practice response error, got %v", err)
	}
}

func TestValidatePracticeResponseRejectsDuplicateOptions(t *testing.T) {
	question := validPracticeQuestion()
	question.Options["C"] = "  4  "

	err := validatePracticeResponse([]PracticeQuestion{question}, 1)
	if !errors.Is(err, errInvalidPracticeResponse) {
		t.Fatalf("expected invalid practice response error, got %v", err)
	}
}

func TestValidatePracticeResponseAllowsValidQuestions(t *testing.T) {
	err := validatePracticeResponse([]PracticeQuestion{validPracticeQuestion()}, 1)
	if err != nil {
		t.Fatalf("expected valid practice response, got %v", err)
	}
}

func TestNormalizePracticeResponseReplacesCommonLatexSymbols(t *testing.T) {
	response := PracticeResponse{
		Questions: []PracticeQuestion{
			{
				Question:      "Luas lingkaran adalah 196 \\pi cm^2",
				Options:       map[string]string{"a": "196 \\pi cm^2", "b": "49 \\pi cm^2", "c": "392 \\pi cm^2", "d": "98 \\pi cm^2"},
				CorrectAnswer: "b",
				Explanation:   "Gunakan rumus luas lingkaran.",
			},
		},
	}

	normalizePracticeResponse(&response)

	if response.Questions[0].Question != "Luas lingkaran adalah 196 π cm²" {
		t.Fatalf("unexpected normalized question: %q", response.Questions[0].Question)
	}
	if response.Questions[0].Options["A"] != "196 π cm²" {
		t.Fatalf("unexpected normalized option: %q", response.Questions[0].Options["A"])
	}
	if response.Questions[0].CorrectAnswer != "B" {
		t.Fatalf("unexpected normalized answer: %q", response.Questions[0].CorrectAnswer)
	}
}

func validPracticeQuestion() PracticeQuestion {
	return PracticeQuestion{
		Question:      "Berapakah 2 + 2?",
		Options:       map[string]string{"A": "3", "B": "4", "C": "5", "D": "6"},
		CorrectAnswer: "B",
		Explanation:   "2 + 2 sama dengan 4 karena menambahkan dua benda ke dua benda menghasilkan empat benda.",
	}
}

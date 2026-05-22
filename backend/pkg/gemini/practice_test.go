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

func TestValidatePracticeResponseAllowsValidQuestions(t *testing.T) {
	err := validatePracticeResponse([]PracticeQuestion{validPracticeQuestion()}, 1)
	if err != nil {
		t.Fatalf("expected valid practice response, got %v", err)
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

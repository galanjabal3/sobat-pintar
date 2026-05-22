package gemini

import (
	"errors"
	"testing"

	"google.golang.org/genai"
)

func TestExtractJSONDocumentHandlesFencedBlocks(t *testing.T) {
	raw := "```json\n{\n  \"questions\": [{\"question\": \"A\"}]\n}\n```"

	got, err := extractJSONDocument(raw)
	if err != nil {
		t.Fatalf("extractJSONDocument returned error: %v", err)
	}

	want := "{\n  \"questions\": [{\"question\": \"A\"}]\n}"
	if got != want {
		t.Fatalf("unexpected JSON document\nwant: %s\ngot:  %s", want, got)
	}
}

func TestExtractJSONDocumentRejectsIncompleteJSON(t *testing.T) {
	_, err := extractJSONDocument("```json\n{\n  \"questions\": [\n")
	if err == nil {
		t.Fatal("expected error for incomplete JSON")
	}
}

func TestIsRetryableGeminiError(t *testing.T) {
	retryable := genai.APIError{Code: 503, Status: "503 UNAVAILABLE", Message: "Service unavailable"}
	if !isRetryableGeminiError(retryable) {
		t.Fatal("expected 503 error to be retryable")
	}

	nonRetryable := errors.New("boom")
	if isRetryableGeminiError(nonRetryable) {
		t.Fatal("expected generic error to be non-retryable")
	}
}

func TestResponseTextRejectsMaxTokens(t *testing.T) {
	resp := &genai.GenerateContentResponse{
		Candidates: []*genai.Candidate{
			{
				FinishReason: genai.FinishReasonMaxTokens,
				Content: &genai.Content{
					Parts: []*genai.Part{{Text: "Jawaban kepotong"}},
				},
			},
		},
	}

	if _, err := responseText(resp); !errors.Is(err, errMaxTokens) {
		t.Fatalf("expected max tokens error, got %v", err)
	}
}

func TestResponseTextReturnsTrimmedText(t *testing.T) {
	resp := &genai.GenerateContentResponse{
		Candidates: []*genai.Candidate{
			{
				FinishReason: genai.FinishReasonStop,
				Content: &genai.Content{
					Parts: []*genai.Part{{Text: "  Jawaban lengkap.  "}},
				},
			},
		},
	}

	got, err := responseText(resp)
	if err != nil {
		t.Fatalf("responseText returned error: %v", err)
	}
	if got != "Jawaban lengkap." {
		t.Fatalf("unexpected text: %q", got)
	}
}

package gemini

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	googlegenai "google.golang.org/genai"
)

var errMaxTokens = errors.New("Gemini response reached max output tokens")
var errInvalidScheduleDates = errors.New("Gemini schedule contains dates outside the allowed range")
var errInvalidPracticeResponse = errors.New("Gemini practice response is invalid")
var errInvalidScheduleResponse = errors.New("Gemini schedule response is invalid")
var errGeminiQuotaExceeded = errors.New("Gemini quota exceeded")

func extractJSONDocument(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", errors.New("empty Gemini response")
	}

	if fenced := extractFencedBlock(trimmed); fenced != "" {
		trimmed = fenced
	}

	start, end, err := findJSONObjectBounds(trimmed)
	if err != nil {
		return "", err
	}

	return trimmed[start : end+1], nil
}

func extractFencedBlock(raw string) string {
	lines := strings.Split(raw, "\n")
	inFence := false
	var builder strings.Builder
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "```") {
			if inFence {
				break
			}
			inFence = true
			continue
		}
		if inFence {
			builder.WriteString(line)
			builder.WriteByte('\n')
		}
	}

	return strings.TrimSpace(builder.String())
}

func findJSONObjectBounds(raw string) (int, int, error) {
	start := strings.IndexAny(raw, "{[")
	if start == -1 {
		return -1, -1, errors.New("no JSON object found in Gemini response")
	}

	inString := false
	escaped := false
	depth := 0
	end := -1

	for i := start; i < len(raw); i++ {
		ch := raw[i]
		if inString {
			if escaped {
				escaped = false
				continue
			}
			switch ch {
			case '\\':
				escaped = true
			case '"':
				inString = false
			}
			continue
		}

		switch ch {
		case '"':
			inString = true
		case '{', '[':
			depth++
		case '}', ']':
			depth--
			if depth == 0 {
				end = i
				return start, end, nil
			}
		}
	}

	return -1, -1, errors.New("incomplete JSON object in Gemini response")
}

func decodeGeminiJSON(raw string, target any) error {
	jsonText, err := extractJSONDocument(raw)
	if err != nil {
		return err
	}

	dec := json.NewDecoder(bytes.NewBufferString(jsonText))
	dec.DisallowUnknownFields()
	if err := dec.Decode(target); err != nil {
		return fmt.Errorf("failed to parse Gemini response: %w\nResponse was: %s", err, jsonText)
	}
	return nil
}

func responseText(resp *googlegenai.GenerateContentResponse) (string, error) {
	if resp == nil {
		return "", errors.New("empty Gemini response")
	}

	text := strings.TrimSpace(resp.Text())
	if text == "" {
		return "", errors.New("empty Gemini response text")
	}

	if len(resp.Candidates) > 0 && resp.Candidates[0].FinishReason == googlegenai.FinishReasonMaxTokens {
		return "", errMaxTokens
	}

	return text, nil
}

func isRetryableGeminiError(err error) bool {
	var apiErr googlegenai.APIError
	if errors.As(err, &apiErr) {
		switch apiErr.Code {
		case 502, 503, 504:
			return true
		}

		status := strings.ToUpper(apiErr.Status)
		if strings.Contains(status, "UNAVAILABLE") || strings.Contains(status, "DEADLINE_EXCEEDED") || strings.Contains(status, "INTERNAL") {
			return true
		}
	}

	msg := strings.ToUpper(err.Error())
	return strings.Contains(msg, "UNAVAILABLE") || strings.Contains(msg, "DEADLINE_EXCEEDED") || strings.Contains(msg, "503")
}

func isGeminiQuotaExceededError(err error) bool {
	if err == nil {
		return false
	}

	var apiErr googlegenai.APIError
	if errors.As(err, &apiErr) {
		if apiErr.Code == 429 {
			return true
		}
		if strings.Contains(strings.ToUpper(apiErr.Status), "RESOURCE_EXHAUSTED") {
			return true
		}
	}

	msg := strings.ToUpper(err.Error())
	return strings.Contains(msg, "RESOURCE_EXHAUSTED") ||
		strings.Contains(msg, "QUOTA EXCEEDED") ||
		strings.Contains(msg, "generate_content_free_tier_requests")
}

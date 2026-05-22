package gemini

import (
	"testing"

	"google.golang.org/genai"
)

func TestGenerationConfigsSetTokenCaps(t *testing.T) {
	tests := []struct {
		name     string
		got      int32
		expected int32
	}{
		{name: "chat", got: chatGenerationConfig().MaxOutputTokens, expected: chatMaxOutputTokens},
		{name: "explain", got: explainGenerationConfig().MaxOutputTokens, expected: explainMaxOutputTokens},
		{name: "summary", got: summaryGenerationConfig().MaxOutputTokens, expected: summaryMaxOutputTokens},
		{name: "practice", got: practiceGenerationConfig().MaxOutputTokens, expected: practiceMaxOutputTokens},
		{name: "schedule", got: scheduleGenerationConfig().MaxOutputTokens, expected: scheduleMaxOutputTokens},
	}

	for _, tt := range tests {
		if tt.got != tt.expected {
			t.Fatalf("%s config expected %d, got %d", tt.name, tt.expected, tt.got)
		}
	}
}

func TestJSONGenerationConfigsUseJSONMimeType(t *testing.T) {
	tests := []struct {
		name   string
		config *genai.GenerateContentConfig
	}{
		{name: "practice", config: practiceGenerationConfig()},
		{name: "schedule", config: scheduleGenerationConfig()},
	}

	for _, tt := range tests {
		if tt.config.ResponseMIMEType != "application/json" {
			t.Fatalf("%s config expected application/json mime type, got %q", tt.name, tt.config.ResponseMIMEType)
		}
		if tt.config.ResponseJsonSchema == nil {
			t.Fatalf("%s config expected response schema", tt.name)
		}
	}
}

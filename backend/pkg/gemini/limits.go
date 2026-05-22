package gemini

import "google.golang.org/genai"

const (
	chatMaxOutputTokens     int32 = 640
	explainMaxOutputTokens  int32 = 2400
	summaryMaxOutputTokens  int32 = 2000
	practiceMaxOutputTokens int32 = 3200
	scheduleMaxOutputTokens int32 = 2200
)

func chatGenerationConfig() *genai.GenerateContentConfig {
	return &genai.GenerateContentConfig{
		MaxOutputTokens: chatMaxOutputTokens,
	}
}

func explainGenerationConfig() *genai.GenerateContentConfig {
	return &genai.GenerateContentConfig{
		MaxOutputTokens: explainMaxOutputTokens,
	}
}

func summaryGenerationConfig() *genai.GenerateContentConfig {
	return &genai.GenerateContentConfig{
		MaxOutputTokens: summaryMaxOutputTokens,
	}
}

func practiceGenerationConfig() *genai.GenerateContentConfig {
	return &genai.GenerateContentConfig{
		ResponseMIMEType:   "application/json",
		ResponseJsonSchema: practiceResponseJSONSchema(),
		MaxOutputTokens:    practiceMaxOutputTokens,
		Temperature:        float32Ptr(0),
	}
}

func scheduleGenerationConfig() *genai.GenerateContentConfig {
	return &genai.GenerateContentConfig{
		ResponseMIMEType:   "application/json",
		ResponseJsonSchema: scheduleResponseJSONSchema(),
		MaxOutputTokens:    scheduleMaxOutputTokens,
		Temperature:        float32Ptr(0),
	}
}

func float32Ptr(value float32) *float32 {
	return &value
}

func practiceResponseJSONSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"questions": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"question": map[string]any{"type": "string"},
						"options": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"A": map[string]any{"type": "string"},
								"B": map[string]any{"type": "string"},
								"C": map[string]any{"type": "string"},
								"D": map[string]any{"type": "string"},
							},
							"required":             []string{"A", "B", "C", "D"},
							"additionalProperties": false,
						},
						"correct_answer": map[string]any{"type": "string"},
						"explanation":    map[string]any{"type": "string"},
					},
					"required":             []string{"question", "options", "correct_answer", "explanation"},
					"additionalProperties": false,
				},
			},
		},
		"required":             []string{"questions"},
		"additionalProperties": false,
	}
}

func scheduleResponseJSONSchema() map[string]any {
	return map[string]any{
		"type": "object",
		"properties": map[string]any{
			"schedule": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "object",
					"properties": map[string]any{
						"date": map[string]any{"type": "string"},
						"sessions": map[string]any{
							"type": "array",
							"items": map[string]any{
								"type": "object",
								"properties": map[string]any{
									"subject":          map[string]any{"type": "string"},
									"duration_minutes": map[string]any{"type": "integer"},
									"topic":            map[string]any{"type": "string"},
								},
								"required":             []string{"subject", "duration_minutes", "topic"},
								"additionalProperties": false,
							},
						},
					},
					"required":             []string{"date", "sessions"},
					"additionalProperties": false,
				},
			},
			"tips": map[string]any{
				"type":  "array",
				"items": map[string]any{"type": "string"},
			},
		},
		"required":             []string{"schedule", "tips"},
		"additionalProperties": false,
	}
}

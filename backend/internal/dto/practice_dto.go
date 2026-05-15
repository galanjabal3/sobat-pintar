package dto

import "sobat-pintar/internal/model"

type StartPracticeRequest struct {
	Subject    string `json:"subject" binding:"required"`
	Difficulty string `json:"difficulty" binding:"required"`
	Level      string `json:"level" binding:"required"` // TK, SD, SMP, SMA
}

type StartPracticeResponse struct {
	SessionID string            `json:"session_id"`
	Questions []*model.Question `json:"questions"`
}

type SubmitAnswerRequest struct {
	QuestionID string `json:"question_id" binding:"required"`
	Answer     string `json:"answer" binding:"required"`
}

type SubmitAnswerResponse struct {
	IsCorrect   bool   `json:"is_correct"`
	Explanation string `json:"explanation"`
}

type PracticeResultResponse struct {
	SessionID   string            `json:"session_id"`
	Subject     string            `json:"subject"`
	Difficulty  string            `json:"difficulty"`
	Score       int               `json:"score"`
	TotalQuestions int             `json:"total_questions"`
	CorrectAnswers int             `json:"correct_answers"`
	Questions   []*model.Question `json:"questions"`
}

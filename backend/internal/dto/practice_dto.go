package dto

import "sobat-pintar/internal/model"

type StartPracticeRequest struct {
	Subject       string `json:"subject" binding:"required"`
	Difficulty    string `json:"difficulty" binding:"required"`
	Level         string `json:"level" binding:"required"` // TK, SD, SMP, SMA
	SourceContent string `json:"source_content,omitempty"`
	QuestionCount int    `json:"question_count,omitempty"`
}

type StartPracticeResponse struct {
	SessionID string                      `json:"session_id"`
	Questions []*PracticeQuestionResponse `json:"questions"`
}

type PracticeQuestionResponse struct {
	ID            string                `json:"id"`
	SessionID     string                `json:"session_id"`
	QuestionText  string                `json:"question_text"`
	Options       model.QuestionOptions `json:"options"`
	UserAnswer    *string               `json:"user_answer,omitempty"`
	IsCorrect     *bool                 `json:"is_correct,omitempty"`
	Explanation   string                `json:"explanation,omitempty"`
	CorrectAnswer string                `json:"correct_answer,omitempty"`
}

type PracticeSessionResponse struct {
	SessionID   string                      `json:"session_id"`
	Subject     string                      `json:"subject"`
	Difficulty  string                      `json:"difficulty"`
	IsCompleted bool                        `json:"is_completed"`
	Questions   []*PracticeQuestionResponse `json:"questions"`
}

type SubmitAnswerRequest struct {
	QuestionID string `json:"question_id" binding:"required"`
	Answer     string `json:"answer" binding:"required"`
}

type SubmitAnswerResponse struct {
	IsCorrect     bool   `json:"is_correct"`
	Explanation   string `json:"explanation"`
	CorrectAnswer string `json:"correct_answer"`
}

type PracticeResultResponse struct {
	SessionID      string            `json:"session_id"`
	Subject        string            `json:"subject"`
	Difficulty     string            `json:"difficulty"`
	Score          int               `json:"score"`
	TotalQuestions int               `json:"total_questions"`
	CorrectAnswers int               `json:"correct_answers"`
	Questions      []*model.Question `json:"questions"`
}

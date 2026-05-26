package model

import "time"

type Explanation struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	QuestionText string    `json:"question_text"`
	ImageURL     string    `json:"image_url"`
	Level        string    `json:"level"`
	Answer       string    `json:"answer"`
	ShareToken   *string   `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

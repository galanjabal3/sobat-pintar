package model

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type PracticeSession struct {
	ID          string         `json:"id" db:"id"`
	UserID      string         `json:"user_id" db:"user_id"`
	Subject     string         `json:"subject" db:"subject"`
	Difficulty  string         `json:"difficulty" db:"difficulty"`
	Score       sql.NullInt64  `json:"score" db:"score"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
	CompletedAt *time.Time     `json:"completed_at,omitempty" db:"completed_at"`
}

type QuestionOptions map[string]string

// Value implements the driver.Valuer interface
func (o QuestionOptions) Value() (driver.Value, error) {
	return json.Marshal(o)
}

// Scan implements the sql.Scanner interface
func (o *QuestionOptions) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &o)
}

type Question struct {
	ID            string          `json:"id" db:"id"`
	SessionID     string          `json:"session_id" db:"session_id"`
	QuestionText  string          `json:"question_text" db:"question_text"`
	Options       QuestionOptions `json:"options" db:"options"`
	CorrectAnswer string          `json:"correct_answer" db:"correct_answer"`
	UserAnswer    *string         `json:"user_answer,omitempty" db:"user_answer"`
	IsCorrect     *bool           `json:"is_correct,omitempty" db:"is_correct"`
	Explanation   string          `json:"explanation" db:"explanation"`
}

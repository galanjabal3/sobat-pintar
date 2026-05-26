package service

import (
	"errors"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"sobat-pintar/pkg/gemini"
)

const (
	MaxChatMessageChars    = 2000
	MaxChatHistoryMessages = 12

	MaxExplainQuestionChars = 3000

	MaxSummaryContentChars = 8000

	MaxPracticeSubjectChars       = 120
	MinPracticeSourceContentChars = 80
	MaxPracticeSourceContentChars = 5000
	DefaultPracticeQuestionCount  = 5
	MaxPracticeQuestionCount      = 15

	MaxScheduleSubjectCount = 8
	MaxScheduleSubjectChars = 120

	ChatDailyQuota     = 5
	ExplainDailyQuota  = 2
	SummaryDailyQuota  = 1
	PracticeDailyQuota = 2
	ScheduleDailyQuota = 1
)

var aiDailyQuotaLimits = map[string]int{
	AIFeatureChat:     ChatDailyQuota,
	AIFeatureExplain:  ExplainDailyQuota,
	AIFeatureSummary:  SummaryDailyQuota,
	AIFeaturePractice: PracticeDailyQuota,
	AIFeatureSchedule: ScheduleDailyQuota,
}

var (
	ErrChatMessageRequired      = errors.New("chat message is required")
	ErrChatMessageTooLong       = errors.New("chat message exceeds maximum length")
	ErrExplainInputRequired     = errors.New("explain input is required")
	ErrExplainQuestionTooLong   = errors.New("explain question exceeds maximum length")
	ErrExplainImageURLInvalid   = errors.New("explain image URL is invalid")
	ErrSummaryContentRequired   = errors.New("summary content is required")
	ErrSummaryContentTooLong    = errors.New("summary content exceeds maximum length")
	ErrSummaryImageURLInvalid   = errors.New("summary image URL is invalid")
	ErrPracticeSubjectRequired  = errors.New("practice subject is required")
	ErrPracticeSubjectTooLong   = errors.New("practice subject exceeds maximum length")
	ErrPracticeSourceTooShort   = errors.New("practice source content is too short")
	ErrPracticeSourceTooLong    = errors.New("practice source content exceeds maximum length")
	ErrPracticeQuestionCount    = errors.New("practice question count is invalid")
	ErrScheduleSubjectsRequired = errors.New("schedule subjects are required")
	ErrScheduleTooManySubjects  = errors.New("schedule has too many subjects")
	ErrScheduleSubjectTooLong   = errors.New("schedule subject exceeds maximum length")
	ErrScheduleExamDatePast     = errors.New("schedule exam date cannot be in the past")
)

func validateChatMessage(message string) error {
	text := strings.TrimSpace(message)
	if text == "" {
		return ErrChatMessageRequired
	}
	if runeLen(text) > MaxChatMessageChars {
		return ErrChatMessageTooLong
	}
	return nil
}

func validateExplainRequest(question, imageURL string) error {
	if strings.TrimSpace(question) == "" && strings.TrimSpace(imageURL) == "" {
		return ErrExplainInputRequired
	}
	if strings.TrimSpace(question) != "" && runeLen(question) > MaxExplainQuestionChars {
		return ErrExplainQuestionTooLong
	}
	if strings.TrimSpace(imageURL) != "" {
		if !isValidUploadedImageURL(imageURL) {
			return ErrExplainImageURLInvalid
		}
	}
	return nil
}

func validateSummaryContent(content string) error {
	text := strings.TrimSpace(content)
	if text == "" {
		return ErrSummaryContentRequired
	}
	if runeLen(text) > MaxSummaryContentChars {
		return ErrSummaryContentTooLong
	}
	return nil
}

func validateSummaryImageURL(rawURL string) error {
	if !isValidUploadedImageURL(rawURL) {
		return ErrSummaryImageURLInvalid
	}
	return nil
}

func isValidUploadedImageURL(rawURL string) bool {
	parsedURL, err := url.Parse(strings.TrimSpace(rawURL))
	if err != nil || parsedURL.Scheme != "https" || parsedURL.Hostname() != "res.cloudinary.com" || parsedURL.Path == "" {
		return false
	}
	return true
}

func validatePracticeSubject(subject string) error {
	text := strings.TrimSpace(subject)
	if text == "" {
		return ErrPracticeSubjectRequired
	}
	if runeLen(text) > MaxPracticeSubjectChars {
		return ErrPracticeSubjectTooLong
	}
	return nil
}

func validatePracticeSourceContent(content string) error {
	text := strings.TrimSpace(content)
	if text == "" {
		return nil
	}
	if runeLen(text) < MinPracticeSourceContentChars {
		return ErrPracticeSourceTooShort
	}
	if runeLen(text) > MaxPracticeSourceContentChars {
		return ErrPracticeSourceTooLong
	}
	return nil
}

func normalizePracticeQuestionCount(count int) (int, error) {
	if count == 0 {
		return DefaultPracticeQuestionCount, nil
	}
	switch count {
	case 5, 10, MaxPracticeQuestionCount:
		return count, nil
	default:
		return 0, ErrPracticeQuestionCount
	}
}

func validateScheduleSubjects(subjects []string) error {
	if len(subjects) == 0 {
		return ErrScheduleSubjectsRequired
	}
	if len(subjects) > MaxScheduleSubjectCount {
		return ErrScheduleTooManySubjects
	}
	for _, subject := range subjects {
		if runeLen(subject) > MaxScheduleSubjectChars {
			return ErrScheduleSubjectTooLong
		}
	}
	return nil
}

func validateScheduleExamDates(examDates []time.Time) error {
	today := todayInLocation("Asia/Jakarta")
	for _, examDate := range examDates {
		if dateOnlyInLocation(examDate, today.Location()).Before(today) {
			return ErrScheduleExamDatePast
		}
	}
	return nil
}

func todayInLocation(locationName string) time.Time {
	location, err := time.LoadLocation(locationName)
	if err != nil {
		location = time.FixedZone("WIB", 7*60*60)
	}
	now := time.Now().In(location)
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, location)
}

func dateOnlyInLocation(value time.Time, location *time.Location) time.Time {
	localValue := value.In(location)
	return time.Date(localValue.Year(), localValue.Month(), localValue.Day(), 0, 0, 0, 0, location)
}

func trimChatHistory(history []gemini.HistoryMessage, maxMessages int) []gemini.HistoryMessage {
	if maxMessages <= 0 || len(history) <= maxMessages {
		return history
	}
	return history[len(history)-maxMessages:]
}

func runeLen(value string) int {
	return utf8.RuneCountInString(value)
}

func dailyQuotaLimit(feature string) int {
	return aiDailyQuotaLimits[feature]
}

func dailyQuotaFeatures() []string {
	return []string{
		AIFeatureChat,
		AIFeatureExplain,
		AIFeatureSummary,
		AIFeaturePractice,
		AIFeatureSchedule,
	}
}

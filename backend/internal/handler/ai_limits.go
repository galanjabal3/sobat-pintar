package handler

import (
	"errors"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

func writeAIValidationError(c *gin.Context, err error) bool {
	switch {
	case errors.Is(err, service.ErrChatMessageRequired):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Pesan tidak boleh kosong"})
	case errors.Is(err, service.ErrChatMessageTooLong):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Pesan terlalu panjang. Maksimal 2000 karakter"})
	case errors.Is(err, service.ErrExplainInputRequired):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Berikan pertanyaan teks atau foto soal ya"})
	case errors.Is(err, service.ErrExplainQuestionTooLong):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Pertanyaan terlalu panjang. Maksimal 3000 karakter"})
	case errors.Is(err, service.ErrSummaryContentRequired):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Materi tidak boleh kosong"})
	case errors.Is(err, service.ErrSummaryContentTooLong):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Materi terlalu panjang. Maksimal 8000 karakter"})
	case errors.Is(err, service.ErrPracticeSubjectRequired):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Mata pelajaran tidak boleh kosong"})
	case errors.Is(err, service.ErrPracticeSubjectTooLong):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Nama mata pelajaran terlalu panjang. Maksimal 120 karakter"})
	case errors.Is(err, service.ErrPracticeSourceTooShort):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Materi terlalu pendek. Minimal 80 karakter"})
	case errors.Is(err, service.ErrPracticeSourceTooLong):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Materi terlalu panjang. Maksimal 5000 karakter"})
	case errors.Is(err, service.ErrScheduleSubjectsRequired):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Mata pelajaran tidak boleh kosong"})
	case errors.Is(err, service.ErrScheduleTooManySubjects):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Terlalu banyak mata pelajaran. Maksimal 8 mapel"})
	case errors.Is(err, service.ErrScheduleSubjectTooLong):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Nama mata pelajaran terlalu panjang. Maksimal 120 karakter"})
	case errors.Is(err, service.ErrScheduleExamDatePast):
		c.JSON(400, dto.ErrorResponse{Success: false, Message: "Tanggal ujian tidak boleh di masa lalu"})
	default:
		return false
	}

	return true
}

func writeAIQuotaError(c *gin.Context, err error) bool {
	var quotaErr *service.QuotaExceededError
	if !errors.As(err, &quotaErr) {
		return false
	}

	switch quotaErr.Feature {
	case service.AIFeatureChat:
		c.JSON(429, dto.FailureResponse("Kuota chat harian sudah habis. Coba lagi besok ya."))
	case service.AIFeatureExplain:
		c.JSON(429, dto.FailureResponse("Kuota Jelasin Sobi harian sudah habis. Coba lagi besok ya."))
	case service.AIFeatureSummary:
		c.JSON(429, dto.FailureResponse("Kuota rangkuman harian sudah habis. Coba lagi besok ya."))
	case service.AIFeaturePractice:
		c.JSON(429, dto.FailureResponse("Kuota latihan harian sudah habis. Coba lagi besok ya."))
	case service.AIFeatureSchedule:
		c.JSON(429, dto.FailureResponse("Kuota jadwal belajar harian sudah habis. Coba lagi besok ya."))
	default:
		c.JSON(429, dto.FailureResponse("Kuota harian sudah habis. Coba lagi besok ya."))
	}

	return true
}

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type PracticeHandler struct {
	service service.PracticeService
}

func NewPracticeHandler(service service.PracticeService) *PracticeHandler {
	return &PracticeHandler{service: service}
}

func (h *PracticeHandler) StartSession(c *gin.Context) {
	userID := c.GetString("user_id")
	level := c.GetString("level")

	var req dto.StartPracticeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}

	if level == "" {
		level = req.Level
	}

	res, err := h.service.StartSession(c.Request.Context(), userID, level, req)
	if err != nil {
		if writeAIValidationError(c, err) {
			return
		}
		if writeAIQuotaError(c, err) {
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal membuat sesi latihan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.BaseResponse{
		Success: true,
		Message: "Sesi latihan berhasil dimulai",
		Data:    res,
	})
}

func (h *PracticeHandler) SubmitAnswer(c *gin.Context) {
	userID := c.GetString("user_id")
	questionID := c.Param("id")

	var req dto.SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}
	req.QuestionID = questionID

	res, err := h.service.SubmitAnswer(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengirim jawaban",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Jawaban berhasil diproses",
		Data:    res,
	})
}

func (h *PracticeHandler) GetSession(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("id")

	res, err := h.service.GetSession(c.Request.Context(), userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil sesi latihan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Sesi latihan berhasil diambil",
		Data:    res,
	})
}

func (h *PracticeHandler) GetResult(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("id")

	res, err := h.service.GetResult(c.Request.Context(), userID, sessionID)
	if err != nil {
		if err.Error() == "practice session is not complete" {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Success: false,
				Message: "Selesaikan semua soal dulu ya.",
				Error:   err.Error(),
			})
			return
		}

		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil hasil latihan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Hasil latihan berhasil diambil",
		Data:    res,
	})
}

func (h *PracticeHandler) FinishSession(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("id")

	res, err := h.service.FinishSession(c.Request.Context(), userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal menyelesaikan latihan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Latihan berhasil diselesaikan",
		Data:    res,
	})
}

func (h *PracticeHandler) GetHistory(c *gin.Context) {
	userID := c.GetString("user_id")

	res, err := h.service.GetHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil riwayat latihan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Riwayat latihan berhasil diambil",
		Data:    res,
	})
}

func (h *PracticeHandler) GetDailyProgress(c *gin.Context) {
	userID := c.GetString("user_id")

	count, err := h.service.GetDailyProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil progress harian",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Progress harian berhasil diambil",
		Data:    map[string]int{"count": count},
	})
}

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type ExplainHandler struct {
	service service.ExplainService
}

func NewExplainHandler(service service.ExplainService) *ExplainHandler {
	return &ExplainHandler{service: service}
}

func (h *ExplainHandler) Explain(c *gin.Context) {
	var req dto.ExplainRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}

	// Validate that at least one of question or image_url is provided
	if req.Question == "" && req.ImageURL == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Berikan pertanyaan teks atau foto soal ya",
		})
		return
	}

	// Fallback level if not provided
	if req.Level == "" {
		req.Level = c.GetString("level")
	}
	if req.Level == "" {
		req.Level = "SD"
	}

	userID := c.GetString("user_id")
	explanation, err := h.service.Explain(c.Request.Context(), userID, req.Question, req.ImageURL, req.Level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Sobi gagal memproses pertanyaanmu",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Penjelasan berhasil dibuat",
		Data: dto.ExplainResponse{
			ID:       explanation.ID,
			Question: explanation.QuestionText,
			ImageURL: explanation.ImageURL,
			Answer:   explanation.Answer,
			Level:    explanation.Level,
		},
	})
}

func (h *ExplainHandler) GetHistory(c *gin.Context) {
	userID := c.GetString("user_id")
	history, err := h.service.GetHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil riwayat",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Riwayat berhasil diambil",
		Data:    history,
	})
}

func (h *ExplainHandler) GetPublicExplanation(c *gin.Context) {
	id := c.Param("id")
	explanation, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Message: "Penjelasan tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Penjelasan berhasil diambil",
		Data: dto.ExplainResponse{
			ID:       explanation.ID,
			Question: explanation.QuestionText,
			ImageURL: explanation.ImageURL,
			Answer:   explanation.Answer,
			Level:    explanation.Level,
		},
	})
}

func (h *ExplainHandler) GetExplanation(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	explanation, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Message: "Penjelasan tidak ditemukan",
		})
		return
	}

	if explanation.UserID != userID {
		c.JSON(http.StatusForbidden, dto.ErrorResponse{
			Success: false,
			Message: "Kamu tidak punya akses ke penjelasan ini",
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Penjelasan berhasil diambil",
		Data: dto.ExplainResponse{
			ID:       explanation.ID,
			Question: explanation.QuestionText,
			ImageURL: explanation.ImageURL,
			Answer:   explanation.Answer,
			Level:    explanation.Level,
		},
	})
}

func (h *ExplainHandler) ReExplain(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString("user_id")

	explanation, err := h.service.ReExplain(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Sobi gagal menjelaskan ulang",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Penjelasan ulang berhasil",
		Data: dto.ExplainResponse{
			ID:       explanation.ID,
			Question: explanation.QuestionText,
			ImageURL: explanation.ImageURL,
			Answer:   explanation.Answer,
			Level:    explanation.Level,
		},
	})
}

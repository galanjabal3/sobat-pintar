package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type SummaryHandler struct {
	service service.SummaryService
}

func NewSummaryHandler(service service.SummaryService) *SummaryHandler {
	return &SummaryHandler{service: service}
}

func (h *SummaryHandler) CreateSummary(c *gin.Context) {
	userID := c.GetString("user_id")
	level := c.GetString("level")

	var req dto.CreateSummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}

	res, err := h.service.CreateSummary(c.Request.Context(), userID, level, req)
	if err != nil {
		if writeAIValidationError(c, err) {
			return
		}
		if writeAIQuotaError(c, err) {
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal membuat rangkuman",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.BaseResponse{
		Success: true,
		Message: "Rangkuman berhasil dibuat",
		Data:    res,
	})
}

func (h *SummaryHandler) GetHistory(c *gin.Context) {
	userID := c.GetString("user_id")
	res, err := h.service.ListHistory(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil riwayat rangkuman",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Riwayat rangkuman berhasil diambil",
		Data:    res,
	})
}

func (h *SummaryHandler) GetSummary(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	res, err := h.service.GetSummaryByID(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil detail rangkuman",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Detail rangkuman berhasil diambil",
		Data:    res,
	})
}

func (h *SummaryHandler) GetPublicSummary(c *gin.Context) {
	id := c.Param("id")

	res, err := h.service.GetPublicSummaryByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Message: "Rangkuman tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Rangkuman berhasil diambil",
		Data:    res,
	})
}

func (h *SummaryHandler) DeleteSummary(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	err := h.service.DeleteSummary(c.Request.Context(), id, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal menghapus rangkuman",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Rangkuman berhasil dihapus",
	})
}

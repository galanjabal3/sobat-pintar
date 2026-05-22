package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type ScheduleHandler struct {
	service service.ScheduleService
}

func NewScheduleHandler(service service.ScheduleService) *ScheduleHandler {
	return &ScheduleHandler{service: service}
}

func (h *ScheduleHandler) GenerateSchedule(c *gin.Context) {
	userID := c.GetString("user_id")
	level := c.GetString("level")

	var req dto.GenerateScheduleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}

	res, err := h.service.GenerateSchedule(c.Request.Context(), userID, level, req)
	if err != nil {
		if writeAIValidationError(c, err) {
			return
		}
		if writeAIQuotaError(c, err) {
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal membuat jadwal belajar",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Jadwal belajar berhasil dibuat",
		Data:    res,
	})
}

func (h *ScheduleHandler) GetSchedules(c *gin.Context) {
	userID := c.GetString("user_id")
	res, err := h.service.GetSchedules(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil jadwal belajar",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Jadwal belajar berhasil diambil",
		Data:    res,
	})
}

func (h *ScheduleHandler) GetSchedule(c *gin.Context) {
	userID := c.GetString("user_id")
	id := c.Param("id")

	res, err := h.service.GetScheduleByID(c.Request.Context(), userID, id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{
			Success: false,
			Message: "Jadwal belajar tidak ditemukan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Jadwal belajar berhasil diambil",
		Data:    res,
	})
}

package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type AIHandler struct {
	quotaService service.AIQuotaService
}

func NewAIHandler(quotaService service.AIQuotaService) *AIHandler {
	return &AIHandler{quotaService: quotaService}
}

func (h *AIHandler) GetUsage(c *gin.Context) {
	userID := c.GetString("user_id")
	res, err := h.quotaService.GetDailyUsage(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil sisa limit AI",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Sisa limit AI berhasil diambil",
		Data:    res,
	})
}

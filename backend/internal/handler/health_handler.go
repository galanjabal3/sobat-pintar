package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, dto.SuccessResponse("Sobat Pintar API is running", map[string]string{"status": "ok"}))
}

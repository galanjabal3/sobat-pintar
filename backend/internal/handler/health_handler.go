package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/dto"
)

type HealthHandler struct {
	db *pgxpool.Pool
}

func NewHealthHandler(db *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{db: db}
}

func (h *HealthHandler) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	if h.db == nil || h.db.Ping(ctx) != nil {
		c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{
			Success: false,
			Message: "Layanan belum siap",
		})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse("Sobat Pintar API is running", map[string]string{"status": "ok"}))
}

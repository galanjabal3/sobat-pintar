package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type GamificationHandler struct {
	service service.GamificationService
}

func NewGamificationHandler(service service.GamificationService) *GamificationHandler {
	return &GamificationHandler{service: service}
}

func (h *GamificationHandler) GetPoints(c *gin.Context) {
	userID := c.GetString("user_id")
	points, err := h.service.GetUserPoints(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil poin",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Poin berhasil diambil",
		Data:    gin.H{"points": points},
	})
}

func (h *GamificationHandler) GetBadges(c *gin.Context) {
	userID := c.GetString("user_id")
	badges, err := h.service.ListBadges(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil badge",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Daftar badge berhasil diambil",
		Data:    badges,
	})
}

func (h *GamificationHandler) GetLeaderboard(c *gin.Context) {
	leaderboard, err := h.service.GetLeaderboard(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil leaderboard",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Leaderboard berhasil diambil",
		Data:    leaderboard,
	})
}

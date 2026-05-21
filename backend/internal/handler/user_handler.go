package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type UserHandler struct {
	service service.UserService
}

func NewUserHandler(service service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.service.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.FailureResponse("Gagal mengambil profil", err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse("Profil berhasil diambil", user))
}

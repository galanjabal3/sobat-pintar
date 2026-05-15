package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
	"sobat-pintar/pkg/logger"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(c *gin.Context) {
	logger.Info("Register request received")
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}

	user, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Password, req.Level)
	if err != nil {
		logger.Error(err, "Failed to register user in service")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal melakukan pendaftaran",
			Error:   err.Error(),
		})
		return
	}
	logger.Info("User registered successfully in service", "user_id", user.ID)

	c.JSON(http.StatusCreated, dto.BaseResponse{
		Success: true,
		Message: "Pendaftaran berhasil",
		Data: dto.UserResponse{
			ID:     user.ID,
			Name:   user.Name,
			Email:  user.Email,
			Level:  user.Level,
			Points: user.Points,
			Streak: user.Streak,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Email atau password tidak valid",
			Error:   err.Error(),
		})
		return
	}

	at, rt, user, err := h.authService.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Message: "Email atau password salah",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Login berhasil",
		Data: dto.AuthResponse{
			AccessToken:  at,
			RefreshToken: rt,
			User: dto.UserResponse{
				ID:     user.ID,
				Name:   user.Name,
				Email:  user.Email,
				Level:  user.Level,
				Points: user.Points,
				Streak: user.Streak,
			},
		},
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	user, err := h.authService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil profil",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Profil berhasil diambil",
		Data: dto.UserResponse{
			ID:     user.ID,
			Name:   user.Name,
			Email:  user.Email,
			Level:  user.Level,
			Points: user.Points,
			Streak: user.Streak,
		},
	})
}

package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/service"
	"sobat-pintar/pkg/logger"
)

type AuthHandler struct {
	authService      service.AuthService
	secureCookies    bool
	accessCookieTTL  time.Duration
	refreshCookieTTL time.Duration
}

const (
	accessTokenCookieName  = "sobat_access_token"
	refreshTokenCookieName = "sobat_refresh_token"
)

func NewAuthHandler(authService service.AuthService, secureCookies bool, accessCookieTTL, refreshCookieTTL time.Duration) *AuthHandler {
	return &AuthHandler{
		authService:      authService,
		secureCookies:    secureCookies,
		accessCookieTTL:  accessCookieTTL,
		refreshCookieTTL: refreshCookieTTL,
	}
}

func (h *AuthHandler) setAuthCookies(c *gin.Context, accessToken, refreshToken string) {
	h.setCookieSameSite(c)
	c.SetCookie(accessTokenCookieName, accessToken, int(h.accessCookieTTL.Seconds()), "/api/v1", "", h.secureCookies, true)
	c.SetCookie(refreshTokenCookieName, refreshToken, int(h.refreshCookieTTL.Seconds()), "/api/v1/auth", "", h.secureCookies, true)
}

func (h *AuthHandler) setAccessCookie(c *gin.Context, accessToken string) {
	h.setCookieSameSite(c)
	c.SetCookie(accessTokenCookieName, accessToken, int(h.accessCookieTTL.Seconds()), "/api/v1", "", h.secureCookies, true)
}

func (h *AuthHandler) clearAuthCookies(c *gin.Context) {
	h.setCookieSameSite(c)
	c.SetCookie(accessTokenCookieName, "", -1, "/api/v1", "", h.secureCookies, true)
	c.SetCookie(refreshTokenCookieName, "", -1, "/api/v1/auth", "", h.secureCookies, true)
}

func (h *AuthHandler) setCookieSameSite(c *gin.Context) {
	if h.secureCookies {
		c.SetSameSite(http.SameSiteNoneMode)
		return
	}
	c.SetSameSite(http.SameSiteLaxMode)
}

func toUserResponse(user *model.User) dto.UserResponse {
	return dto.UserResponse{
		ID:             user.ID,
		Name:           user.Name,
		Email:          user.Email,
		Level:          user.Level,
		EmailVerified:  user.EmailVerified,
		AvatarURL:      user.AvatarURL,
		AvatarPublicID: user.AvatarPublicID,
		Points:         user.Points,
		Streak:         user.Streak,
	}
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

	user, sent, err := h.authService.Register(c.Request.Context(), req.Name, req.Email, req.Password, req.Level)
	if err != nil {
		if errors.Is(err, service.ErrEmailAlreadyRegistered) {
			c.JSON(http.StatusConflict, dto.ErrorResponse{
				Success: false,
				Message: "Email sudah terdaftar. Coba masuk atau gunakan email lain.",
				Error:   err.Error(),
			})
			return
		}
		logger.Error(err, "Failed to register user in service")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal melakukan pendaftaran",
			Error:   err.Error(),
		})
		return
	}
	logger.Info("User registered successfully in service", "user_id", user.ID)
	if !sent {
		logger.Info("Verification email was not sent during register", "user_id", user.ID, "email", user.Email)
	}

	c.JSON(http.StatusCreated, dto.BaseResponse{
		Success: true,
		Message: func() string {
			if sent {
				return "Pendaftaran berhasil. Cek email untuk verifikasi akunmu."
			}
			return "Pendaftaran berhasil, tapi email verifikasi belum terkirim. Coba kirim ulang dari halaman verifikasi."
		}(),
		Data: dto.RegisterResponse{
			User:               toUserResponse(user),
			VerificationSent:   sent,
			VerificationNeeded: true,
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
		if errors.Is(err, service.ErrEmailNotVerified) {
			c.JSON(http.StatusForbidden, dto.ErrorResponse{
				Success: false,
				Message: "Email belum diverifikasi. Cek inbox atau kirim ulang email verifikasi.",
				Error:   err.Error(),
			})
			return
		}
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Message: "Email atau password salah",
			Error:   err.Error(),
		})
		return
	}
	h.setAuthCookies(c, at, rt)

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Login berhasil",
		Data: dto.AuthResponse{
			User: toUserResponse(user),
		},
	})
}

func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	var req dto.VerifyEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Token verifikasi tidak valid",
			Error:   err.Error(),
		})
		return
	}

	user, err := h.authService.VerifyEmail(c.Request.Context(), req.Token)
	if err != nil {
		if errors.Is(err, service.ErrVerificationTokenInvalid) || errors.Is(err, service.ErrVerificationTokenExpired) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Success: false,
				Message: "Link verifikasi tidak valid atau sudah kedaluwarsa",
				Error:   err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal memverifikasi email",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Email berhasil diverifikasi",
		Data:    toUserResponse(user),
	})
}

func (h *AuthHandler) ResendVerificationEmail(c *gin.Context) {
	var req dto.ResendVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Email tidak valid",
			Error:   err.Error(),
		})
		return
	}

	_, err := h.authService.ResendVerificationEmail(c.Request.Context(), req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengirim ulang email verifikasi",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Jika email terdaftar dan belum diverifikasi, link verifikasi akan dikirim.",
		Data:    gin.H{"accepted": true},
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
		Data:    toUserResponse(user),
	})
}

func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Data profil tidak valid",
			Error:   err.Error(),
		})
		return
	}

	user, err := h.authService.UpdateProfile(c.Request.Context(), userID, req.Name, req.Level, req.AvatarURL, req.AvatarPublicID)
	if err != nil {
		if errors.Is(err, service.ErrAvatarNotOwned) {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Success: false,
				Message: "Foto profil tidak valid. Unggah ulang fotonya ya.",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal memperbarui profil",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Profil berhasil diperbarui",
		Data:    toUserResponse(user),
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if c.Request.ContentLength != 0 {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Success: false,
				Message: "Refresh token tidak valid",
				Error:   err.Error(),
			})
			return
		}
	}
	if req.RefreshToken == "" {
		if refreshToken, err := c.Cookie(refreshTokenCookieName); err == nil {
			req.RefreshToken = refreshToken
		}
	}
	if req.RefreshToken == "" {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Refresh token tidak valid",
		})
		return
	}

	accessToken, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Message: "Sesi telah berakhir, silakan login kembali",
			Error:   err.Error(),
		})
		return
	}
	h.setAccessCookie(c, accessToken)

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Token berhasil diperbarui",
		Data:    dto.RefreshResponse{Refreshed: true},
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	h.clearAuthCookies(c)
	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Logout berhasil",
		Data:    gin.H{"logged_out": true},
	})
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	var req dto.GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil || (req.AuthorizationCode == "" && req.IDToken == "") {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Autentikasi Google tidak valid",
		})
		return
	}
	if req.AuthorizationCode != "" {
		requestOrigin := c.GetHeader("Origin")
		if c.GetHeader("X-Requested-With") != "XMLHttpRequest" || req.RedirectURI != requestOrigin {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{
				Success: false,
				Message: "Autentikasi Google tidak valid",
			})
			return
		}
	}

	var at, rt string
	var user *model.User
	var err error
	if req.AuthorizationCode != "" {
		at, rt, user, err = h.authService.GoogleCodeLogin(c.Request.Context(), req.AuthorizationCode, req.RedirectURI)
	} else {
		at, rt, user, err = h.authService.GoogleLogin(c.Request.Context(), req.IDToken)
	}
	if err != nil {
		c.JSON(http.StatusUnauthorized, dto.ErrorResponse{
			Success: false,
			Message: "Gagal login dengan Google",
			Error:   err.Error(),
		})
		return
	}
	h.setAuthCookies(c, at, rt)

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Login Google berhasil",
		Data: dto.AuthResponse{
			User: toUserResponse(user),
		},
	})
}

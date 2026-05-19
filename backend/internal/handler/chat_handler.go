package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type ChatHandler struct {
	chatService service.ChatService
}

func NewChatHandler(chatService service.ChatService) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

func (h *ChatHandler) CreateSession(c *gin.Context) {
	userID := c.GetString("user_id")
	var req dto.CreateChatSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}
	if req.Level == "" {
		req.Level = c.GetString("level")
	}

	res, err := h.chatService.CreateSession(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal membuat sesi chat",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, dto.BaseResponse{
		Success: true,
		Message: "Sesi chat berhasil dibuat",
		Data:    res,
	})
}

func (h *ChatHandler) ListSessions(c *gin.Context) {
	userID := c.GetString("user_id")
	res, err := h.chatService.ListSessions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil daftar chat",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Daftar chat berhasil diambil",
		Data:    res,
	})
}

func (h *ChatHandler) GetSession(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("id")

	res, err := h.chatService.GetSessionDetail(c.Request.Context(), userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil detail chat",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Detail chat berhasil diambil",
		Data:    res,
	})
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("id")

	var req dto.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Format data tidak valid",
			Error:   err.Error(),
		})
		return
	}

	res, err := h.chatService.SendMessage(c.Request.Context(), userID, sessionID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengirim pesan",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Pesan berhasil dikirim",
		Data:    res,
	})
}

func (h *ChatHandler) DeleteSession(c *gin.Context) {
	userID := c.GetString("user_id")
	sessionID := c.Param("id")

	err := h.chatService.DeleteSession(c.Request.Context(), userID, sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal menghapus sesi chat",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Sesi chat berhasil dihapus",
	})
}

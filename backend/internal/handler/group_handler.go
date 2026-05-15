package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
)

type GroupHandler struct {
	service service.GroupService
}

func NewGroupHandler(service service.GroupService) *GroupHandler {
	return &GroupHandler{service: service}
}

func (h *GroupHandler) CreateGroup(c *gin.Context) {
	userID := c.GetString("user_id")
	var req dto.CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.service.CreateGroup(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (h *GroupHandler) ListGroups(c *gin.Context) {
	userID := c.GetString("user_id")
	res, err := h.service.ListGroups(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

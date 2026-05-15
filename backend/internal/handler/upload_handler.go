package handler

import (
	"net/http"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/service"
	"sobat-pintar/pkg/logger"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	uploadService *service.UploadService
}

func NewUploadHandler(uploadService *service.UploadService) *UploadHandler {
	return &UploadHandler{
		uploadService: uploadService,
	}
}

func (h *UploadHandler) UploadProfileImage(c *gin.Context) {
	file, fileHeader, err := c.Request.FormFile("image")
	if err != nil {
		logger.Error(err, "Failed to get image from form")
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil gambar dari form",
			Error:   err.Error(),
		})
		return
	}
	defer file.Close()

	resp, err := h.uploadService.UploadProfileImage(c, file, fileHeader)
	if err != nil {
		logger.Error(err, "Failed to upload profile image")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengunggah foto profil",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Foto profil berhasil diunggah",
		Data:    resp,
	})
}

func (h *UploadHandler) UploadPostImage(c *gin.Context) {
	file, fileHeader, err := c.Request.FormFile("image")
	if err != nil {
		logger.Error(err, "Failed to get image from form")
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil gambar dari form",
			Error:   err.Error(),
		})
		return
	}
	defer file.Close()

	resp, err := h.uploadService.UploadPostImage(c, file, fileHeader)
	if err != nil {
		logger.Error(err, "Failed to upload post image")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengunggah gambar",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Gambar berhasil diunggah",
		Data:    resp,
	})
}

func (h *UploadHandler) UploadAttachment(c *gin.Context) {
	file, fileHeader, err := c.Request.FormFile("image")
	if err != nil {
		logger.Error(err, "Failed to get image from form")
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengambil lampiran dari form",
			Error:   err.Error(),
		})
		return
	}
	defer file.Close()

	resp, err := h.uploadService.UploadAttachment(c, file, fileHeader)
	if err != nil {
		logger.Error(err, "Failed to upload attachment")
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Success: false,
			Message: "Gagal mengunggah lampiran",
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, dto.BaseResponse{
		Success: true,
		Message: "Lampiran berhasil diunggah",
		Data:    resp,
	})
}

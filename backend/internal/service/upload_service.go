package service

import (
	"fmt"
	"mime/multipart"
	"time"

	"sobat-pintar/internal/config"
	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
	"sobat-pintar/pkg/cloudinary"
	"sobat-pintar/pkg/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UploadService struct {
	cfg        *config.Config
	cloudinary *cloudinary.Client
	imageRepo  *repository.ImageRepository
}

func NewUploadService(cfg *config.Config, cloudinary *cloudinary.Client, imageRepo *repository.ImageRepository) *UploadService {
	return &UploadService{
		cfg:        cfg,
		cloudinary: cloudinary,
		imageRepo:  imageRepo,
	}
}

func (s *UploadService) UploadProfileImage(c *gin.Context, file multipart.File, fileHeader *multipart.FileHeader) (*dto.UploadImageResponse, error) {
	return s.uploadImageInternal(c, file, fileHeader, "profile")
}

func (s *UploadService) UploadPostImage(c *gin.Context, file multipart.File, fileHeader *multipart.FileHeader) (*dto.UploadImageResponse, error) {
	return s.uploadImageInternal(c, file, fileHeader, "posts")
}

func (s *UploadService) UploadAttachment(c *gin.Context, file multipart.File, fileHeader *multipart.FileHeader) (*dto.UploadImageResponse, error) {
	return s.uploadImageInternal(c, file, fileHeader, "attachments")
}

func (s *UploadService) uploadImageInternal(c *gin.Context, file multipart.File, fileHeader *multipart.FileHeader, folder string) (*dto.UploadImageResponse, error) {
	ctx := c.Request.Context()
	if s.cloudinary == nil {
		logger.Error(nil, "Cloudinary client is not initialized.")
		return nil, fmt.Errorf("Cloudinary client is not available")
	}

	// Validate file size (max 5MB)
	const maxUploadSize = 5 << (10 * 2) // 5 MB
	if fileHeader.Size > maxUploadSize {
		return nil, fmt.Errorf("file size exceeds the maximum limit of 5MB")
	}

	// Validate mime type
	supportedMimeTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}

	if _, ok := supportedMimeTypes[fileHeader.Header.Get("Content-Type")]; !ok {
		return nil, fmt.Errorf("unsupported file type: %s", fileHeader.Header.Get("Content-Type"))
	}

	// Generate random filename
	extension := ""
	switch fileHeader.Header.Get("Content-Type") {
	case "image/jpeg":
		extension = ".jpeg"
	case "image/png":
		extension = ".png"
	case "image/webp":
		extension = ".webp"
	default:
		extension = ".jpg" // Fallback, though should be caught by mime type validation
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), extension)

	// Upload to Cloudinary
	url, publicID, err := s.cloudinary.UploadImage(file, filename, folder)
	if err != nil {
		return nil, fmt.Errorf("failed to upload image: %w", err)
	}

	// Get UserID from Gin context
	userID, ok := c.Get("user_id")
	if !ok {
		logger.Error(nil, "UserID not found in Gin context")
		return nil, fmt.Errorf("unauthorized: user information missing")
	}
	
	userIDStr, ok := userID.(string)
	if !ok {
		return nil, fmt.Errorf("unauthorized: user id is not a string")
	}

	image := &model.Image{
		ID:        uuid.New(),
		URL:       url,
		PublicID:  publicID,
		UserID:    userIDStr,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err = s.imageRepo.CreateImage(ctx, image)
	if err != nil {
		return nil, fmt.Errorf("failed to save image to database: %w", err)
	}

	return &dto.UploadImageResponse{
		Success: true,
		Message: "Upload success",
		Data: struct {
			URL     string `json:"url"`
			PublicID string `json:"public_id"`
		}{
			URL:      url,
			PublicID: publicID,
		},
	}, nil
}

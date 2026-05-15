package cloudinary

import (
	"context"
	"fmt"
	"mime/multipart"
	"time"

	"sobat-pintar/internal/config"
	"sobat-pintar/pkg/logger"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
)

type Client struct {
	cfg *config.Config
	cld *cloudinary.Cloudinary
}

func NewClient(cfg *config.Config) (*Client, error) {
	if cfg.CloudinaryCloudName == "" || cfg.CloudinaryAPIKey == "" || cfg.CloudinaryAPISecret == "" {
		logger.Info("Cloudinary credentials not fully set, Cloudinary client will not be initialized.")
		return nil, fmt.Errorf("cloudinary credentials not fully set")
	}

	cld, err := cloudinary.NewFromParams(cfg.CloudinaryCloudName, cfg.CloudinaryAPIKey, cfg.CloudinaryAPISecret)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize cloudinary client: %w", err)
	}
	return &Client{
		cfg: cfg,
		cld: cld,
	}, nil
}

func (cli *Client) UploadImage(file multipart.File, filename string, folder string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	uploadParam := uploader.UploadParams{
		PublicID: filename,
		Folder:   folder,
	}

	resp, err := cli.cld.Upload.Upload(ctx, file, uploadParam)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload image to cloudinary: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}

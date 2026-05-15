package repository

import (
	"context"
	"fmt"

	"sobat-pintar/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ImageRepository struct {
	db *pgxpool.Pool
}

func NewImageRepository(db *pgxpool.Pool) *ImageRepository {
	return &ImageRepository{
		db: db,
	}
}

func (r *ImageRepository) CreateImage(ctx context.Context, image *model.Image) error {
	query := `INSERT INTO images (id, url, public_id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, image.ID, image.URL, image.PublicID, image.UserID, image.CreatedAt, image.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create image: %w", err)
	}
	return nil
}

func (r *ImageRepository) GetImageByID(ctx context.Context, id string) (*model.Image, error) {
	query := `SELECT id, url, public_id, user_id, created_at, updated_at FROM images WHERE id = $1`
	image := &model.Image{}
	err := r.db.QueryRow(ctx, query, id).Scan(&image.ID, &image.URL, &image.PublicID, &image.UserID, &image.CreatedAt, &image.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get image by ID: %w", err)
	}
	return image, nil
}

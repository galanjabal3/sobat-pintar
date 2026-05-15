package service

import (
	"context"
	"sobat-pintar/internal/model"
	"sobat-pintar/internal/repository"
)

type UserService interface {
	GetProfile(ctx context.Context, userID string) (*model.User, error)
	UpdateProfile(ctx context.Context, userID string, user *model.User) error
}

type userService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) GetProfile(ctx context.Context, userID string) (*model.User, error) {
	return s.repo.GetByID(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID string, user *model.User) error {
	user.ID = userID
	return s.repo.Update(ctx, user)
}

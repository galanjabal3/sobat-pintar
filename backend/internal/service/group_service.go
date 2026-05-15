package service

import (
	"context"

	"sobat-pintar/internal/dto"
	"sobat-pintar/internal/repository"
)

type GroupService interface {
	CreateGroup(ctx context.Context, userID string, req dto.CreateGroupRequest) (*dto.GroupResponse, error)
	ListGroups(ctx context.Context, userID string) ([]dto.GroupResponse, error)
}

type groupService struct {
	repo repository.GroupRepository
}

func NewGroupService(repo repository.GroupRepository) GroupService {
	return &groupService{repo: repo}
}

func (s *groupService) CreateGroup(ctx context.Context, userID string, req dto.CreateGroupRequest) (*dto.GroupResponse, error) {
	return nil, nil
}

func (s *groupService) ListGroups(ctx context.Context, userID string) ([]dto.GroupResponse, error) {
	return nil, nil
}

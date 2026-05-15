package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type GroupRepository interface {
	CreateGroup(ctx context.Context, group *model.StudyGroup) error
	GetGroupByID(ctx context.Context, id string) (*model.StudyGroup, error)
	ListGroupsByUserID(ctx context.Context, userID string) ([]model.StudyGroup, error)
	AddMember(ctx context.Context, member *model.GroupMember) error
	CreateNote(ctx context.Context, note *model.GroupNote) error
	GetNotesByGroupID(ctx context.Context, groupID string) ([]model.GroupNote, error)
}

type groupRepository struct {
	db *pgxpool.Pool
}

func NewGroupRepository(db *pgxpool.Pool) GroupRepository {
	return &groupRepository{db: db}
}

func (r *groupRepository) CreateGroup(ctx context.Context, group *model.StudyGroup) error {
	return nil
}

func (r *groupRepository) GetGroupByID(ctx context.Context, id string) (*model.StudyGroup, error) {
	return nil, nil
}

func (r *groupRepository) ListGroupsByUserID(ctx context.Context, userID string) ([]model.StudyGroup, error) {
	return nil, nil
}

func (r *groupRepository) AddMember(ctx context.Context, member *model.GroupMember) error {
	return nil
}

func (r *groupRepository) CreateNote(ctx context.Context, note *model.GroupNote) error {
	return nil
}

func (r *groupRepository) GetNotesByGroupID(ctx context.Context, groupID string) ([]model.GroupNote, error) {
	return nil, nil
}

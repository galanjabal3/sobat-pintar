package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"sobat-pintar/internal/model"
)

type ScheduleRepository interface {
	CreateSchedule(ctx context.Context, schedule *model.StudySchedule) error
	GetScheduleByUserID(ctx context.Context, userID string) ([]model.StudySchedule, error)
	DeleteSchedule(ctx context.Context, id, userID string) error
	CreateReminder(ctx context.Context, reminder *model.Reminder) error
	ListPendingReminders(ctx context.Context) ([]model.Reminder, error)
	MarkReminderSent(ctx context.Context, id string) error
}

type scheduleRepository struct {
	db *pgxpool.Pool
}

func NewScheduleRepository(db *pgxpool.Pool) ScheduleRepository {
	return &scheduleRepository{db: db}
}

func (r *scheduleRepository) CreateSchedule(ctx context.Context, schedule *model.StudySchedule) error {
	query := `INSERT INTO study_schedules (id, user_id, subject, exam_date, sessions, created_at) 
			  VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, schedule.ID, schedule.UserID, schedule.Subject, schedule.ExamDate, schedule.Sessions, schedule.CreatedAt)
	return err
}

func (r *scheduleRepository) GetScheduleByUserID(ctx context.Context, userID string) ([]model.StudySchedule, error) {
	query := `SELECT id, user_id, subject, exam_date, sessions, created_at FROM study_schedules WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var schedules []model.StudySchedule
	for rows.Next() {
		var s model.StudySchedule
		err := rows.Scan(&s.ID, &s.UserID, &s.Subject, &s.ExamDate, &s.Sessions, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, nil
}

func (r *scheduleRepository) DeleteSchedule(ctx context.Context, id, userID string) error {
	query := `DELETE FROM study_schedules WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(ctx, query, id, userID)
	return err
}

func (r *scheduleRepository) CreateReminder(ctx context.Context, reminder *model.Reminder) error {
	query := `INSERT INTO reminders (id, user_id, schedule_id, remind_at, is_sent) 
			  VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, reminder.ID, reminder.UserID, reminder.ScheduleID, reminder.RemindAt, reminder.IsSent)
	return err
}

func (r *scheduleRepository) ListPendingReminders(ctx context.Context) ([]model.Reminder, error) {
	query := `SELECT id, user_id, schedule_id, remind_at, is_sent FROM reminders WHERE is_sent = false AND remind_at <= NOW()`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reminders []model.Reminder
	for rows.Next() {
		var rem model.Reminder
		err := rows.Scan(&rem.ID, &rem.UserID, &rem.ScheduleID, &rem.RemindAt, &rem.IsSent)
		if err != nil {
			return nil, err
		}
		reminders = append(reminders, rem)
	}
	return reminders, nil
}

func (r *scheduleRepository) MarkReminderSent(ctx context.Context, id string) error {
	query := `UPDATE reminders SET is_sent = true WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

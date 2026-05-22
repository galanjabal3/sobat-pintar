package repository

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrAIQuotaExceeded = errors.New("ai quota exceeded")

type AIQuotaRepository interface {
	ConsumeDailyQuota(ctx context.Context, userID, feature string, limit int) error
	RefundDailyQuota(ctx context.Context, userID, feature string) error
	GetDailyUsage(ctx context.Context, userID string) (map[string]int, error)
}

type aiQuotaRepository struct {
	db         *pgxpool.Pool
	ensureOnce sync.Once
	ensureErr  error
}

func NewAIQuotaRepository(db *pgxpool.Pool) AIQuotaRepository {
	return &aiQuotaRepository{db: db}
}

func (r *aiQuotaRepository) ConsumeDailyQuota(ctx context.Context, userID, feature string, limit int) error {
	if err := r.ensureSchema(ctx); err != nil {
		return err
	}

	query := `
		WITH consumed AS (
			INSERT INTO ai_usage_quotas (user_id, feature, usage_date, request_count, created_at, updated_at)
			VALUES ($1, $2, quota_usage_date(), 1, NOW(), NOW())
			ON CONFLICT (user_id, feature, usage_date)
			DO UPDATE SET
				request_count = ai_usage_quotas.request_count + 1,
				updated_at = NOW()
			WHERE ai_usage_quotas.request_count < $3
			RETURNING request_count
		)
		SELECT request_count FROM consumed
	`

	var count int
	err := r.db.QueryRow(ctx, query, userID, feature, limit).Scan(&count)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrAIQuotaExceeded
		}
		return err
	}

	return nil
}

func (r *aiQuotaRepository) RefundDailyQuota(ctx context.Context, userID, feature string) error {
	if err := r.ensureSchema(ctx); err != nil {
		return err
	}

	query := `
		UPDATE ai_usage_quotas
		SET request_count = GREATEST(request_count - 1, 0),
			updated_at = NOW()
		WHERE user_id = $1
		  AND feature = $2
		  AND usage_date = quota_usage_date()
		  AND request_count > 0
	`

	_, err := r.db.Exec(ctx, query, userID, feature)
	return err
}

func (r *aiQuotaRepository) GetDailyUsage(ctx context.Context, userID string) (map[string]int, error) {
	if err := r.ensureSchema(ctx); err != nil {
		return nil, err
	}

	query := `
		SELECT feature, request_count
		FROM ai_usage_quotas
		WHERE user_id = $1
		  AND usage_date = quota_usage_date()
	`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	usage := make(map[string]int)
	for rows.Next() {
		var feature string
		var requestCount int
		if err := rows.Scan(&feature, &requestCount); err != nil {
			return nil, err
		}
		usage[feature] = requestCount
	}

	return usage, nil
}

func (r *aiQuotaRepository) ensureSchema(ctx context.Context) error {
	r.ensureOnce.Do(func() {
		initCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		createTable := `
			CREATE OR REPLACE FUNCTION quota_usage_date()
			RETURNS DATE AS $$
				SELECT (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
			$$ LANGUAGE SQL STABLE;

			CREATE TABLE IF NOT EXISTS ai_usage_quotas (
				user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				feature VARCHAR(32) NOT NULL,
				usage_date DATE NOT NULL,
				request_count INTEGER NOT NULL DEFAULT 0,
				created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				PRIMARY KEY (user_id, feature, usage_date)
			)
		`
		if _, err := r.db.Exec(initCtx, createTable); err != nil {
			r.ensureErr = err
			return
		}

		createIndex := `
			CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_usage_date
			ON ai_usage_quotas (usage_date DESC)
		`
		if _, err := r.db.Exec(initCtx, createIndex); err != nil {
			r.ensureErr = err
		}
	})

	return r.ensureErr
}

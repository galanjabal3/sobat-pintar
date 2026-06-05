ALTER TABLE study_schedules
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS tips JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

UPDATE study_schedules
SET completed_at = COALESCE(completed_at, created_at)
WHERE status = 'completed';

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
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_quotas_usage_date
    ON ai_usage_quotas (usage_date DESC);

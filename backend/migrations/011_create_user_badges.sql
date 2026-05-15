CREATE TABLE IF NOT EXISTS user_badges (
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    badge_id VARCHAR(36) NOT NULL REFERENCES badges(id),
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id)
);

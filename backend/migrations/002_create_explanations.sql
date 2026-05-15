CREATE TABLE IF NOT EXISTS explanations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    question_text TEXT,
    image_url TEXT,
    level VARCHAR(10),
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

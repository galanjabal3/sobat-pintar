CREATE TABLE IF NOT EXISTS summaries (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    source_type VARCHAR(20) NOT NULL,
    file_url TEXT,
    content TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

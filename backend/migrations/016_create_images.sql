-- Add image table

CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    public_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL, -- Optional: Link image to a user, allow NULL if user is deleted
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
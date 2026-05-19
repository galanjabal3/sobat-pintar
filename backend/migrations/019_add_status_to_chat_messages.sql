ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'sent';

UPDATE chat_messages
SET status = 'sent'
WHERE status IS NULL OR status = '';

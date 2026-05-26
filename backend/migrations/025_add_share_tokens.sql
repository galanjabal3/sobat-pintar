ALTER TABLE explanations ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS share_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS explanations_share_token_unique_idx
ON explanations (share_token)
WHERE share_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS summaries_share_token_unique_idx
ON summaries (share_token)
WHERE share_token IS NOT NULL;

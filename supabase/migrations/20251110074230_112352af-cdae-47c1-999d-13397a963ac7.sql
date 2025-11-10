-- Add support for URL attachments in tasks
-- Make file-related columns nullable since URLs won't have them
ALTER TABLE task_attachments 
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_size DROP NOT NULL,
  ALTER COLUMN file_type DROP NOT NULL;

-- Add columns for URL attachments
ALTER TABLE task_attachments
  ADD COLUMN attachment_type TEXT NOT NULL DEFAULT 'file' CHECK (attachment_type IN ('file', 'url')),
  ADD COLUMN attachment_url TEXT,
  ADD COLUMN url_title TEXT;

-- Add constraint to ensure either file_path or attachment_url is provided
ALTER TABLE task_attachments
  ADD CONSTRAINT task_attachments_check_attachment 
  CHECK (
    (attachment_type = 'file' AND file_path IS NOT NULL AND attachment_url IS NULL) OR
    (attachment_type = 'url' AND attachment_url IS NOT NULL AND file_path IS NULL)
  );

-- Create index for faster URL lookups
CREATE INDEX idx_task_attachments_type ON task_attachments(attachment_type);
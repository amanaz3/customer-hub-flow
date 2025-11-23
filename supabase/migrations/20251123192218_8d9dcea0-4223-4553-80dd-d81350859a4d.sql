-- Add 'predraft' status to application_status enum
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'predraft';

-- Add comment explaining the status
COMMENT ON TYPE application_status IS 'Application status enum: predraft (auto-saved while progressing through steps), draft (explicitly saved in step 4), submitted, returned, paid, completed, rejected, under_review, approved, need more info';

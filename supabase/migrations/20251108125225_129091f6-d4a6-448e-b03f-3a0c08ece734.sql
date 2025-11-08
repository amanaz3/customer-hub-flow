-- Add new fields to tasks table for better categorization
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS module text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS mission text,
ADD COLUMN IF NOT EXISTS story text;

-- Add comments for documentation
COMMENT ON COLUMN tasks.module IS 'The module this task belongs to (e.g., cases, products, notifications)';
COMMENT ON COLUMN tasks.category IS 'The task category (e.g., development, usability testing, code review)';
COMMENT ON COLUMN tasks.mission IS 'The high-level mission or goal of this task';
COMMENT ON COLUMN tasks.story IS 'User story or detailed context for the task';
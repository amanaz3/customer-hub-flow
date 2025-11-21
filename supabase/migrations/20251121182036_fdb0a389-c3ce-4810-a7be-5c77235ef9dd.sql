-- Add GitHub repository and branch fields to tasks table
ALTER TABLE tasks
ADD COLUMN github_repo TEXT,
ADD COLUMN github_branch TEXT;
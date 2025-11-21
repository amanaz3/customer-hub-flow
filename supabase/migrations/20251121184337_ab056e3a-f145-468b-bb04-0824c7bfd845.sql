-- Add github_repo column to projects table
ALTER TABLE public.projects
ADD COLUMN github_repo TEXT;
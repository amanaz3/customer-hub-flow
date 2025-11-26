-- Add importance column to tasks table
ALTER TABLE public.tasks
ADD COLUMN importance text;
-- Add importance_reason column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS importance_reason text;
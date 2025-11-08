-- Add architectural_component field to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS architectural_component text;

-- Add comment for documentation
COMMENT ON COLUMN tasks.architectural_component IS 'The architectural layer this task belongs to (e.g., frontend, backend, database, component/service)';
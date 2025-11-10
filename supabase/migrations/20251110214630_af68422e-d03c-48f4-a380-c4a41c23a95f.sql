-- Add completed_actual column to account_applications table
ALTER TABLE account_applications
ADD COLUMN completed_actual TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN account_applications.completed_actual IS 'Actual system timestamp when the application status was changed to completed';
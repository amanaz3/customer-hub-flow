-- Add completed_at column to account_applications table
ALTER TABLE account_applications
ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the column
COMMENT ON COLUMN account_applications.completed_at IS 'Timestamp when the application was marked as completed';
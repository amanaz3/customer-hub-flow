-- Add estimated_completion_time column to account_applications table
ALTER TABLE account_applications 
ADD COLUMN estimated_completion_time DATE;

COMMENT ON COLUMN account_applications.estimated_completion_time IS 'User-entered estimated completion date, required before submitting application';
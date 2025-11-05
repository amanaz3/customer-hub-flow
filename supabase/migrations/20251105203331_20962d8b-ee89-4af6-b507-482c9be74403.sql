-- Create indexes on account_applications for better query performance

-- Index on status column (frequently filtered)
CREATE INDEX IF NOT EXISTS idx_account_applications_status 
ON account_applications(status);

-- Index on created_at column (for date filtering)
CREATE INDEX IF NOT EXISTS idx_account_applications_created_at 
ON account_applications(created_at DESC);

-- Composite index on status and created_at (optimal for combined filtering)
CREATE INDEX IF NOT EXISTS idx_account_applications_status_created_at 
ON account_applications(status, created_at DESC);

-- Index on customer_id for join performance
CREATE INDEX IF NOT EXISTS idx_account_applications_customer_id 
ON account_applications(customer_id);

COMMENT ON INDEX idx_account_applications_status IS 'Improves performance when filtering by status';
COMMENT ON INDEX idx_account_applications_created_at IS 'Improves performance when filtering by date';
COMMENT ON INDEX idx_account_applications_status_created_at IS 'Optimizes combined status and date filtering (e.g., completed applications in a specific month)';
COMMENT ON INDEX idx_account_applications_customer_id IS 'Improves join performance with customers table';
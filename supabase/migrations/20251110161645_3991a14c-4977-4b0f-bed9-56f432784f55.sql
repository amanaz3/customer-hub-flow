-- Drop the lowercase check constraint
ALTER TABLE account_applications 
DROP CONSTRAINT IF EXISTS check_status_lowercase;

-- Drop any existing trigger
DROP TRIGGER IF EXISTS trg_account_applications_lowercase_status ON account_applications;

-- Create application_status enum with lowercase values
CREATE TYPE application_status AS ENUM (
  'draft',
  'submitted',
  'returned',
  'paid',
  'completed',
  'rejected',
  'under_review',
  'approved',
  'need more info'
);

-- Update 'complete' to 'completed' to match TypeScript types
UPDATE account_applications 
SET status = 'completed' 
WHERE status = 'complete';

-- Drop the existing default temporarily
ALTER TABLE account_applications 
ALTER COLUMN status DROP DEFAULT;

-- Convert the status column to use the enum type
ALTER TABLE account_applications 
ALTER COLUMN status TYPE application_status 
USING status::application_status;

-- Re-add the default value
ALTER TABLE account_applications 
ALTER COLUMN status SET DEFAULT 'draft'::application_status;
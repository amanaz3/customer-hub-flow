-- Phase 2: Remove 'user' value from app_role enum
-- This is safe now that all references have been updated to 'manager'

-- Create a new enum without the 'user' value
CREATE TYPE app_role_new AS ENUM ('admin', 'manager');

-- Update tables to use the new enum
ALTER TABLE profiles ALTER COLUMN role TYPE app_role_new USING role::text::app_role_new;
ALTER TABLE status_changes ALTER COLUMN changed_by_role TYPE app_role_new USING changed_by_role::text::app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE app_role;
ALTER TYPE app_role_new RENAME TO app_role;
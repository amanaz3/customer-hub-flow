-- Check and fix any default values before attempting enum cleanup
-- Update any functions that might reference the old enum value

-- First, let's check if we have any default values
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'manager'::app_role;

-- Ensure all existing data is properly migrated 
UPDATE profiles SET role = 'manager' WHERE role = 'user';
UPDATE status_changes SET changed_by_role = 'manager' WHERE changed_by_role = 'user';
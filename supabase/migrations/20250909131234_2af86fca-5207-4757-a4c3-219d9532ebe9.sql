-- Phase 1: Add 'manager' role to app_role enum
ALTER TYPE app_role ADD VALUE 'manager';

-- Update existing 'user' roles to 'manager'
UPDATE profiles SET role = 'manager' WHERE role = 'user';
UPDATE status_changes SET changed_by_role = 'manager' WHERE changed_by_role = 'user';

-- Phase 2: Remove 'user' value from enum (this will be done in a separate migration after ensuring all references are updated)
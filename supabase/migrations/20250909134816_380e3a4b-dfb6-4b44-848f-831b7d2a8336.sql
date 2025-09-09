-- Check current enum values and add manager if it doesn't exist
-- First check what values exist
DO $$
BEGIN
    -- Try to add 'manager' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE app_role ADD VALUE 'manager';
    END IF;
END $$;
-- Drop the existing foreign key constraint
ALTER TABLE public.customers 
DROP CONSTRAINT IF EXISTS fk_customers_user_id;

-- Make user_id nullable if it isn't already (for safety)
ALTER TABLE public.customers 
ALTER COLUMN user_id DROP NOT NULL;

-- Add new foreign key constraint with SET NULL on delete
ALTER TABLE public.customers 
ADD CONSTRAINT fk_customers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Optional: Add a soft delete mechanism to profiles table
-- This allows marking profiles as inactive instead of hard deletion
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
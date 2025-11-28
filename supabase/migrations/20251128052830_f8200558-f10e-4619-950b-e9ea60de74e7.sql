-- Fix customers table INSERT policy to prevent NULL user_id
-- This ensures all customer records with sensitive PII are properly assigned to a user

-- Drop the problematic INSERT policy that allows NULL user_id
DROP POLICY IF EXISTS "customers_insert_policy" ON public.customers;

-- Create new secure INSERT policy
CREATE POLICY "customers_insert_policy" 
ON public.customers 
FOR INSERT 
WITH CHECK (
  -- user_id must be set (not null) - no orphaned customer records
  user_id IS NOT NULL
  AND (
    -- Regular users can only create customers assigned to themselves
    auth.uid() = user_id
    -- Admins can create customers assigned to any user
    OR is_admin(auth.uid())
  )
);

COMMENT ON POLICY "customers_insert_policy" ON public.customers IS 
'Prevents orphaned customer records: user_id must be set to either the creator (for regular users) or any valid user (for admins)';
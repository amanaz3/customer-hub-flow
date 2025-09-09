-- Fix customer data security issue by replacing broad "ALL" policy with granular policies

-- Drop the overly broad policy
DROP POLICY IF EXISTS "Users can manage their own customers" ON public.customers;

-- Create specific, granular policies following principle of least privilege

-- Users can view their own customers
CREATE POLICY "Users can view their own customers" 
ON public.customers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create customers (but only assign to themselves)
CREATE POLICY "Users can create their own customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own customers
CREATE POLICY "Users can update their own customers" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Deliberately NOT including DELETE policy for regular users
-- Only admins can delete customers through existing admin policies

-- Ensure user_id cannot be null to prevent unauthorized access
ALTER TABLE public.customers ALTER COLUMN user_id SET NOT NULL;
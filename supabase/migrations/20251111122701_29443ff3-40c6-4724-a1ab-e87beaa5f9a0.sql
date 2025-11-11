-- Fix recursive RLS on tasks causing 500 errors
-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;

-- Replace with a safe, non-recursive read policy
CREATE POLICY "Authenticated users can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

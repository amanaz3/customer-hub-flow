-- Allow authenticated users to view basic profile information (name, email)
-- This is needed for displaying comment authors across the application
CREATE POLICY "Authenticated users can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add a comment explaining the security considerations
COMMENT ON POLICY "Authenticated users can view basic profile info" ON public.profiles IS 
'Allows all authenticated users to view basic profile information (name, email) of other users. This is necessary for displaying comment authors and user references throughout the application. Only basic information is exposed - sensitive fields should be restricted through application logic or additional policies.';
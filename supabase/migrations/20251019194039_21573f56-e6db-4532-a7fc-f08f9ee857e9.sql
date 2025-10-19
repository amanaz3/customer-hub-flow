-- Create a function to permanently delete soft-deleted users
CREATE OR REPLACE FUNCTION public.cleanup_deleted_users()
RETURNS TABLE(deleted_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_deleted integer;
BEGIN
  -- Delete profiles that have been soft-deleted (anonymized email or deleted_at set)
  DELETE FROM public.profiles
  WHERE email LIKE 'deleted-user-%@deleted.local'
     OR deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS count_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT count_deleted;
END;
$$;

-- Execute the cleanup
SELECT cleanup_deleted_users();

-- Add a comment explaining the function
COMMENT ON FUNCTION public.cleanup_deleted_users() IS 'Permanently removes soft-deleted user profiles from the database';
-- Create function to sync completed_actual with status_changes created_at
CREATE OR REPLACE FUNCTION public.sync_completed_actual_from_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run when new_status is 'completed' (case-insensitive)
  IF LOWER(NEW.new_status::text) = 'completed' THEN
    -- Update the application's completed_actual to match status_changes.created_at
    UPDATE account_applications
    SET completed_actual = NEW.created_at
    WHERE id = (
      SELECT id 
      FROM account_applications 
      WHERE customer_id = NEW.customer_id 
      AND status = 'completed'
      LIMIT 1
    )
    AND completed_actual IS NULL; -- Only set if not already set (first time completion)
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on status_changes table
DROP TRIGGER IF EXISTS sync_completed_actual_trigger ON status_changes;
CREATE TRIGGER sync_completed_actual_trigger
  AFTER INSERT ON status_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_completed_actual_from_status_change();
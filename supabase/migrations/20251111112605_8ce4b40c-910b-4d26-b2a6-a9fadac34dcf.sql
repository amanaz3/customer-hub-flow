-- Create function to log completion date changes
CREATE OR REPLACE FUNCTION log_completion_date_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if completed_at actually changed and status is 'completed'
  IF OLD.completed_at IS DISTINCT FROM NEW.completed_at 
     AND NEW.status = 'completed' THEN
    
    -- Insert into completion_date_history
    INSERT INTO completion_date_history (
      application_id,
      previous_date,
      new_date,
      changed_by,
      changed_by_role,
      comment
    ) VALUES (
      NEW.id,
      OLD.completed_at,
      NEW.completed_at,
      auth.uid(),
      COALESCE(
        (SELECT role FROM profiles WHERE id = auth.uid()),
        'user'::app_role
      ),
      'Completion date modified'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on account_applications to log completion date changes
DROP TRIGGER IF EXISTS trigger_log_completion_date_changes ON account_applications;

CREATE TRIGGER trigger_log_completion_date_changes
  AFTER UPDATE OF completed_at ON account_applications
  FOR EACH ROW
  WHEN (OLD.completed_at IS DISTINCT FROM NEW.completed_at AND NEW.status = 'completed')
  EXECUTE FUNCTION log_completion_date_change();
-- Create function to automatically log application status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Insert into application_status_changes
    INSERT INTO application_status_changes (
      application_id,
      previous_status,
      new_status,
      changed_by,
      changed_by_role,
      comment
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(), -- User making the change
      COALESCE(
        (SELECT role FROM profiles WHERE id = auth.uid()),
        'user'::app_role
      ),
      'Status changed via system'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on account_applications to log all status changes
DROP TRIGGER IF EXISTS trigger_log_application_status_changes ON account_applications;

CREATE TRIGGER trigger_log_application_status_changes
  AFTER UPDATE OF status ON account_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_application_status_change();
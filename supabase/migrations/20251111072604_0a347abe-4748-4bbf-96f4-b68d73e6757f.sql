-- Create trigger function to automatically log all status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
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
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND role = 'admin'
        ) THEN 'admin'
        ELSE 'user'
      END,
      'Status change logged automatically'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on account_applications table
DROP TRIGGER IF EXISTS trigger_log_application_status_changes ON account_applications;

CREATE TRIGGER trigger_log_application_status_changes
  AFTER UPDATE ON account_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_application_status_change();

-- Add comment explaining the trigger
COMMENT ON TRIGGER trigger_log_application_status_changes ON account_applications IS 
'Automatically logs all status changes to application_status_changes table for audit trail';
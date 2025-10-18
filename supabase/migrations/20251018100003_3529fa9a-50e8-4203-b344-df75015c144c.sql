-- Add trigger to notify users when their customer status changes
CREATE OR REPLACE FUNCTION public.notify_user_of_status_change()
RETURNS trigger AS $$
DECLARE
  customer_record RECORD;
  notification_type TEXT;
BEGIN
  -- Get customer info including the assigned user
  SELECT 
    c.name, 
    c.company, 
    c.user_id,
    p.name as user_name
  INTO customer_record
  FROM customers c
  LEFT JOIN profiles p ON p.id = c.user_id
  WHERE c.id = NEW.customer_id;
  
  -- Skip if customer has no assigned user or if the user made the change themselves
  IF customer_record.user_id IS NULL OR customer_record.user_id = NEW.changed_by THEN
    RETURN NEW;
  END IF;
  
  -- Determine notification type based on new status
  IF NEW.new_status = 'Complete' THEN
    notification_type := 'success';
  ELSIF NEW.new_status = 'Rejected' THEN
    notification_type := 'error';
  ELSE
    notification_type := 'info';
  END IF;
  
  -- Create notification for the customer's assigned user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    customer_id,
    action_url
  ) VALUES (
    customer_record.user_id,
    notification_type,
    'Status Updated: ' || customer_record.name,
    customer_record.company || ' status changed from ' || NEW.previous_status || ' to ' || NEW.new_status,
    NEW.customer_id,
    '/customers/' || NEW.customer_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on status_changes table
DROP TRIGGER IF EXISTS trigger_notify_user_of_status_change ON status_changes;
CREATE TRIGGER trigger_notify_user_of_status_change
  AFTER INSERT ON status_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_user_of_status_change();
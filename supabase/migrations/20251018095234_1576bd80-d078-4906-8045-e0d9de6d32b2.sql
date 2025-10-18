-- Add customer_id and action_url columns to notifications table if they don't exist
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS action_url text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_customer_id ON public.notifications(customer_id);

-- Create function to notify admins of status requests
CREATE OR REPLACE FUNCTION public.notify_admins_of_status_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  customer_record RECORD;
  requested_status TEXT;
  creator_name TEXT;
BEGIN
  -- Check if this is a status request comment
  IF NEW.comment LIKE '[STATUS REQUEST:%' THEN
    -- Extract the requested status
    requested_status := substring(NEW.comment from '\[STATUS REQUEST: (.+?)\]');
    
    -- Get customer info
    SELECT name, company INTO customer_record
    FROM customers
    WHERE id = NEW.customer_id;
    
    -- Get creator name
    SELECT name INTO creator_name
    FROM profiles
    WHERE id = NEW.created_by;
    
    -- Create notification for each active admin except the creator
    FOR admin_record IN 
      SELECT id FROM profiles 
      WHERE role = 'admin' 
      AND is_active = true 
      AND id != NEW.created_by
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        customer_id,
        action_url,
        is_read,
        created_at,
        updated_at
      ) VALUES (
        admin_record.id,
        'warning',
        'Status Change Request: ' || COALESCE(customer_record.name, 'Unknown'),
        COALESCE(creator_name, 'User') || ' requests status change to "' || requested_status || '" for ' || COALESCE(customer_record.company, customer_record.name),
        NEW.customer_id,
        '/customers/' || NEW.customer_id,
        false,
        now(),
        now()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on comments table
DROP TRIGGER IF EXISTS trigger_notify_admins_of_status_request ON public.comments;
CREATE TRIGGER trigger_notify_admins_of_status_request
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_of_status_request();
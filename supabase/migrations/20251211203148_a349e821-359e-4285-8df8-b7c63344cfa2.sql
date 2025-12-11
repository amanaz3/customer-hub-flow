-- Create function to notify user when a lead is assigned to them
CREATE OR REPLACE FUNCTION public.notify_lead_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_record RECORD;
  score_priority TEXT;
BEGIN
  -- Only trigger on INSERT or when assigned_to changes to a new user
  IF TG_OP = 'INSERT' THEN
    -- Only notify if there's an assigned user
    IF NEW.assigned_to IS NOT NULL THEN
      -- Determine priority based on score
      score_priority := CASE 
        WHEN NEW.score = 'hot' THEN 'Hot 🔥'
        WHEN NEW.score = 'warm' THEN 'Warm'
        ELSE 'Cold'
      END;
      
      -- Create notification for the assigned user
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        is_read,
        created_at,
        updated_at
      ) VALUES (
        NEW.assigned_to,
        CASE WHEN NEW.score = 'hot' THEN 'warning' ELSE 'info' END,
        'New Lead Assigned: ' || NEW.name,
        'Lead: ' || NEW.name || 
        COALESCE(' | Company: ' || NEW.company, '') ||
        ' | Score: ' || score_priority ||
        ' | Action: Send WhatsApp welcome, call within 24hrs',
        '/leads/' || NEW.id,
        false,
        now(),
        now()
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only notify if assigned_to changed to a different user
    IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to AND NEW.assigned_to IS NOT NULL THEN
      -- Determine priority based on score
      score_priority := CASE 
        WHEN NEW.score = 'hot' THEN 'Hot 🔥'
        WHEN NEW.score = 'warm' THEN 'Warm'
        ELSE 'Cold'
      END;
      
      -- Create notification for the newly assigned user
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        is_read,
        created_at,
        updated_at
      ) VALUES (
        NEW.assigned_to,
        CASE WHEN NEW.score = 'hot' THEN 'warning' ELSE 'info' END,
        'Lead Assigned to You: ' || NEW.name,
        'Lead: ' || NEW.name || 
        COALESCE(' | Company: ' || NEW.company, '') ||
        ' | Score: ' || score_priority ||
        ' | Action: Send WhatsApp welcome, call within 24hrs',
        '/leads/' || NEW.id,
        false,
        now(),
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for lead assignment notifications
DROP TRIGGER IF EXISTS trigger_notify_lead_assignment ON leads;
CREATE TRIGGER trigger_notify_lead_assignment
  AFTER INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_lead_assignment();
-- Create function to auto-update lead status to contacted when contact activity is logged
CREATE OR REPLACE FUNCTION public.auto_update_lead_status_on_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if activity type is a contact action
  IF NEW.activity_type IN ('email', 'whatsapp', 'linkedin', 'call', 'phone') THEN
    -- Update lead status to 'contacted' if currently 'new'
    UPDATE leads
    SET 
      status = 'contacted',
      last_contacted_at = now(),
      updated_at = now()
    WHERE id = NEW.lead_id
      AND status = 'new';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on lead_activities table
DROP TRIGGER IF EXISTS trigger_auto_update_lead_status ON lead_activities;
CREATE TRIGGER trigger_auto_update_lead_status
  AFTER INSERT ON lead_activities
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_lead_status_on_contact();
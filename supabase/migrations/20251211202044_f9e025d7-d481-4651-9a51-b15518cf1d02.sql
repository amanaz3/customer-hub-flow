-- Create table for lead reminder schedule settings
CREATE TABLE public.lead_reminder_schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT false,
  schedule_time time NOT NULL DEFAULT '08:00:00',
  timezone text NOT NULL DEFAULT 'Asia/Dubai',
  last_run_at timestamp with time zone,
  next_run_at timestamp with time zone,
  cron_job_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_reminder_schedule ENABLE ROW LEVEL SECURITY;

-- Only admins can manage schedule settings
CREATE POLICY "Admins can manage lead reminder schedule"
ON public.lead_reminder_schedule
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_lead_reminder_schedule_updated_at
  BEFORE UPDATE ON public.lead_reminder_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO public.lead_reminder_schedule (is_enabled, schedule_time, timezone)
VALUES (false, '08:00:00', 'Asia/Dubai');
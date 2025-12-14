-- Add assigned_to and campaign_name columns to lead_discovery_sessions
ALTER TABLE public.lead_discovery_sessions
ADD COLUMN assigned_to uuid REFERENCES public.profiles(id),
ADD COLUMN campaign_name text;

-- Add index for assigned_to for performance
CREATE INDEX idx_lead_discovery_sessions_assigned_to ON public.lead_discovery_sessions(assigned_to);
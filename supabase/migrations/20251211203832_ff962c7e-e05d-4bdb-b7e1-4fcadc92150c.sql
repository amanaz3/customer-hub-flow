-- Create table for lead follow-up sequence configuration
CREATE TABLE public.lead_followup_sequence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_offset integer NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('whatsapp', 'call', 'email', 'note')),
  action_title text NOT NULL,
  action_description text,
  auto_mark_cold boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (day_offset)
);

-- Enable RLS
ALTER TABLE public.lead_followup_sequence ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sequences
CREATE POLICY "Admins can manage follow-up sequences"
  ON public.lead_followup_sequence
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Everyone authenticated can view sequences
CREATE POLICY "Authenticated users can view sequences"
  ON public.lead_followup_sequence
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert default sequence
INSERT INTO public.lead_followup_sequence (day_offset, action_type, action_title, action_description, auto_mark_cold) VALUES
  (0, 'whatsapp', 'Send Welcome Message', 'Send WhatsApp welcome message to introduce yourself and the company', false),
  (1, 'call', 'First Call', 'Call the lead to discuss their needs and requirements', false),
  (2, 'whatsapp', 'Follow-up Reminder', 'Send WhatsApp reminder if no response to call', false),
  (3, 'email', 'Send Proposal', 'Email with proposal or portal link for self-service', false),
  (5, 'whatsapp', 'Final Reminder', 'Final WhatsApp reminder before closing', false),
  (7, 'note', 'Status Review', 'Review lead status - mark as Cold if still no response', true);

-- Create index for ordering
CREATE INDEX idx_lead_followup_sequence_day ON public.lead_followup_sequence(day_offset);

-- Add trigger for updated_at
CREATE TRIGGER update_lead_followup_sequence_updated_at
  BEFORE UPDATE ON public.lead_followup_sequence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
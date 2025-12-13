-- Add outreach-related columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS dubai_setup_likelihood text CHECK (dubai_setup_likelihood IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS preferred_contact_method text CHECK (preferred_contact_method IN ('email', 'linkedin', 'whatsapp', 'trade_fair')),
ADD COLUMN IF NOT EXISTS outreach_status text DEFAULT 'pending' CHECK (outreach_status IN ('pending', 'message_sent', 'responded', 'no_response', 'converted')),
ADD COLUMN IF NOT EXISTS outreach_messages jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS linkedin_profile text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS indicator text;

-- Create index for filtering by outreach status
CREATE INDEX IF NOT EXISTS idx_leads_dubai_setup_likelihood ON public.leads(dubai_setup_likelihood);
CREATE INDEX IF NOT EXISTS idx_leads_outreach_status ON public.leads(outreach_status);
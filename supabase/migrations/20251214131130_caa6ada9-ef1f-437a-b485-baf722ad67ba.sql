-- Create lead_campaigns table
CREATE TABLE public.lead_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  excel_file_path TEXT,
  excel_file_name TEXT,
  outreach_template JSONB,
  lead_count INTEGER NOT NULL DEFAULT 0,
  converted_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add campaign_id to leads table
ALTER TABLE public.leads ADD COLUMN campaign_id UUID REFERENCES public.lead_campaigns(id);

-- Enable RLS
ALTER TABLE public.lead_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_campaigns
CREATE POLICY "Users can view their assigned campaigns"
ON public.lead_campaigns FOR SELECT
USING (assigned_to = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all campaigns"
ON public.lead_campaigns FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can update their assigned campaigns"
ON public.lead_campaigns FOR UPDATE
USING (assigned_to = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_lead_campaigns_assigned_to ON public.lead_campaigns(assigned_to);

-- Function to update lead_count on campaign
CREATE OR REPLACE FUNCTION public.update_campaign_lead_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.campaign_id IS NOT NULL THEN
    UPDATE public.lead_campaigns SET lead_count = lead_count + 1, updated_at = now() WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'DELETE' AND OLD.campaign_id IS NOT NULL THEN
    UPDATE public.lead_campaigns SET lead_count = lead_count - 1, updated_at = now() WHERE id = OLD.campaign_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.campaign_id IS DISTINCT FROM NEW.campaign_id THEN
      IF OLD.campaign_id IS NOT NULL THEN
        UPDATE public.lead_campaigns SET lead_count = lead_count - 1, updated_at = now() WHERE id = OLD.campaign_id;
      END IF;
      IF NEW.campaign_id IS NOT NULL THEN
        UPDATE public.lead_campaigns SET lead_count = lead_count + 1, updated_at = now() WHERE id = NEW.campaign_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for lead count updates
CREATE TRIGGER trigger_update_campaign_lead_count
AFTER INSERT OR UPDATE OR DELETE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_campaign_lead_count();

-- Create storage bucket for campaign Excel files
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-files', 'campaign-files', false);

-- Storage policies
CREATE POLICY "Users can view campaign files for their campaigns"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign-files' AND (
  EXISTS (SELECT 1 FROM public.lead_campaigns lc WHERE lc.excel_file_path LIKE '%' || name AND (lc.assigned_to = auth.uid() OR is_admin(auth.uid())))
));

CREATE POLICY "Admins can upload campaign files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'campaign-files' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete campaign files"
ON storage.objects FOR DELETE
USING (bucket_id = 'campaign-files' AND is_admin(auth.uid()));
-- Create lead_score enum
CREATE TYPE public.lead_score AS ENUM ('hot', 'warm', 'cold');

-- Create lead_status enum
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number SERIAL,
  name TEXT NOT NULL,
  email TEXT,
  mobile TEXT,
  company TEXT,
  source TEXT, -- referral, website, social, cold_call, etc.
  score public.lead_score DEFAULT 'warm',
  status public.lead_status DEFAULT 'new',
  assigned_to UUID REFERENCES public.profiles(id),
  notes TEXT,
  product_interest_id UUID REFERENCES public.products(id),
  estimated_value NUMERIC,
  next_follow_up DATE,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  converted_customer_id UUID REFERENCES public.customers(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their assigned leads"
ON public.leads FOR SELECT
USING (assigned_to = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can insert leads"
ON public.leads FOR INSERT
WITH CHECK (assigned_to = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can update their assigned leads"
ON public.leads FOR UPDATE
USING (assigned_to = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete leads"
ON public.leads FOR DELETE
USING (is_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_score ON public.leads(score);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);

-- Create lead_activities table for tracking follow-ups
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- call, whatsapp, email, meeting, note
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_activities
CREATE POLICY "Users can view activities for their leads"
ON public.lead_activities FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.leads
  WHERE leads.id = lead_activities.lead_id
  AND (leads.assigned_to = auth.uid() OR is_admin(auth.uid()))
));

CREATE POLICY "Users can insert activities for their leads"
ON public.lead_activities FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads
  WHERE leads.id = lead_activities.lead_id
  AND (leads.assigned_to = auth.uid() OR is_admin(auth.uid()))
));

CREATE POLICY "Admins can delete activities"
ON public.lead_activities FOR DELETE
USING (is_admin(auth.uid()));

-- Create index
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);

-- Update trigger for leads
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
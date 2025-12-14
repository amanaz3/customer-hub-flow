-- Create lead_workflow_steps table to track each lead's progress through the 5-step workflow
CREATE TABLE public.lead_workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL, -- 'import', 'qualify', 'nurture', 'propose', 'convert'
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, step_key)
);

-- Create lead_workflow_settings table for automated triggers and bulk processing config
CREATE TABLE public.lead_workflow_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.lead_workflow_settings (setting_key, setting_value, is_enabled) VALUES
('auto_qualify_on_import', '{"auto_score": true, "auto_assign": false, "assignment_method": "round_robin"}', false),
('auto_nurture_triggers', '{"days_no_response_to_cold": 7, "auto_move_to_nurture": true}', false),
('bulk_processing', '{"max_batch_size": 50, "enabled": true}', true);

-- Enable RLS
ALTER TABLE public.lead_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_workflow_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_workflow_steps
CREATE POLICY "Users can view workflow steps for leads assigned to them"
ON public.lead_workflow_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads WHERE leads.id = lead_workflow_steps.lead_id
    AND (leads.assigned_to = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Users can update workflow steps for leads assigned to them"
ON public.lead_workflow_steps
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM leads WHERE leads.id = lead_workflow_steps.lead_id
    AND (leads.assigned_to = auth.uid() OR public.is_admin(auth.uid()))
  )
);

CREATE POLICY "Admins can insert workflow steps"
ON public.lead_workflow_steps
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()) OR EXISTS (
  SELECT 1 FROM leads WHERE leads.id = lead_workflow_steps.lead_id AND leads.assigned_to = auth.uid()
));

CREATE POLICY "Admins can delete workflow steps"
ON public.lead_workflow_steps
FOR DELETE
USING (public.is_admin(auth.uid()));

-- RLS policies for lead_workflow_settings (admin only)
CREATE POLICY "Admins can manage workflow settings"
ON public.lead_workflow_settings
FOR ALL
USING (public.is_admin(auth.uid()));

CREATE POLICY "All users can view workflow settings"
ON public.lead_workflow_settings
FOR SELECT
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_lead_workflow_steps_updated_at
BEFORE UPDATE ON public.lead_workflow_steps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_workflow_settings_updated_at
BEFORE UPDATE ON public.lead_workflow_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default workflow steps for a new lead
CREATE OR REPLACE FUNCTION public.create_lead_workflow_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert the 5 default workflow steps for this lead
  INSERT INTO lead_workflow_steps (lead_id, step_key, step_name, step_order, status)
  VALUES
    (NEW.id, 'import', 'Import', 1, 'completed'),
    (NEW.id, 'qualify', 'Qualify', 2, 'pending'),
    (NEW.id, 'nurture', 'Nurture', 3, 'pending'),
    (NEW.id, 'propose', 'Propose', 4, 'pending'),
    (NEW.id, 'convert', 'Convert', 5, 'pending');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create workflow steps when a lead is inserted
CREATE TRIGGER trigger_create_lead_workflow_steps
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.create_lead_workflow_steps();
-- Create table for application status notification preferences (system-wide)
CREATE TABLE IF NOT EXISTS public.application_status_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_type TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_status_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can manage)
CREATE POLICY "Admins can view status preferences"
  ON public.application_status_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert status preferences"
  ON public.application_status_preferences
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update status preferences"
  ON public.application_status_preferences
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete status preferences"
  ON public.application_status_preferences
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_application_status_preferences_updated_at
  BEFORE UPDATE ON public.application_status_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default status preferences for common statuses
INSERT INTO public.application_status_preferences (status_type, is_enabled) VALUES
  ('completed', true),
  ('rejected', true),
  ('returned', true),
  ('paid', false),
  ('submitted', false),
  ('draft', false)
ON CONFLICT (status_type) DO NOTHING;
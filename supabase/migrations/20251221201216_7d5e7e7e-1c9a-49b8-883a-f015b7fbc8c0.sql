-- Create table to store sandbox card visibility settings
CREATE TABLE public.sandbox_card_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_key TEXT NOT NULL UNIQUE,
  card_name TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  card_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sandbox_card_settings ENABLE ROW LEVEL SECURITY;

-- Create policies - all authenticated users can view, only admins can update
CREATE POLICY "Anyone can view sandbox card settings"
  ON public.sandbox_card_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can update sandbox card settings"
  ON public.sandbox_card_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert sandbox card settings"
  ON public.sandbox_card_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default cards
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order) VALUES
  ('customer', 'Customer', true, 1),
  ('agent', 'Agent', true, 2),
  ('company', 'Company', true, 3),
  ('team', 'Team', true, 4),
  ('accounting', 'Accounting', true, 5),
  ('fintech', 'Fintech', true, 6),
  ('sales', 'Referrals & Leads & Sales & Support', true, 7);

-- Create trigger for updated_at
CREATE TRIGGER update_sandbox_card_settings_updated_at
  BEFORE UPDATE ON public.sandbox_card_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
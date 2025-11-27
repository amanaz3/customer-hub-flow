-- Create feature flags table for admin-controlled features
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  feature_name text NOT NULL,
  feature_description text,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage feature flags
CREATE POLICY "Admins can view feature flags"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert the three phase feature flags
INSERT INTO public.feature_flags (feature_key, feature_name, feature_description, is_enabled) VALUES
  ('application_substep_tracking', 'Substep Tracking', 'Allows agents to view and update application workflow substeps', false),
  ('application_ai_analysis', 'AI Analysis', 'Enables AI-powered analysis and recommendations for admins on application workflows', false),
  ('application_ai_auto_assignment', 'AI Auto-Assignment', 'Allows AI to automatically assign generated tasks to agents', false)
ON CONFLICT (feature_key) DO NOTHING;
-- Create webflow_configurations table for unified JSON config
CREATE TABLE public.webflow_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'default',
  description TEXT,
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create version history table
CREATE TABLE public.webflow_configuration_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  configuration_id UUID NOT NULL REFERENCES public.webflow_configurations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  config_data JSONB NOT NULL,
  change_notes TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webflow_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webflow_configuration_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for webflow_configurations
CREATE POLICY "Everyone can view active configurations"
  ON public.webflow_configurations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage all configurations"
  ON public.webflow_configurations FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS policies for version history
CREATE POLICY "Everyone can view versions"
  ON public.webflow_configuration_versions FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage versions"
  ON public.webflow_configuration_versions FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_webflow_configurations_updated_at
  BEFORE UPDATE ON public.webflow_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_webflow_updated_at();

-- Create unique constraint on name for active configs
CREATE UNIQUE INDEX webflow_configurations_active_name_idx 
  ON public.webflow_configurations (name) 
  WHERE is_active = true;

-- Migrate existing data from 5 tables into JSON format
INSERT INTO public.webflow_configurations (name, description, config_data, is_active, version_number)
SELECT 
  'default',
  'Default webflow configuration migrated from separate tables',
  jsonb_build_object(
    'countries', COALESCE((SELECT jsonb_agg(row_to_json(c)) FROM webflow_countries c), '[]'::jsonb),
    'jurisdictions', COALESCE((SELECT jsonb_agg(row_to_json(j)) FROM webflow_jurisdictions j), '[]'::jsonb),
    'activities', COALESCE((SELECT jsonb_agg(row_to_json(a)) FROM webflow_activities a), '[]'::jsonb),
    'documents', COALESCE((SELECT jsonb_agg(row_to_json(d)) FROM webflow_documents d), '[]'::jsonb),
    'pricing', COALESCE((SELECT jsonb_agg(row_to_json(p)) FROM webflow_pricing p), '[]'::jsonb),
    'rules', COALESCE((SELECT jsonb_agg(row_to_json(r)) FROM webflow_rules r), '[]'::jsonb)
  ),
  true,
  1;

-- Add comment to old tables marking them as deprecated
COMMENT ON TABLE public.webflow_countries IS 'DEPRECATED: Migrated to webflow_configurations.config_data.countries';
COMMENT ON TABLE public.webflow_jurisdictions IS 'DEPRECATED: Migrated to webflow_configurations.config_data.jurisdictions';
COMMENT ON TABLE public.webflow_activities IS 'DEPRECATED: Migrated to webflow_configurations.config_data.activities';
COMMENT ON TABLE public.webflow_documents IS 'DEPRECATED: Migrated to webflow_configurations.config_data.documents';
COMMENT ON TABLE public.webflow_rules IS 'DEPRECATED: Migrated to webflow_configurations.config_data.rules';
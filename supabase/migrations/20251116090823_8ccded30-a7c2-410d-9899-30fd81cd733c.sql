-- Create form_templates table for saving reusable templates
CREATE TABLE IF NOT EXISTS public.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(name, product_id)
);

-- Create form_configuration_versions table for automatic version history
CREATE TABLE IF NOT EXISTS public.form_configuration_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  config_data JSONB NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  change_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, version_number)
);

-- Create index for faster version lookups
CREATE INDEX IF NOT EXISTS idx_form_versions_product 
ON public.form_configuration_versions(product_id, version_number DESC);

-- Enable RLS on form_templates
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Admins can manage all templates"
ON public.form_templates
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Everyone can view active templates"
ON public.form_templates
FOR SELECT
TO authenticated
USING (is_active = true);

-- Enable RLS on form_configuration_versions
ALTER TABLE public.form_configuration_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_configuration_versions
CREATE POLICY "Admins can manage all versions"
ON public.form_configuration_versions
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Everyone can view versions"
ON public.form_configuration_versions
FOR SELECT
TO authenticated
USING (true);

-- Function to get next version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_product_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_next_version
  FROM form_configuration_versions
  WHERE product_id = p_product_id;
  
  RETURN v_next_version;
END;
$$;

-- Trigger to update updated_at on form_templates
CREATE TRIGGER update_form_templates_updated_at
BEFORE UPDATE ON public.form_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.form_templates IS 'Stores reusable form configuration templates';
COMMENT ON TABLE public.form_configuration_versions IS 'Tracks version history of form configurations';
COMMENT ON COLUMN public.form_configuration_versions.version_number IS 'Auto-incrementing version number per product';
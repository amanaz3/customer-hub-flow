-- Create service_form_configurations table to store dynamic form configurations for each product/service
CREATE TABLE IF NOT EXISTS public.service_form_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  form_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_product_config UNIQUE (product_id)
);

-- Enable RLS
ALTER TABLE public.service_form_configurations ENABLE ROW LEVEL SECURITY;

-- Admins can manage all configurations
CREATE POLICY "Admins can manage service form configurations"
  ON public.service_form_configurations
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Everyone can view configurations for active products
CREATE POLICY "Everyone can view service form configurations"
  ON public.service_form_configurations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = service_form_configurations.product_id
      AND p.is_active = true
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_service_form_configurations_updated_at
  BEFORE UPDATE ON public.service_form_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_service_form_configurations_product_id 
  ON public.service_form_configurations(product_id);
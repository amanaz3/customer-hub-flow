-- Create service bundles table
CREATE TABLE IF NOT EXISTS public.service_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_name TEXT NOT NULL,
  bundle_description TEXT,
  total_arr NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table linking bundles to products
CREATE TABLE IF NOT EXISTS public.bundle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES public.service_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, product_id)
);

-- Enable RLS
ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_bundles
CREATE POLICY "Everyone can view active bundles"
  ON public.service_bundles
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage bundles"
  ON public.service_bundles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for bundle_products
CREATE POLICY "Everyone can view bundle products"
  ON public.bundle_products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_bundles
      WHERE id = bundle_products.bundle_id AND is_active = true
    )
  );

CREATE POLICY "Admins can manage bundle products"
  ON public.bundle_products
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_service_bundles_updated_at
  BEFORE UPDATE ON public.service_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample bundles (you can customize these)
INSERT INTO public.service_bundles (bundle_name, bundle_description, total_arr) VALUES
  ('Full Package', 'Complete accounting solution', 15250),
  ('Basic Package', 'Essential bookkeeping and VAT', 14000),
  ('Compliance Only', 'Tax compliance services', 3250);
-- Create service_fees table for storing product/bundle fee configurations
CREATE TABLE public.service_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  bundle_id UUID REFERENCES public.service_bundles(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL DEFAULT 'fixed' CHECK (fee_type IN ('fixed', 'percentage')),
  service_charge NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AED',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT service_fees_product_or_bundle CHECK (
    (product_id IS NOT NULL AND bundle_id IS NULL) OR 
    (product_id IS NULL AND bundle_id IS NOT NULL)
  )
);

-- Create indexes for faster lookups
CREATE INDEX idx_service_fees_product_id ON public.service_fees(product_id);
CREATE INDEX idx_service_fees_bundle_id ON public.service_fees(bundle_id);

-- Enable RLS
ALTER TABLE public.service_fees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view service fees"
  ON public.service_fees FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage service fees"
  ON public.service_fees FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_service_fees_updated_at
  BEFORE UPDATE ON public.service_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
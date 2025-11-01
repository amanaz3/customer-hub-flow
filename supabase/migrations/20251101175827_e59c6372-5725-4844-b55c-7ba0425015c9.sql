-- Add service_category_id to products table
ALTER TABLE public.products
ADD COLUMN service_category_id UUID REFERENCES public.service_category(id);

-- Create index for better performance
CREATE INDEX idx_products_service_category ON public.products(service_category_id);

-- Update existing products with their service categories
-- First, get the category IDs (we'll need to insert categories if they don't exist)

-- Insert service categories if they don't exist
INSERT INTO public.service_category (category_name, is_active)
VALUES 
  ('Compliance', true),
  ('Banking/Finance', true),
  ('Tax', true)
ON CONFLICT DO NOTHING;

-- Update products based on their names
UPDATE public.products
SET service_category_id = (SELECT id FROM public.service_category WHERE category_name = 'Compliance')
WHERE name IN ('Company formation', 'GoAML Reg', 'Corporate Tax Registration');

UPDATE public.products
SET service_category_id = (SELECT id FROM public.service_category WHERE category_name = 'Banking/Finance')
WHERE name IN ('Business Bank Account', 'Home Finance');

UPDATE public.products
SET service_category_id = (SELECT id FROM public.service_category WHERE category_name = 'Tax')
WHERE name IN ('VAT', 'Corporate Tax Filing', 'Book keeping');
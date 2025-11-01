-- Create service_category table
CREATE TABLE public.service_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_category ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active service categories"
  ON public.service_category
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage service categories"
  ON public.service_category
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default categories
INSERT INTO public.service_category (category_name) VALUES
  ('Compliance'),
  ('Banking/Finance'),
  ('Tax');

-- Create trigger for updated_at
CREATE TRIGGER update_service_category_updated_at
  BEFORE UPDATE ON public.service_category
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
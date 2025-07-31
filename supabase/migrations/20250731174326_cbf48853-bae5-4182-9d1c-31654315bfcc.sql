-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_products junction table for assigning products to users
CREATE TABLE public.user_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Add product_id to customers table
ALTER TABLE public.customers 
ADD COLUMN product_id UUID REFERENCES public.products(id);

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_products table  
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for products table
CREATE POLICY "Everyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all products" 
ON public.products 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS policies for user_products table
CREATE POLICY "Users can view their assigned products" 
ON public.user_products 
FOR SELECT 
USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage user product assignments" 
ON public.user_products 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Function to get user's assigned products
CREATE OR REPLACE FUNCTION public.get_user_products(user_uuid UUID)
RETURNS TABLE(product_id UUID, product_name TEXT, product_description TEXT)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT p.id, p.name, p.description
  FROM public.products p
  INNER JOIN public.user_products up ON p.id = up.product_id
  WHERE up.user_id = user_uuid AND p.is_active = true;
$$;

-- Create trigger for updating products updated_at
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_products_updated_at();
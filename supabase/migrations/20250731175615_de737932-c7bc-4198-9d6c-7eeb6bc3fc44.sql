-- Create functions for product management

-- Function to get all products
CREATE OR REPLACE FUNCTION public.get_products()
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  is_active boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id, name, description, is_active, created_at, updated_at
  FROM public.products
  ORDER BY created_at DESC;
$$;

-- Function to create a product
CREATE OR REPLACE FUNCTION public.create_product(
  product_name text,
  product_description text,
  product_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can create products';
  END IF;
  
  INSERT INTO public.products (name, description, is_active)
  VALUES (product_name, product_description, product_is_active);
END;
$$;

-- Function to update a product
CREATE OR REPLACE FUNCTION public.update_product(
  product_id uuid,
  product_name text,
  product_description text,
  product_is_active boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can update products';
  END IF;
  
  UPDATE public.products 
  SET 
    name = product_name,
    description = product_description,
    is_active = product_is_active,
    updated_at = now()
  WHERE id = product_id;
END;
$$;

-- Function to delete a product
CREATE OR REPLACE FUNCTION public.delete_product(
  product_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can delete products';
  END IF;
  
  DELETE FROM public.products WHERE id = product_id;
END;
$$;
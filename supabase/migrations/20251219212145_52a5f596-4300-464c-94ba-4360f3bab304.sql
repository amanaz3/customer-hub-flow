-- Function to get all public tables
CREATE OR REPLACE FUNCTION public.get_public_tables()
RETURNS TABLE(table_name text) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tablename::text as table_name
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
$$;
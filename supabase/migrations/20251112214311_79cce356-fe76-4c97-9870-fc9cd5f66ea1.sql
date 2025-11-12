-- Create function to get table column types
CREATE OR REPLACE FUNCTION public.get_table_column_types(p_table_name text)
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT
    c.column_name::text,
    c.data_type::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$function$;
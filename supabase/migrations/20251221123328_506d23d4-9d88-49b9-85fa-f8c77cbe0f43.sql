-- Function to get unique constraints for a table
CREATE OR REPLACE FUNCTION public.get_table_unique_constraints(p_table_name text)
RETURNS TABLE(
  constraint_name text,
  column_names text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    tc.constraint_name::text,
    string_agg(kcu.column_name::text, ', ' ORDER BY kcu.ordinal_position) AS column_names
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_name = p_table_name
    AND tc.table_schema = 'public'
  GROUP BY tc.constraint_name;
$function$;
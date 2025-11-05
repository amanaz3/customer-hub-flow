-- Function to get primary keys for a table
CREATE OR REPLACE FUNCTION public.get_table_primary_keys(p_table_name text)
RETURNS TABLE(column_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT a.attname::text
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = (
    SELECT oid 
    FROM pg_class 
    WHERE relname = p_table_name 
    AND relnamespace = 'public'::regnamespace
  )
  AND i.indisprimary = true;
$function$;

-- Function to get foreign keys for a table
CREATE OR REPLACE FUNCTION public.get_table_foreign_keys(p_table_name text)
RETURNS TABLE(
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    kcu.column_name::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = p_table_name
    AND tc.table_schema = 'public';
$function$;

-- Function to get indexes for a table
CREATE OR REPLACE FUNCTION public.get_table_indexes(p_table_name text)
RETURNS TABLE(
  index_name text,
  column_names text,
  is_unique boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    i.relname::text AS index_name,
    string_agg(a.attname, ', ' ORDER BY array_position(ix.indkey, a.attnum))::text AS column_names,
    ix.indisunique AS is_unique
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
  WHERE t.relkind = 'r'
    AND t.relname = p_table_name
    AND t.relnamespace = 'public'::regnamespace
    AND NOT ix.indisprimary
  GROUP BY i.relname, ix.indisunique
  ORDER BY i.relname;
$function$;
-- Fix the lowercase_application_status trigger function
-- Need to cast enum to text before using LOWER(), then cast back to enum
CREATE OR REPLACE FUNCTION public.lowercase_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.status = LOWER(NEW.status::text)::application_status;
  RETURN NEW;
END;
$function$;
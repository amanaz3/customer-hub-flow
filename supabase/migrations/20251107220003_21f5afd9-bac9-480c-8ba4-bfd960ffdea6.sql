-- Fix search_path security issue for new functions
CREATE OR REPLACE FUNCTION generate_customer_reference()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN nextval('customer_reference_seq')::INTEGER;
END;
$$;

CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS INTEGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN nextval('application_reference_seq')::INTEGER;
END;
$$;

CREATE OR REPLACE FUNCTION set_customer_reference()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_customer_reference();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_application_reference()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_application_reference();
  END IF;
  RETURN NEW;
END;
$$;
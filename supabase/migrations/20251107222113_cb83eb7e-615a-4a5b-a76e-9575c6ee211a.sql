-- Fix search_path security issue for lowercase_application_status function
-- Drop the trigger first, then the function, then recreate both

DROP TRIGGER IF EXISTS ensure_lowercase_application_status ON account_applications;
DROP FUNCTION IF EXISTS lowercase_application_status();

CREATE OR REPLACE FUNCTION lowercase_application_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status = LOWER(NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER ensure_lowercase_application_status
  BEFORE INSERT OR UPDATE ON account_applications
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_application_status();
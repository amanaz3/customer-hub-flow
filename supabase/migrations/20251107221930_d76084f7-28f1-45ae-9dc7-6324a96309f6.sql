-- Fix status capitalization inconsistency in account_applications
-- Normalize all status values to lowercase

-- Update account_applications to use lowercase status values
UPDATE account_applications 
SET status = LOWER(status)
WHERE status != LOWER(status);

-- Add a check constraint to prevent future capitalization issues
ALTER TABLE account_applications 
ADD CONSTRAINT check_status_lowercase 
CHECK (status = LOWER(status));

-- Create a trigger function to automatically lowercase status on insert/update
CREATE OR REPLACE FUNCTION lowercase_application_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status = LOWER(NEW.status);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure lowercase status
CREATE TRIGGER ensure_lowercase_application_status
  BEFORE INSERT OR UPDATE ON account_applications
  FOR EACH ROW
  EXECUTE FUNCTION lowercase_application_status();
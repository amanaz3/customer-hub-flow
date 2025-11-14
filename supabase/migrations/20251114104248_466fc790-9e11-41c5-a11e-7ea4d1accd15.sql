-- Create sequence for application reference numbers (starting after current max)
CREATE SEQUENCE IF NOT EXISTS application_reference_seq START WITH 1001;

-- Add UNIQUE constraint to reference_number column
ALTER TABLE account_applications 
ADD CONSTRAINT unique_application_reference UNIQUE (reference_number);

-- Create function to set application reference number
CREATE OR REPLACE FUNCTION set_application_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := nextval('application_reference_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-assign reference numbers on INSERT
CREATE TRIGGER set_application_reference_trigger
  BEFORE INSERT ON account_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_reference();

-- Grant usage on sequence to authenticated and anonymous users
GRANT USAGE ON SEQUENCE application_reference_seq TO authenticated;
GRANT USAGE ON SEQUENCE application_reference_seq TO anon;
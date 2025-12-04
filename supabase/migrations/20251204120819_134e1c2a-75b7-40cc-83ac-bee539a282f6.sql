-- Create sequence for customer reference numbers if not exists
CREATE SEQUENCE IF NOT EXISTS customer_reference_seq START WITH 1;

-- Set sequence to current max value to avoid conflicts with existing data
SELECT setval('customer_reference_seq', COALESCE((SELECT MAX(reference_number) FROM customers), 0));

-- Create or replace function to set customer reference number
CREATE OR REPLACE FUNCTION set_customer_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := nextval('customer_reference_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating reference_number
DROP TRIGGER IF EXISTS set_customer_reference_trigger ON customers;
CREATE TRIGGER set_customer_reference_trigger
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION set_customer_reference();

-- Set column default to use sequence
ALTER TABLE customers ALTER COLUMN reference_number SET DEFAULT nextval('customer_reference_seq');
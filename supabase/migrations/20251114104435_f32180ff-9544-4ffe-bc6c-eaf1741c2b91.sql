-- Create sequence for customer reference numbers (starting at 1)
CREATE SEQUENCE IF NOT EXISTS customer_reference_seq START WITH 1;

-- Add UNIQUE constraint to reference_number column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_customer_reference'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT unique_customer_reference UNIQUE (reference_number);
  END IF;
END $$;

-- Create trigger to auto-assign reference numbers on INSERT if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_customer_reference_trigger'
  ) THEN
    CREATE TRIGGER set_customer_reference_trigger
      BEFORE INSERT ON customers
      FOR EACH ROW
      EXECUTE FUNCTION set_customer_reference();
  END IF;
END $$;

-- Grant usage on sequence to authenticated and anonymous users
GRANT USAGE ON SEQUENCE customer_reference_seq TO authenticated;
GRANT USAGE ON SEQUENCE customer_reference_seq TO anon;
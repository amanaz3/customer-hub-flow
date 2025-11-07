-- Add reference_number columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS reference_number INTEGER UNIQUE;
ALTER TABLE account_applications ADD COLUMN IF NOT EXISTS reference_number INTEGER UNIQUE;

-- Create sequences
CREATE SEQUENCE IF NOT EXISTS customer_reference_seq START 1 MAXVALUE 999;
CREATE SEQUENCE IF NOT EXISTS application_reference_seq START 1001 MAXVALUE 9999;

-- Create function to generate customer reference number
CREATE OR REPLACE FUNCTION generate_customer_reference()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('customer_reference_seq')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate application reference number
CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('application_reference_seq')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing customers with sequential numbers
WITH numbered_customers AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM customers
  WHERE reference_number IS NULL
)
UPDATE customers c
SET reference_number = nc.rn
FROM numbered_customers nc
WHERE c.id = nc.id;

-- Backfill existing applications with sequential numbers starting at 1001
WITH numbered_applications AS (
  SELECT id, (1000 + ROW_NUMBER() OVER (ORDER BY created_at)) as rn
  FROM account_applications
  WHERE reference_number IS NULL
)
UPDATE account_applications a
SET reference_number = na.rn
FROM numbered_applications na
WHERE a.id = na.id;

-- Set sequences to continue from highest existing numbers
SELECT setval('customer_reference_seq', 
  COALESCE((SELECT MAX(reference_number) FROM customers), 0) + 1,
  false
);

SELECT setval('application_reference_seq', 
  COALESCE((SELECT MAX(reference_number) FROM account_applications), 1000) + 1,
  false
);

-- Create triggers for auto-generation on insert
CREATE OR REPLACE FUNCTION set_customer_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_customer_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_application_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_application_reference();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_reference ON customers;
CREATE TRIGGER trigger_set_customer_reference
BEFORE INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION set_customer_reference();

DROP TRIGGER IF EXISTS trigger_set_application_reference ON account_applications;
CREATE TRIGGER trigger_set_application_reference
BEFORE INSERT ON account_applications
FOR EACH ROW
EXECUTE FUNCTION set_application_reference();

-- Make columns NOT NULL after backfill
ALTER TABLE customers ALTER COLUMN reference_number SET NOT NULL;
ALTER TABLE account_applications ALTER COLUMN reference_number SET NOT NULL;

-- Add check constraints
ALTER TABLE customers ADD CONSTRAINT check_customer_reference_range 
  CHECK (reference_number >= 1 AND reference_number <= 999);
ALTER TABLE account_applications ADD CONSTRAINT check_application_reference_range 
  CHECK (reference_number >= 1000 AND reference_number <= 9999);

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_customers_reference ON customers(reference_number);
CREATE INDEX IF NOT EXISTS idx_applications_reference ON account_applications(reference_number);
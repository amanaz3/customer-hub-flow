
-- Add new columns to the customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS preferred_bank TEXT,
ADD COLUMN IF NOT EXISTS annual_turnover DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS jurisdiction TEXT CHECK (jurisdiction IN ('Mainland', 'Freezone')),
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

-- Update existing customers to have jurisdiction based on license_type
UPDATE public.customers 
SET jurisdiction = CASE 
  WHEN license_type = 'Mainland' THEN 'Mainland'
  WHEN license_type = 'Freezone' THEN 'Freezone'
  ELSE 'Mainland'
END
WHERE jurisdiction IS NULL;

-- Create new document templates for the structured upload sections
DELETE FROM public.documents WHERE customer_id NOT IN (SELECT id FROM public.customers);

-- Update the create_default_documents function to create structured documents
CREATE OR REPLACE FUNCTION public.create_default_documents()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Company Documents
  INSERT INTO public.documents (customer_id, name, is_mandatory, category) VALUES
    (NEW.id, 'Trade License', TRUE, 'company'),
    (NEW.id, 'MOA', TRUE, 'company'),
    (NEW.id, 'Incorporation Certificate', FALSE, 'company'),
    (NEW.id, 'Share Certificate', FALSE, 'company'),
    (NEW.id, 'Ejari', FALSE, 'company'),
    (NEW.id, 'Company Profile', FALSE, 'company'),
    (NEW.id, 'Other Company Document', FALSE, 'company');
  
  -- Shareholder Documents
  INSERT INTO public.documents (customer_id, name, is_mandatory, category) VALUES
    (NEW.id, 'Passport', TRUE, 'shareholder'),
    (NEW.id, 'Emirates ID', TRUE, 'shareholder'),
    (NEW.id, 'CV', FALSE, 'shareholder'),
    (NEW.id, 'Residential Address Proof', FALSE, 'shareholder');
  
  -- Source of Funds
  INSERT INTO public.documents (customer_id, name, is_mandatory, category) VALUES
    (NEW.id, 'Bank Statements', FALSE, 'funds'),
    (NEW.id, 'Other Company Bank Statement', FALSE, 'funds'),
    (NEW.id, 'Trade License of Other Company', FALSE, 'funds');
  
  -- Additional Information
  INSERT INTO public.documents (customer_id, name, is_mandatory, category) VALUES
    (NEW.id, 'Customer Supplier Name', FALSE, 'additional'),
    (NEW.id, 'Annual Turnover Document', FALSE, 'additional'),
    (NEW.id, 'Monthly Cash Deposits Record', FALSE, 'additional'),
    (NEW.id, 'Monthly Withdrawals Record', FALSE, 'additional');
  
  RETURN NEW;
END;
$function$;

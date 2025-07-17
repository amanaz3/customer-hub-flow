-- Remove the restrictive jurisdiction constraint and add proper jurisdiction options
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_jurisdiction_check;

-- Add a new constraint with proper UAE jurisdictions
ALTER TABLE public.customers ADD CONSTRAINT customers_jurisdiction_check 
CHECK (jurisdiction IN ('Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Mainland', 'Freezone', 'Other'));

-- Update the existing form to ensure it handles these values correctly
COMMENT ON COLUMN public.customers.jurisdiction IS 'UAE Emirate or jurisdiction where the business will be established';
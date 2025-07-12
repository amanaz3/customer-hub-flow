-- Drop the old trigger and function that uses invalid categories
DROP TRIGGER IF EXISTS trigger_create_default_documents ON customers;
DROP FUNCTION IF EXISTS public.create_default_documents();

-- The CustomerService.createDefaultDocuments method will handle document creation instead
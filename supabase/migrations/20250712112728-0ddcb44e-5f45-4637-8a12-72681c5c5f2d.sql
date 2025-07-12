-- Drop the old trigger and function with CASCADE to remove dependencies
DROP FUNCTION IF EXISTS public.create_default_documents() CASCADE;
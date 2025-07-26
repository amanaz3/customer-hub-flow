-- Add document_checklist_complete field to customers table
ALTER TABLE public.customers 
ADD COLUMN document_checklist_complete BOOLEAN NOT NULL DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.customers.document_checklist_complete IS 'Indicates whether an admin has confirmed all documents are reviewed and complete';

-- Add index for performance
CREATE INDEX idx_customers_document_checklist ON public.customers(document_checklist_complete);
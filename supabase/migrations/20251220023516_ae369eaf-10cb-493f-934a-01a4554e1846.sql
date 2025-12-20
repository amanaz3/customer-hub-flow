-- Create enum for tax filing status
CREATE TYPE public.tax_filing_status AS ENUM ('draft', 'in_progress', 'ready_for_review', 'submitted', 'accepted', 'rejected');

-- Create tax_filings table
CREATE TABLE public.tax_filings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number serial NOT NULL,
  
  -- Financial period
  tax_year integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Company details
  company_name text NOT NULL,
  trade_license_number text,
  trn_number text, -- Tax Registration Number
  jurisdiction text DEFAULT 'UAE',
  
  -- Financial data
  total_revenue numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  taxable_income numeric DEFAULT 0,
  tax_liability numeric DEFAULT 0,
  tax_rate numeric DEFAULT 9.0, -- UAE Corporate Tax rate
  small_business_relief boolean DEFAULT false,
  
  -- Bookkeeping status
  bookkeeping_complete boolean DEFAULT false,
  bookkeeping_verified_at timestamp with time zone,
  bookkeeping_verified_by uuid REFERENCES public.profiles(id),
  
  -- Workflow status
  status tax_filing_status NOT NULL DEFAULT 'draft',
  current_step text DEFAULT 'verify_bookkeeping',
  
  -- FTA submission
  fta_submission_date timestamp with time zone,
  fta_reference text,
  fta_response jsonb,
  
  -- AI assistant data
  ai_conversation_history jsonb DEFAULT '[]'::jsonb,
  ai_recommendations jsonb DEFAULT '[]'::jsonb,
  
  -- Audit trail
  created_by uuid REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  customer_id uuid REFERENCES public.customers(id),
  
  -- Metadata
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create tax_filing_documents table
CREATE TABLE public.tax_filing_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tax_filing_id uuid NOT NULL REFERENCES public.tax_filings(id) ON DELETE CASCADE,
  
  document_type text NOT NULL, -- 'financial_statement', 'receipt', 'invoice', 'bank_statement', 'supporting_doc'
  document_category text, -- 'income', 'expense', 'asset', 'liability'
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  
  -- AI extraction
  extracted_data jsonb,
  extraction_confidence numeric,
  
  -- Status
  is_verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamp with time zone,
  
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create tax_filing_line_items table for detailed breakdown
CREATE TABLE public.tax_filing_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tax_filing_id uuid NOT NULL REFERENCES public.tax_filings(id) ON DELETE CASCADE,
  
  category text NOT NULL, -- 'revenue', 'expense', 'deduction', 'exemption'
  subcategory text,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  is_taxable boolean DEFAULT true,
  tax_treatment text, -- 'taxable', 'exempt', 'zero_rated', 'out_of_scope'
  
  -- Source reference
  source_document_id uuid REFERENCES public.tax_filing_documents(id),
  source_type text, -- 'bookkeeper_invoice', 'bookkeeper_bill', 'manual'
  source_reference text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filing_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_filings
CREATE POLICY "Admins can manage all tax filings"
ON public.tax_filings FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their assigned tax filings"
ON public.tax_filings FOR SELECT
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  is_admin(auth.uid())
);

CREATE POLICY "Users can create tax filings"
ON public.tax_filings FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their assigned tax filings"
ON public.tax_filings FOR UPDATE
USING (
  created_by = auth.uid() OR 
  assigned_to = auth.uid() OR
  is_admin(auth.uid())
);

-- RLS Policies for tax_filing_documents
CREATE POLICY "Users can manage tax filing documents"
ON public.tax_filing_documents FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tax_filings tf
    WHERE tf.id = tax_filing_documents.tax_filing_id
    AND (tf.created_by = auth.uid() OR tf.assigned_to = auth.uid() OR is_admin(auth.uid()))
  )
);

-- RLS Policies for tax_filing_line_items
CREATE POLICY "Users can manage tax filing line items"
ON public.tax_filing_line_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.tax_filings tf
    WHERE tf.id = tax_filing_line_items.tax_filing_id
    AND (tf.created_by = auth.uid() OR tf.assigned_to = auth.uid() OR is_admin(auth.uid()))
  )
);

-- Create updated_at trigger
CREATE TRIGGER update_tax_filings_updated_at
BEFORE UPDATE ON public.tax_filings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_filing_documents_updated_at
BEFORE UPDATE ON public.tax_filing_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_filing_line_items_updated_at
BEFORE UPDATE ON public.tax_filing_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_tax_filings_status ON public.tax_filings(status);
CREATE INDEX idx_tax_filings_tax_year ON public.tax_filings(tax_year);
CREATE INDEX idx_tax_filings_created_by ON public.tax_filings(created_by);
CREATE INDEX idx_tax_filings_assigned_to ON public.tax_filings(assigned_to);
CREATE INDEX idx_tax_filing_documents_filing_id ON public.tax_filing_documents(tax_filing_id);
CREATE INDEX idx_tax_filing_line_items_filing_id ON public.tax_filing_line_items(tax_filing_id);
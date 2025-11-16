-- Create application_documents table
CREATE TABLE IF NOT EXISTS public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.account_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT,
  is_uploaded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_owners table
CREATE TABLE IF NOT EXISTS public.application_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.account_applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  passport_number TEXT,
  nationality TEXT,
  ownership_percentage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id 
  ON public.application_documents(application_id);

CREATE INDEX IF NOT EXISTS idx_application_owners_application_id 
  ON public.application_owners(application_id);

-- Enable RLS
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_owners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_documents
CREATE POLICY "Users can view their application documents"
  ON public.application_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_documents.application_id
        AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can manage their application documents"
  ON public.application_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_documents.application_id
        AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- RLS Policies for application_owners
CREATE POLICY "Users can view their application owners"
  ON public.application_owners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_owners.application_id
        AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can manage their application owners"
  ON public.application_owners
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_owners.application_id
        AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_application_documents_updated_at
  BEFORE UPDATE ON public.application_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_application_owners_updated_at
  BEFORE UPDATE ON public.application_owners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
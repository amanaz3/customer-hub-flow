-- Webflow Decision Engine Configuration Tables

-- 1. Countries & Eligibility
CREATE TABLE public.webflow_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(3) NOT NULL UNIQUE,
  country_name VARCHAR(100) NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  risk_level VARCHAR(20) DEFAULT 'standard' CHECK (risk_level IN ('low', 'standard', 'high', 'prohibited')),
  requires_enhanced_due_diligence BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Jurisdictions & Legal Forms
CREATE TABLE public.webflow_jurisdictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jurisdiction_code VARCHAR(50) NOT NULL UNIQUE,
  jurisdiction_name VARCHAR(100) NOT NULL,
  jurisdiction_type VARCHAR(50) NOT NULL CHECK (jurisdiction_type IN ('mainland', 'freezone', 'offshore')),
  emirate VARCHAR(50),
  legal_forms JSONB DEFAULT '[]'::jsonb,
  base_price DECIMAL(10,2) DEFAULT 0,
  processing_days INTEGER DEFAULT 14,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Business Activities & Risk Tags
CREATE TABLE public.webflow_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_code VARCHAR(50) NOT NULL UNIQUE,
  activity_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  risk_level VARCHAR(20) DEFAULT 'standard' CHECK (risk_level IN ('low', 'standard', 'high', 'prohibited')),
  is_restricted BOOLEAN DEFAULT false,
  restriction_reason TEXT,
  requires_approval BOOLEAN DEFAULT false,
  allowed_jurisdictions JSONB DEFAULT '[]'::jsonb,
  additional_requirements JSONB DEFAULT '[]'::jsonb,
  price_modifier DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Pricing & Plans
CREATE TABLE public.webflow_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code VARCHAR(50) NOT NULL UNIQUE,
  plan_name VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  included_services JSONB DEFAULT '[]'::jsonb,
  jurisdiction_pricing JSONB DEFAULT '{}'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Document Requirements Matrix
CREATE TABLE public.webflow_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_code VARCHAR(50) NOT NULL UNIQUE,
  document_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  applies_to_nationalities JSONB DEFAULT '[]'::jsonb,
  applies_to_jurisdictions JSONB DEFAULT '[]'::jsonb,
  applies_to_activities JSONB DEFAULT '[]'::jsonb,
  accepted_formats JSONB DEFAULT '["pdf", "jpg", "png"]'::jsonb,
  max_file_size_mb INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.webflow_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webflow_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webflow_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webflow_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webflow_documents ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (read for all authenticated, write for admin)
CREATE POLICY "Anyone can read webflow_countries" ON public.webflow_countries FOR SELECT USING (true);
CREATE POLICY "Admins can manage webflow_countries" ON public.webflow_countries FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read webflow_jurisdictions" ON public.webflow_jurisdictions FOR SELECT USING (true);
CREATE POLICY "Admins can manage webflow_jurisdictions" ON public.webflow_jurisdictions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read webflow_activities" ON public.webflow_activities FOR SELECT USING (true);
CREATE POLICY "Admins can manage webflow_activities" ON public.webflow_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read webflow_pricing" ON public.webflow_pricing FOR SELECT USING (true);
CREATE POLICY "Admins can manage webflow_pricing" ON public.webflow_pricing FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Anyone can read webflow_documents" ON public.webflow_documents FOR SELECT USING (true);
CREATE POLICY "Admins can manage webflow_documents" ON public.webflow_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_webflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webflow_countries_updated_at BEFORE UPDATE ON public.webflow_countries FOR EACH ROW EXECUTE FUNCTION update_webflow_updated_at();
CREATE TRIGGER update_webflow_jurisdictions_updated_at BEFORE UPDATE ON public.webflow_jurisdictions FOR EACH ROW EXECUTE FUNCTION update_webflow_updated_at();
CREATE TRIGGER update_webflow_activities_updated_at BEFORE UPDATE ON public.webflow_activities FOR EACH ROW EXECUTE FUNCTION update_webflow_updated_at();
CREATE TRIGGER update_webflow_pricing_updated_at BEFORE UPDATE ON public.webflow_pricing FOR EACH ROW EXECUTE FUNCTION update_webflow_updated_at();
CREATE TRIGGER update_webflow_documents_updated_at BEFORE UPDATE ON public.webflow_documents FOR EACH ROW EXECUTE FUNCTION update_webflow_updated_at();
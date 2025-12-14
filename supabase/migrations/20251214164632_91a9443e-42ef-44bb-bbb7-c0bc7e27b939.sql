
-- Create industries table (admin-configurable)
CREATE TABLE public.lead_discovery_industries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discovery sessions table
CREATE TABLE public.lead_discovery_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry_id UUID NOT NULL REFERENCES public.lead_discovery_industries(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  session_name TEXT NOT NULL,
  uploaded_file_name TEXT,
  uploaded_file_path TEXT,
  original_data JSONB,
  final_result JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved prompts table (reusable prompts)
CREATE TABLE public.lead_discovery_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_type TEXT NOT NULL DEFAULT 'filter' CHECK (prompt_type IN ('filter', 'curate', 'transform', 'apply', 'custom')),
  description TEXT,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prompt execution results table (tracks each step in a session)
CREATE TABLE public.lead_discovery_prompt_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.lead_discovery_sessions(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES public.lead_discovery_prompts(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_discovery_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_discovery_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_discovery_prompt_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for industries (admin can manage, all can view active)
CREATE POLICY "Admins can manage industries" ON public.lead_discovery_industries
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view active industries" ON public.lead_discovery_industries
  FOR SELECT USING (is_active = true);

-- RLS Policies for sessions
CREATE POLICY "Admins can manage all sessions" ON public.lead_discovery_sessions
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their own sessions" ON public.lead_discovery_sessions
  FOR SELECT USING (created_by = auth.uid() OR is_admin(auth.uid()));

-- RLS Policies for prompts
CREATE POLICY "Admins can manage all prompts" ON public.lead_discovery_prompts
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view template prompts" ON public.lead_discovery_prompts
  FOR SELECT USING (is_template = true OR created_by = auth.uid() OR is_admin(auth.uid()));

-- RLS Policies for prompt results
CREATE POLICY "Admins can manage all results" ON public.lead_discovery_prompt_results
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view results for their sessions" ON public.lead_discovery_prompt_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lead_discovery_sessions s 
      WHERE s.id = session_id AND (s.created_by = auth.uid() OR is_admin(auth.uid()))
    )
  );

-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) VALUES ('lead-discovery-files', 'lead-discovery-files', false);

-- Storage policies
CREATE POLICY "Admins can manage discovery files" ON storage.objects
  FOR ALL USING (bucket_id = 'lead-discovery-files' AND is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'lead-discovery-files' AND is_admin(auth.uid()));

CREATE POLICY "Users can view their discovery files" ON storage.objects
  FOR SELECT USING (bucket_id = 'lead-discovery-files' AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin(auth.uid())));

-- Seed common industries
INSERT INTO public.lead_discovery_industries (name, description) VALUES
  ('Real Estate', 'Property development, real estate agencies, property management'),
  ('Gold & Diamonds', 'Precious metals, jewelry, gemstones trading'),
  ('Trading', 'Import/export, general trading, commodities'),
  ('Consulting', 'Business consulting, management consulting, advisory'),
  ('Technology', 'IT services, software, tech startups'),
  ('Healthcare', 'Medical services, pharmaceuticals, healthcare providers'),
  ('Construction', 'Building, contracting, civil engineering'),
  ('Hospitality', 'Hotels, restaurants, tourism'),
  ('Manufacturing', 'Production, industrial goods'),
  ('E-commerce', 'Online retail, digital marketplaces');

-- Create indexes for performance
CREATE INDEX idx_discovery_sessions_industry ON public.lead_discovery_sessions(industry_id);
CREATE INDEX idx_discovery_sessions_product ON public.lead_discovery_sessions(product_id);
CREATE INDEX idx_discovery_sessions_status ON public.lead_discovery_sessions(status);
CREATE INDEX idx_discovery_results_session ON public.lead_discovery_prompt_results(session_id);
CREATE INDEX idx_discovery_results_step ON public.lead_discovery_prompt_results(session_id, step_order);

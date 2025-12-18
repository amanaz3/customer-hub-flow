-- Create unified bank readiness configurations table (matching webflow pattern)
CREATE TABLE public.bank_readiness_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'default',
  description TEXT,
  config_data JSONB NOT NULL DEFAULT '{"rules": [], "bankProfiles": []}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version_number INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create version history table
CREATE TABLE public.bank_readiness_configuration_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  configuration_id UUID NOT NULL REFERENCES public.bank_readiness_configurations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  config_data JSONB NOT NULL,
  change_notes TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_readiness_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_readiness_configuration_versions ENABLE ROW LEVEL SECURITY;

-- RLS for configurations
CREATE POLICY "Admins can manage bank readiness configurations" ON public.bank_readiness_configurations
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Everyone can view active bank readiness configurations" ON public.bank_readiness_configurations
  FOR SELECT USING ((is_active = true) OR is_admin(auth.uid()));

-- RLS for versions
CREATE POLICY "Admins can manage bank readiness config versions" ON public.bank_readiness_configuration_versions
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Everyone can view bank readiness config versions" ON public.bank_readiness_configuration_versions
  FOR SELECT USING (true);

-- Migrate existing rules from bank_readiness_rules to the new config
INSERT INTO public.bank_readiness_configurations (name, description, config_data, is_active, version_number)
SELECT 
  'default' as name,
  'Bank Readiness Rules Configuration' as description,
  jsonb_build_object(
    'rules', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'rule_name', r.rule_name,
          'rule_type', r.rule_type,
          'description', r.description,
          'conditions', r.conditions,
          'actions', r.actions,
          'priority', r.priority,
          'is_active', r.is_active
        ) ORDER BY r.priority
      ) FROM public.bank_readiness_rules r),
      '[]'::jsonb
    ),
    'bankProfiles', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', bp.id,
          'bank_code', bp.bank_code,
          'bank_name', bp.bank_name,
          'preferred_jurisdictions', bp.preferred_jurisdictions,
          'preferred_business_models', bp.preferred_business_models,
          'preferred_activities', bp.preferred_activities,
          'avoid_activities', bp.avoid_activities,
          'accepts_non_residents', bp.accepts_non_residents,
          'accepts_high_risk_nationalities', bp.accepts_high_risk_nationalities,
          'risk_tolerance', bp.risk_tolerance,
          'min_monthly_turnover', bp.min_monthly_turnover,
          'processing_time_days', bp.processing_time_days,
          'is_active', bp.is_active
        )
      ) FROM public.bank_profiles bp WHERE bp.is_active = true),
      '[]'::jsonb
    )
  ) as config_data,
  true as is_active,
  1 as version_number;
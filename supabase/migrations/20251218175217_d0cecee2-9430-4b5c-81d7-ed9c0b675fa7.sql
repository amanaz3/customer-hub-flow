-- Create bank_readiness_rules table
CREATE TABLE public.bank_readiness_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'risk_scoring',
  description text,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create bank_profiles table for bank-specific configurations
CREATE TABLE public.bank_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_code text NOT NULL UNIQUE,
  bank_name text NOT NULL,
  preferred_jurisdictions text[] DEFAULT '{}',
  preferred_business_models text[] DEFAULT '{}',
  preferred_activities text[] DEFAULT '{}',
  avoid_activities text[] DEFAULT '{}',
  accepts_non_residents boolean DEFAULT false,
  accepts_high_risk_nationalities boolean DEFAULT false,
  risk_tolerance text DEFAULT 'medium',
  min_monthly_turnover text DEFAULT 'AED 50,000 - 100,000',
  processing_time_days integer DEFAULT 7,
  special_requirements text[],
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_readiness_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_readiness_rules
CREATE POLICY "Everyone can view active rules" ON public.bank_readiness_rules
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage rules" ON public.bank_readiness_rules
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS policies for bank_profiles  
CREATE POLICY "Everyone can view active bank profiles" ON public.bank_profiles
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage bank profiles" ON public.bank_profiles
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_bank_readiness_rules_updated_at
  BEFORE UPDATE ON public.bank_readiness_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bank_profiles_updated_at
  BEFORE UPDATE ON public.bank_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed risk scoring rules
INSERT INTO public.bank_readiness_rules (rule_name, rule_type, description, conditions, actions, priority) VALUES
-- Nationality rules
('High-Risk Nationality', 'risk_scoring', 'Adds 25 points for sanctioned/high-risk nationalities', 
 '[{"field": "applicant_nationality", "operator": "in", "value": ["Iran", "Syria", "North Korea", "Russia", "Belarus", "Myanmar", "Cuba", "Venezuela"]}]',
 '[{"type": "add_score", "value": 25}, {"type": "add_flag", "message": "High-risk nationality - Most banks will decline"}]', 10),

('Medium-Risk Nationality', 'risk_scoring', 'Adds 15 points for elevated-risk nationalities',
 '[{"field": "applicant_nationality", "operator": "in", "value": ["Iraq", "Afghanistan", "Yemen", "Libya", "Sudan", "Somalia", "Pakistan", "Nigeria"]}]',
 '[{"type": "add_score", "value": 15}, {"type": "add_flag", "message": "Medium-risk nationality - Enhanced due diligence required"}]', 20),

-- Residency rules
('Non-UAE Resident', 'risk_scoring', 'Adds 12 points for non-UAE residents',
 '[{"field": "uae_residency", "operator": "equals", "value": false}]',
 '[{"type": "add_score", "value": 12}, {"type": "add_flag", "message": "Non-UAE resident - Limited bank options available"}]', 30),

-- Jurisdiction rules
('Freezone Company', 'risk_scoring', 'Adds 3 points for freezone companies',
 '[{"field": "company_jurisdiction", "operator": "equals", "value": "freezone"}]',
 '[{"type": "add_score", "value": 3}, {"type": "add_flag", "message": "Freezone company - Some mainland-focused banks may have restrictions"}]', 40),

-- Business model rules
('Trading Business', 'risk_scoring', 'Adds 12 points for trading businesses',
 '[{"field": "business_model", "operator": "equals", "value": "trading"}]',
 '[{"type": "add_score", "value": 12}, {"type": "add_flag", "message": "Trading business - Higher scrutiny on source of goods and payments"}]', 50),

('Unspecified Business Model', 'risk_scoring', 'Adds 10 points for other/unspecified business model',
 '[{"field": "business_model", "operator": "equals", "value": "other"}]',
 '[{"type": "add_score", "value": 10}, {"type": "add_flag", "message": "Unspecified business model - Banks prefer clear categorization"}]', 51),

-- Activity risk rules
('High-Risk Activity', 'risk_scoring', 'Adds 20 points for high-risk business activities',
 '[{"field": "license_activity", "operator": "contains_any", "value": ["crypto", "bitcoin", "forex", "money exchange", "gambling", "casino", "tobacco", "weapons", "ammunition", "adult"]}]',
 '[{"type": "add_score", "value": 20}, {"type": "add_flag", "message": "High-risk business activity - Many banks will not accept"}]', 60),

('Medium-Risk Activity', 'risk_scoring', 'Adds 10 points for medium-risk activities',
 '[{"field": "license_activity", "operator": "contains_any", "value": ["real estate", "property", "construction", "import export", "general trading", "gold", "precious metals", "jewelry", "used cars", "automobile trading"]}]',
 '[{"type": "add_score", "value": 10}, {"type": "add_flag", "message": "Medium-risk activity - Additional documentation likely required"}]', 61),

-- Monthly inflow rules
('High Transaction Volume', 'risk_scoring', 'Adds 5 points for very high monthly inflow',
 '[{"field": "expected_monthly_inflow", "operator": "equals", "value": "Above AED 5,000,000"}]',
 '[{"type": "add_score", "value": 5}, {"type": "add_flag", "message": "High transaction volumes - Enhanced monitoring will apply"}]', 70),

('Low Transaction Volume', 'risk_scoring', 'Adds 4 points for very low monthly inflow',
 '[{"field": "expected_monthly_inflow", "operator": "equals", "value": "Below AED 50,000"}]',
 '[{"type": "add_score", "value": 4}, {"type": "add_flag", "message": "Low transaction volume - May limit Tier 1 bank options"}]', 71),

-- Source of funds rules
('High-Risk Source of Funds', 'risk_scoring', 'Adds 12 points for high-risk funding sources',
 '[{"field": "source_of_funds", "operator": "in", "value": ["Gift", "Other", "Loan/Financing"]}]',
 '[{"type": "add_score", "value": 12}, {"type": "add_flag", "message": "Source of funds requires strong documentation"}]', 80),

('Medium-Risk Source of Funds', 'risk_scoring', 'Adds 6 points for medium-risk funding sources',
 '[{"field": "source_of_funds", "operator": "in", "value": ["Inheritance", "Sale of Property"]}]',
 '[{"type": "add_score", "value": 6}, {"type": "add_flag", "message": "Source of funds may need supporting evidence"}]', 81),

-- Payment countries rules
('High-Risk Payment Countries', 'risk_scoring', 'Adds 25 points for payments from sanctioned countries',
 '[{"field": "incoming_payment_countries", "operator": "has_any", "value": ["Iran", "Syria", "North Korea", "Russia", "Belarus", "Myanmar", "Cuba", "Venezuela", "Crimea"]}]',
 '[{"type": "add_score", "value": 25}, {"type": "add_flag", "message": "Payments from sanctioned/high-risk countries"}]', 90),

('Medium-Risk Payment Countries', 'risk_scoring', 'Adds 12 points for payments from elevated-risk countries',
 '[{"field": "incoming_payment_countries", "operator": "has_any", "value": ["Iraq", "Afghanistan", "Yemen", "Libya", "Sudan", "Somalia", "Pakistan", "Nigeria", "Lebanon"]}]',
 '[{"type": "add_score", "value": 12}, {"type": "add_flag", "message": "Payments from elevated-risk countries"}]', 91),

-- Previous rejection rule
('Previous Bank Rejection', 'risk_scoring', 'Adds 18 points if previously rejected',
 '[{"field": "previous_rejection", "operator": "equals", "value": true}]',
 '[{"type": "add_score", "value": 18}, {"type": "add_flag", "message": "Previous bank rejection - Will need to address concerns proactively"}]', 100);

-- Seed bank profiles
INSERT INTO public.bank_profiles (bank_code, bank_name, preferred_jurisdictions, preferred_business_models, preferred_activities, avoid_activities, accepts_non_residents, accepts_high_risk_nationalities, risk_tolerance, min_monthly_turnover, processing_time_days) VALUES
('ENBD', 'Emirates NBD', ARRAY['mainland', 'freezone'], ARRAY['service', 'consulting', 'tech'], ARRAY['technology', 'consulting', 'professional services'], ARRAY['crypto', 'forex', 'gambling'], false, false, 'low', 'AED 100,000 - 500,000', 5),
('ADCB', 'Abu Dhabi Commercial Bank', ARRAY['mainland', 'freezone'], ARRAY['service', 'trading', 'consulting'], ARRAY['trading', 'retail', 'wholesale'], ARRAY['crypto', 'gambling', 'weapons'], false, false, 'medium', 'AED 50,000 - 100,000', 7),
('FAB', 'First Abu Dhabi Bank', ARRAY['mainland'], ARRAY['service', 'consulting', 'tech'], ARRAY['corporate', 'professional'], ARRAY['crypto', 'forex', 'money exchange'], false, false, 'low', 'AED 500,000 - 1,000,000', 10),
('DIB', 'Dubai Islamic Bank', ARRAY['mainland', 'freezone'], ARRAY['service', 'trading'], ARRAY['halal', 'food', 'retail'], ARRAY['alcohol', 'gambling', 'interest-based'], false, false, 'medium', 'AED 50,000 - 100,000', 7),
('RAKBANK', 'RAK Bank', ARRAY['freezone', 'mainland'], ARRAY['service', 'trading', 'other'], ARRAY['sme', 'startup', 'ecommerce'], ARRAY['crypto', 'gambling'], true, false, 'high', 'Below AED 50,000', 3),
('CBD', 'Commercial Bank of Dubai', ARRAY['mainland', 'freezone'], ARRAY['service', 'trading', 'consulting'], ARRAY['trading', 'manufacturing'], ARRAY['crypto', 'weapons'], false, false, 'medium', 'AED 100,000 - 500,000', 5),
('MASHREQ', 'Mashreq Bank', ARRAY['mainland', 'freezone'], ARRAY['service', 'tech', 'consulting'], ARRAY['digital', 'fintech', 'technology'], ARRAY['gambling', 'weapons'], true, false, 'medium', 'AED 100,000 - 500,000', 5),
('NBF', 'National Bank of Fujairah', ARRAY['freezone', 'mainland'], ARRAY['trading', 'service', 'other'], ARRAY['trading', 'general business'], ARRAY['crypto'], true, true, 'high', 'Below AED 50,000', 3),
('AJMAN', 'Ajman Bank', ARRAY['freezone', 'mainland'], ARRAY['service', 'trading', 'other'], ARRAY['sme', 'retail'], ARRAY['crypto', 'gambling'], true, true, 'high', 'Below AED 50,000', 3),
('WIO', 'Wio Bank', ARRAY['freezone', 'mainland'], ARRAY['tech', 'service', 'consulting'], ARRAY['digital', 'startup', 'ecommerce'], ARRAY['gambling', 'weapons'], true, false, 'medium', 'Below AED 50,000', 2);
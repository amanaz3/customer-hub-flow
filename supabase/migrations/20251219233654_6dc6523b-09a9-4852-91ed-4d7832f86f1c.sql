-- Bookkeeper Reconciliation Rules (Typed Approach)
CREATE TABLE public.bookkeeper_reconciliation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  description text,
  jurisdiction text NOT NULL DEFAULT 'ALL', -- 'UAE', 'UK', 'ALL', etc.
  condition_type text NOT NULL, -- 'amount_exact', 'amount_tolerance', 'date_range', 'duplicate_check', 'tax_validation', 'currency_match', 'reference_match'
  params jsonb NOT NULL DEFAULT '{}'::jsonb, -- { tolerance_percent: 2, days_before: 7, etc. }
  priority integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Bookkeeper Global Settings
CREATE TABLE public.bookkeeper_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookkeeper_reconciliation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookkeeper_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reconciliation rules
CREATE POLICY "Admins can manage reconciliation rules"
  ON public.bookkeeper_reconciliation_rules FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active rules"
  ON public.bookkeeper_reconciliation_rules FOR SELECT
  USING (is_active = true);

-- RLS Policies for settings
CREATE POLICY "Admins can manage bookkeeper settings"
  ON public.bookkeeper_settings FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view settings"
  ON public.bookkeeper_settings FOR SELECT
  USING (true);

-- Insert default rules
INSERT INTO public.bookkeeper_reconciliation_rules (rule_name, description, jurisdiction, condition_type, params, priority) VALUES
  ('Exact Amount Match', 'Match when amounts are exactly equal', 'ALL', 'amount_exact', '{}', 10),
  ('Tolerance Match 2%', 'Match within 2% tolerance', 'ALL', 'amount_tolerance', '{"tolerance_percent": 2}', 20),
  ('Date Range 7 Days', 'Match within 7 days before/after', 'ALL', 'date_range', '{"days_before": 7, "days_after": 3}', 30),
  ('Duplicate Detection', 'Flag potential duplicates', 'ALL', 'duplicate_check', '{"fields": ["reference", "amount", "date"]}', 40),
  ('UAE VAT 5%', 'Validate 5% VAT for UAE', 'UAE', 'tax_validation', '{"rate": 5}', 50),
  ('Reference Match', 'Match by reference number', 'ALL', 'reference_match', '{"partial_match": true}', 25),
  ('Currency Match', 'Ensure currencies match', 'ALL', 'currency_match', '{"strict": true}', 15);

-- Insert default settings
INSERT INTO public.bookkeeper_settings (setting_key, setting_value, description) VALUES
  ('min_confidence_score', '{"value": 0.85}', 'Minimum AI confidence score for auto-matching'),
  ('auto_match_enabled', '{"value": true}', 'Enable automatic matching'),
  ('default_tolerance_percent', '{"value": 2}', 'Default amount tolerance percentage');

-- Indexes
CREATE INDEX idx_reconciliation_rules_active ON public.bookkeeper_reconciliation_rules(is_active, jurisdiction);
CREATE INDEX idx_reconciliation_rules_type ON public.bookkeeper_reconciliation_rules(condition_type);

-- Update trigger
CREATE TRIGGER update_bookkeeper_reconciliation_rules_updated_at
  BEFORE UPDATE ON public.bookkeeper_reconciliation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookkeeper_settings_updated_at
  BEFORE UPDATE ON public.bookkeeper_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
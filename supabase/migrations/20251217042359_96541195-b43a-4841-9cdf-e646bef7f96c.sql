-- Create webflow_rules table for decision engine
CREATE TABLE public.webflow_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  rule_type text NOT NULL DEFAULT 'eligibility',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  priority integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webflow_rules ENABLE ROW LEVEL SECURITY;

-- Admin can manage rules
CREATE POLICY "Admins can manage webflow rules"
ON public.webflow_rules
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Everyone can view active rules (for webflow frontend)
CREATE POLICY "Everyone can view active webflow rules"
ON public.webflow_rules
FOR SELECT
USING (is_active = true);

-- Create updated_at trigger
CREATE TRIGGER update_webflow_rules_updated_at
  BEFORE UPDATE ON public.webflow_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default sample rules
INSERT INTO public.webflow_rules (rule_name, rule_type, conditions, actions, priority, is_active, description) VALUES
('Block High Risk Countries', 'eligibility', '[{"id": "c1", "field": "country.risk_level", "operator": "equals", "value": "prohibited"}]', '[{"id": "a1", "type": "block", "message": "Applications from this country are not accepted"}]', 1, true, 'Blocks applications from prohibited countries'),
('Mainland Requires Trade License', 'document', '[{"id": "c1", "field": "jurisdiction.type", "operator": "equals", "value": "mainland"}]', '[{"id": "a1", "type": "require_document", "target": "trade_license", "message": "Trade license required for mainland"}]', 2, true, 'Requires trade license for mainland jurisdictions'),
('Premium Plan Pricing', 'pricing', '[{"id": "c1", "field": "plan.code", "operator": "equals", "value": "premium"}, {"id": "c2", "field": "jurisdiction.type", "operator": "equals", "value": "freezone", "logic": "AND"}]', '[{"id": "a1", "type": "set_price", "value": 15000}]', 3, true, 'Sets premium pricing for freezone');
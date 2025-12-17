-- Add agent rule engine feature flag (master switch for admins)
INSERT INTO feature_flags (feature_key, feature_name, feature_description, is_enabled)
VALUES (
  'agent_rule_engine',
  'Agent Rule Engine Integration',
  'When enabled, agents can use the webflow rule engine for automatic pricing, eligibility checks, and document requirements. Agents can also toggle this off individually in their workflow.',
  false
)
ON CONFLICT (feature_key) DO NOTHING;
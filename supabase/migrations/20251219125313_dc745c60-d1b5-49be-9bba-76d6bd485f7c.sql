-- Smart rules connecting jurisdictions, activities, and banks for Bank Readiness

-- 1. Activity-based jurisdiction + bank recommendations
INSERT INTO bank_readiness_rules (rule_name, rule_type, description, priority, is_active, conditions, actions)
VALUES
  -- Tech/IT Activities
  ('Tech Startup - DSO + ADGM Banks', 'bank_recommendation', 'Tech companies in free zones get fintech-friendly banks', 10, true,
   '[{"field": "license_activity", "operator": "contains", "value": "tech"}, {"field": "company_jurisdiction", "operator": "in", "value": ["dso", "adgm", "difc"]}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Mashreq NEO", "reason": "Digital-first, tech-friendly"}, {"type": "recommend_bank", "bank": "RAKBANK", "reason": "Startup programs"}, {"type": "adjust_score", "value": -5}]'::jsonb),

  -- E-Commerce Activities
  ('E-Commerce - Payment Gateway Banks', 'bank_recommendation', 'E-commerce businesses need payment integration banks', 15, true,
   '[{"field": "license_activity", "operator": "contains", "value": "commerce"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD", "reason": "Strong payment gateway support"}, {"type": "recommend_bank", "bank": "Mashreq", "reason": "E-commerce merchant services"}]'::jsonb),

  -- Trading Activities
  ('General Trading - Mainland Banks', 'bank_recommendation', 'Trading companies benefit from traditional banks', 20, true,
   '[{"field": "license_activity", "operator": "contains", "value": "trading"}, {"field": "company_jurisdiction", "operator": "equals", "value": "mainland"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD", "reason": "Trade finance facilities"}, {"type": "recommend_bank", "bank": "FAB", "reason": "Largest UAE bank, trade services"}]'::jsonb),

  -- Consultancy Activities
  ('Consultancy - Low Risk Banks', 'bank_recommendation', 'Service businesses get wider bank options', 25, true,
   '[{"field": "license_activity", "operator": "contains", "value": "consult"}, {"field": "business_model", "operator": "equals", "value": "service"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "ADCB", "reason": "Professional services friendly"}, {"type": "recommend_bank", "bank": "Emirates NBD", "reason": "Wide branch network"}, {"type": "adjust_score", "value": -10}]'::jsonb),

  -- Real Estate Activities
  ('Real Estate - Escrow Banks', 'bank_recommendation', 'Real estate needs escrow-capable banks', 30, true,
   '[{"field": "license_activity", "operator": "contains", "value": "real estate"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD", "reason": "RERA escrow accounts"}, {"type": "recommend_bank", "bank": "Mashreq", "reason": "Real estate financing"}]'::jsonb),

  -- Crypto/Blockchain Activities
  ('Crypto - Specialized Banks Only', 'bank_recommendation', 'Crypto businesses have limited options', 5, true,
   '[{"field": "license_activity", "operator": "contains", "value": "crypto"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Mashreq NEO", "reason": "Open to regulated crypto"}, {"type": "add_flag", "flag": "Limited banking options - crypto activity"}, {"type": "adjust_score", "value": 25}]'::jsonb),

  -- Food/F&B Activities  
  ('Food Trading - Health Compliance Banks', 'bank_recommendation', 'Food businesses need trade finance', 35, true,
   '[{"field": "license_activity", "operator": "contains", "value": "food"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "FAB", "reason": "Trade finance for imports"}, {"type": "recommend_bank", "bank": "ADCB", "reason": "SME trade facilities"}]'::jsonb),

-- 2. Jurisdiction + Bank matching rules
  -- DIFC Premium Banks
  ('DIFC - Premium Banking', 'bank_recommendation', 'DIFC companies get premium banking options', 40, true,
   '[{"field": "company_jurisdiction", "operator": "equals", "value": "difc"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD Private", "reason": "DIFC branch presence"}, {"type": "recommend_bank", "bank": "Standard Chartered", "reason": "International connectivity"}, {"type": "adjust_score", "value": -5}]'::jsonb),

  -- ADGM Fintech Banks
  ('ADGM - Fintech Banks', 'bank_recommendation', 'ADGM fintech sandbox companies', 41, true,
   '[{"field": "company_jurisdiction", "operator": "equals", "value": "adgm"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "FAB", "reason": "Abu Dhabi flagship bank"}, {"type": "recommend_bank", "bank": "ADCB", "reason": "Strong ADGM presence"}]'::jsonb),

  -- Mainland Multi-Bank
  ('Mainland - Wide Options', 'bank_recommendation', 'Mainland companies have most options', 45, true,
   '[{"field": "company_jurisdiction", "operator": "equals", "value": "mainland"}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD", "reason": "Largest network"}, {"type": "recommend_bank", "bank": "RAKBANK", "reason": "SME focused"}, {"type": "recommend_bank", "bank": "CBD", "reason": "Quick approvals"}]'::jsonb),

-- 3. High-risk nationality + jurisdiction combinations
  ('High Risk Nationality - Mainland Advantage', 'risk_adjustment', 'High-risk nationals better with mainland', 8, true,
   '[{"field": "applicant_nationality", "operator": "in", "value": ["Iranian", "Syrian", "North Korean", "Russian"]}, {"field": "company_jurisdiction", "operator": "equals", "value": "mainland"}]'::jsonb,
   '[{"type": "add_flag", "flag": "Mainland provides more banking options for high-risk nationals"}, {"type": "recommend_bank", "bank": "RAKBANK", "reason": "More flexible compliance"}, {"type": "adjust_score", "value": 10}]'::jsonb),

-- 4. Monthly inflow + bank matching
  ('High Turnover - Premium Banks', 'bank_recommendation', 'High turnover businesses get premium service', 50, true,
   '[{"field": "expected_monthly_inflow", "operator": "in", "value": ["AED 500,000 - 1,000,000", "Above AED 1,000,000"]}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD Business Banking Plus", "reason": "Premium business services"}, {"type": "recommend_bank", "bank": "FAB Business", "reason": "High-value client services"}, {"type": "adjust_score", "value": -10}]'::jsonb),

  ('Low Turnover Startup - Digital Banks', 'bank_recommendation', 'Startups with low turnover use digital banks', 55, true,
   '[{"field": "expected_monthly_inflow", "operator": "in", "value": ["Below AED 50,000", "AED 50,000 - 100,000"]}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Mashreq NEO", "reason": "No minimum balance"}, {"type": "recommend_bank", "bank": "RAKBANK", "reason": "Startup friendly"}]'::jsonb),

-- 5. Previous rejection + bank avoidance
  ('Previous Rejection - Avoid Same Bank', 'bank_avoidance', 'Avoid banks that previously rejected', 3, true,
   '[{"field": "previous_rejection", "operator": "equals", "value": true}]'::jsonb,
   '[{"type": "add_flag", "flag": "Previous rejection - recommend different banks"}, {"type": "adjust_score", "value": 15}]'::jsonb),

-- 6. Non-resident + specific banks
  ('Non-Resident - Limited Banks', 'bank_recommendation', 'Non-residents have fewer options', 12, true,
   '[{"field": "uae_residency", "operator": "equals", "value": false}]'::jsonb,
   '[{"type": "recommend_bank", "bank": "Emirates NBD", "reason": "Accepts non-residents"}, {"type": "recommend_bank", "bank": "Mashreq", "reason": "Non-resident accounts available"}, {"type": "add_flag", "flag": "Non-resident - limited banking options"}, {"type": "adjust_score", "value": 15}]'::jsonb)

ON CONFLICT DO NOTHING;
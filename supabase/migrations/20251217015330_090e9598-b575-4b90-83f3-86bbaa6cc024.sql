-- Update webflow_pricing with jurisdiction-specific fees
UPDATE webflow_pricing 
SET jurisdiction_pricing = '{
  "dubai_mainland": 2500,
  "dubai_freezone": 0,
  "abu_dhabi_mainland": 3000,
  "abu_dhabi_freezone": 500,
  "sharjah_mainland": 1500,
  "sharjah_freezone": 0,
  "rak_mainland": 1000,
  "rak_freezone": 0,
  "ajman_mainland": 800,
  "ajman_freezone": 0,
  "fujairah_mainland": 1200,
  "fujairah_freezone": 0,
  "umm_al_quwain_mainland": 600,
  "umm_al_quwain_freezone": 0
}'::jsonb
WHERE plan_code IN ('starter', 'business', 'complete');

-- Add enhanced_due_diligence columns to webflow_activities
ALTER TABLE webflow_activities 
ADD COLUMN IF NOT EXISTS enhanced_due_diligence boolean DEFAULT false;

ALTER TABLE webflow_activities 
ADD COLUMN IF NOT EXISTS edd_requirements jsonb DEFAULT '[]'::jsonb;

-- Set EDD requirements for high-risk activities
UPDATE webflow_activities SET 
  enhanced_due_diligence = true,
  edd_requirements = '["Source of Funds Declaration", "Bank Reference Letter", "Additional KYC Documents", "Business Plan Review"]'::jsonb
WHERE risk_level = 'high';

-- Add compliance documents for high-risk activities
INSERT INTO webflow_documents (document_code, document_name, description, is_mandatory, applies_to_activities, accepted_formats, max_file_size_mb, is_active, sort_order)
VALUES 
  ('sof_declaration', 'Source of Funds Declaration', 'Signed declaration of source of funds for high-risk activities', false, '["financial_consultancy", "gold_trading", "real_estate_brokerage"]'::jsonb, '["pdf","jpg","png"]'::jsonb, 5, true, 20),
  ('bank_reference', 'Bank Reference Letter', 'Reference letter from existing bank', false, '["financial_consultancy"]'::jsonb, '["pdf"]'::jsonb, 5, true, 21),
  ('detailed_business_plan', 'Detailed Business Plan', 'Comprehensive business plan for high-risk activities', false, '["financial_consultancy", "gold_trading"]'::jsonb, '["pdf","docx"]'::jsonb, 10, true, 22)
ON CONFLICT (document_code) DO UPDATE SET 
  applies_to_activities = EXCLUDED.applies_to_activities,
  is_active = true;
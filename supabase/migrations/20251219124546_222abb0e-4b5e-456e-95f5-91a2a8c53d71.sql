-- Insert jurisdiction recommendation rules based on activity
INSERT INTO webflow_rules (rule_name, rule_type, description, conditions, actions, priority, is_active)
VALUES
-- Tech/Software -> Dubai Tech focused zones
('Tech Software Jurisdiction', 'workflow', 'Recommend tech-focused free zones for software development', 
 '[{"field": "activity_code", "operator": "in", "value": ["TECH-SOFT", "CONS-IT"]}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-DSO", "name": "Dubai Silicon Oasis", "reason": "Specialized for tech companies"}, {"code": "DXB-DIC", "name": "Dubai Internet City", "reason": "Hub for IT and software businesses"}, {"code": "DXB-IFZA", "name": "IFZA Free Zone", "reason": "Cost-effective for tech startups"}]}]'::jsonb,
 10, true),

-- E-Commerce -> DMCC, IFZA, Mainland
('E-Commerce Jurisdiction', 'workflow', 'Recommend jurisdictions for e-commerce businesses',
 '[{"field": "activity_code", "operator": "equals", "value": "TECH-ECOM"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-DMCC", "name": "DMCC Free Zone", "reason": "Excellent for online trading"}, {"code": "DXB-IFZA", "name": "IFZA Free Zone", "reason": "Budget-friendly e-commerce license"}, {"code": "DXB-ML", "name": "Dubai Mainland", "reason": "Full market access"}]}]'::jsonb,
 11, true),

-- Financial Consultancy -> DIFC, ADGM
('Financial Services Jurisdiction', 'workflow', 'Recommend financial centers for financial consultancy',
 '[{"field": "activity_code", "operator": "equals", "value": "CONS-FIN"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-DIFC", "name": "DIFC", "reason": "Premier financial hub"}, {"code": "AUH-ADGM", "name": "ADGM Free Zone", "reason": "Robust regulatory framework"}]}]'::jsonb,
 10, true),

-- General Trading -> DMCC, JAFZA, Mainland
('General Trading Jurisdiction', 'workflow', 'Recommend trading hubs for general trading',
 '[{"field": "activity_code", "operator": "equals", "value": "TRADE-GEN"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-DMCC", "name": "DMCC Free Zone", "reason": "Top free zone for commodities"}, {"code": "DXB-JAFZA", "name": "JAFZA Free Zone", "reason": "Port access for import/export"}, {"code": "DXB-ML", "name": "Dubai Mainland", "reason": "Full UAE market access"}]}]'::jsonb,
 12, true),

-- Foodstuff Trading -> JAFZA, Mainland
('Food Trading Jurisdiction', 'workflow', 'Recommend jurisdictions for food trading',
 '[{"field": "activity_code", "operator": "equals", "value": "TRADE-FOOD"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-JAFZA", "name": "JAFZA Free Zone", "reason": "Cold storage and warehousing"}, {"code": "DXB-ML", "name": "Dubai Mainland", "reason": "Local restaurant supply"}, {"code": "DXB-DAFZA", "name": "DAFZA Free Zone", "reason": "Air cargo for perishables"}]}]'::jsonb,
 12, true),

-- Real Estate -> Mainland only
('Real Estate Jurisdiction', 'workflow', 'Recommend mainland for real estate activities',
 '[{"field": "activity_code", "operator": "in", "value": ["RE-BROKER", "RE-MGMT"]}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-ML", "name": "Dubai Mainland", "reason": "RERA registration required"}, {"code": "AUH-ML", "name": "Abu Dhabi Mainland", "reason": "Abu Dhabi property dealings"}]}]'::jsonb,
 10, true),

-- Management Consultancy -> Flexible options
('Management Consultancy Jurisdiction', 'workflow', 'Recommend flexible options for consultancy',
 '[{"field": "activity_code", "operator": "equals", "value": "CONS-MGMT"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-IFZA", "name": "IFZA Free Zone", "reason": "Cost-effective for services"}, {"code": "DXB-DMCC", "name": "DMCC Free Zone", "reason": "Premium address"}, {"code": "DXB-ML", "name": "Dubai Mainland", "reason": "Government contract eligibility"}]}]'::jsonb,
 13, true),

-- Construction -> Mainland
('Construction Jurisdiction', 'workflow', 'Recommend mainland for construction',
 '[{"field": "activity_code", "operator": "equals", "value": "CONST-GEN"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-ML", "name": "Dubai Mainland", "reason": "Local construction contracts"}, {"code": "AUH-ML", "name": "Abu Dhabi Mainland", "reason": "Government infrastructure"}, {"code": "SHJ-ML", "name": "Sharjah Mainland", "reason": "Northern Emirates projects"}]}]'::jsonb,
 11, true),

-- Education/Training -> Mainland with KHDA
('Education Jurisdiction', 'workflow', 'Recommend jurisdictions for education activities',
 '[{"field": "activity_code", "operator": "equals", "value": "EDU-CENTER"}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-ML", "name": "Dubai Mainland", "reason": "KHDA approval, local access"}, {"code": "DXB-DAFZA", "name": "DAFZA Free Zone", "reason": "Knowledge Village nearby"}]}]'::jsonb,
 11, true),

-- Crypto/Blockchain -> DMCC (VARA), DIFC
('Crypto Jurisdiction', 'workflow', 'Recommend VARA-licensed zones for crypto',
 '[{"field": "activity_code", "operator": "in", "value": ["FIN-CRYPTO", "CRYPTO"]}]'::jsonb,
 '[{"type": "recommend_jurisdiction", "jurisdictions": [{"code": "DXB-DMCC", "name": "DMCC Free Zone", "reason": "VARA regulated"}, {"code": "DXB-DIFC", "name": "DIFC", "reason": "Innovation License for fintech"}]}]'::jsonb,
 9, true);
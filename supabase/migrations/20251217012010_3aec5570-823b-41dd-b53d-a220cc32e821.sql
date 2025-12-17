-- Seed default countries (UAE focus + common nationalities)
INSERT INTO webflow_countries (country_code, country_name, is_blocked, block_reason, risk_level, requires_enhanced_due_diligence, is_active)
VALUES 
  ('AE', 'United Arab Emirates', false, null, 'low', false, true),
  ('IN', 'India', false, null, 'low', false, true),
  ('PK', 'Pakistan', false, null, 'standard', false, true),
  ('GB', 'United Kingdom', false, null, 'low', false, true),
  ('US', 'United States', false, null, 'low', false, true),
  ('CA', 'Canada', false, null, 'low', false, true),
  ('AU', 'Australia', false, null, 'low', false, true),
  ('DE', 'Germany', false, null, 'low', false, true),
  ('FR', 'France', false, null, 'low', false, true),
  ('SA', 'Saudi Arabia', false, null, 'low', false, true),
  ('EG', 'Egypt', false, null, 'standard', false, true),
  ('JO', 'Jordan', false, null, 'standard', false, true),
  ('LB', 'Lebanon', false, null, 'standard', true, true),
  ('PH', 'Philippines', false, null, 'low', false, true),
  ('CN', 'China', false, null, 'standard', false, true),
  ('RU', 'Russia', false, null, 'high', true, true),
  ('IR', 'Iran', true, 'Sanctioned country', 'prohibited', true, true),
  ('KP', 'North Korea', true, 'Sanctioned country', 'prohibited', true, true),
  ('SY', 'Syria', true, 'Sanctioned country', 'prohibited', true, true),
  ('NG', 'Nigeria', false, null, 'high', true, true);

-- Seed default jurisdictions
INSERT INTO webflow_jurisdictions (jurisdiction_code, jurisdiction_name, jurisdiction_type, emirate, legal_forms, base_price, processing_days, is_active, notes)
VALUES 
  ('DXB-ML', 'Dubai Mainland', 'mainland', 'Dubai', '["llc", "sole_establishment", "branch"]'::jsonb, 15000, 7, true, 'Most popular for local trading'),
  ('DXB-DMCC', 'DMCC Free Zone', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 18000, 5, true, 'Best for commodities trading'),
  ('DXB-DAFZA', 'DAFZA Free Zone', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 16000, 5, true, 'Near airport, logistics focused'),
  ('DXB-JAFZA', 'JAFZA Free Zone', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 20000, 7, true, 'Largest free zone, port access'),
  ('DXB-IFZA', 'IFZA Free Zone', 'freezone', 'Dubai', '["llc"]'::jsonb, 12000, 3, true, 'Cost-effective option'),
  ('DXB-DIFC', 'DIFC', 'freezone', 'Dubai', '["llc", "branch"]'::jsonb, 50000, 10, true, 'Financial services hub'),
  ('AUH-ML', 'Abu Dhabi Mainland', 'mainland', 'Abu Dhabi', '["llc", "sole_establishment", "branch"]'::jsonb, 14000, 7, true, 'Capital city, government contracts'),
  ('AUH-ADGM', 'ADGM Free Zone', 'freezone', 'Abu Dhabi', '["llc", "branch"]'::jsonb, 45000, 10, true, 'Financial center'),
  ('SHJ-ML', 'Sharjah Mainland', 'mainland', 'Sharjah', '["llc", "sole_establishment"]'::jsonb, 10000, 7, true, 'Budget-friendly option'),
  ('SHJ-SAIF', 'SAIF Zone', 'freezone', 'Sharjah', '["llc"]'::jsonb, 11000, 5, true, 'Near airport'),
  ('AJM-ML', 'Ajman Mainland', 'mainland', 'Ajman', '["llc", "sole_establishment"]'::jsonb, 8000, 5, true, 'Most affordable'),
  ('AJM-AFZ', 'Ajman Free Zone', 'freezone', 'Ajman', '["llc"]'::jsonb, 9000, 3, true, 'Quick setup'),
  ('RAK-ML', 'RAK Mainland', 'mainland', 'Ras Al Khaimah', '["llc", "sole_establishment"]'::jsonb, 9000, 5, true, 'Growing business hub'),
  ('RAK-FZ', 'RAK Free Zone', 'freezone', 'Ras Al Khaimah', '["llc"]'::jsonb, 10000, 3, true, 'Popular for consultancy'),
  ('RAK-ICC', 'RAK ICC (Offshore)', 'offshore', 'Ras Al Khaimah', '["llc"]'::jsonb, 8000, 2, true, 'Asset protection, no physical presence');

-- Seed default activities
INSERT INTO webflow_activities (activity_code, activity_name, category, risk_level, is_restricted, restriction_reason, requires_approval, allowed_jurisdictions, additional_requirements, price_modifier, is_active)
VALUES 
  ('TRADE-GEN', 'General Trading', 'Trading', 'low', false, null, false, '[]'::jsonb, '[]'::jsonb, 0, true),
  ('TRADE-FOOD', 'Foodstuff Trading', 'Trading', 'standard', false, null, true, '[]'::jsonb, '["Municipality approval", "Food safety certificate"]'::jsonb, 2000, true),
  ('CONS-MGMT', 'Management Consultancy', 'Consultancy', 'low', false, null, false, '[]'::jsonb, '[]'::jsonb, 0, true),
  ('CONS-IT', 'IT Consultancy', 'Consultancy', 'low', false, null, false, '[]'::jsonb, '[]'::jsonb, 0, true),
  ('CONS-FIN', 'Financial Consultancy', 'Consultancy', 'high', true, 'Requires regulatory approval', true, '["DXB-DIFC", "AUH-ADGM"]'::jsonb, '["SCA license", "Professional indemnity insurance"]'::jsonb, 10000, true),
  ('TECH-SOFT', 'Software Development', 'Technology', 'low', false, null, false, '[]'::jsonb, '[]'::jsonb, 0, true),
  ('TECH-ECOM', 'E-Commerce', 'Technology', 'low', false, null, false, '[]'::jsonb, '["E-commerce license add-on"]'::jsonb, 1500, true),
  ('RE-BROKER', 'Real Estate Brokerage', 'Real Estate', 'standard', false, null, true, '[]'::jsonb, '["RERA certification", "Professional exam"]'::jsonb, 5000, true),
  ('RE-MGMT', 'Property Management', 'Real Estate', 'standard', false, null, true, '[]'::jsonb, '["RERA certification"]'::jsonb, 3000, true),
  ('CONST-GEN', 'General Contracting', 'Construction', 'standard', false, null, true, '[]'::jsonb, '["Municipality approval", "Engineer on staff"]'::jsonb, 5000, true),
  ('HEALTH-CLINIC', 'Medical Clinic', 'Healthcare', 'high', true, 'DHA/DOH approval required', true, '[]'::jsonb, '["DHA/DOH license", "Medical director", "Facility approval"]'::jsonb, 25000, true),
  ('HEALTH-PHARM', 'Pharmacy', 'Healthcare', 'high', true, 'DHA/DOH approval required', true, '[]'::jsonb, '["DHA/DOH license", "Pharmacist license", "Drug import permit"]'::jsonb, 30000, true),
  ('FIN-EXCHANGE', 'Money Exchange', 'Financial', 'high', true, 'Central Bank license required', true, '[]'::jsonb, '["Central Bank license", "AML compliance", "Minimum capital AED 2M"]'::jsonb, 50000, true),
  ('CRYPTO', 'Cryptocurrency Trading', 'Financial', 'high', true, 'VARA license required', true, '["DXB-DMCC"]'::jsonb, '["VARA license", "Compliance officer", "Minimum capital AED 500K"]'::jsonb, 75000, true),
  ('EDU-CENTER', 'Training Center', 'Education', 'standard', false, null, true, '[]'::jsonb, '["KHDA approval"]'::jsonb, 5000, true);

-- Seed default documents
INSERT INTO webflow_documents (document_code, document_name, description, is_mandatory, applies_to_nationalities, applies_to_jurisdictions, applies_to_activities, accepted_formats, max_file_size_mb, is_active, sort_order)
VALUES 
  ('PASSPORT', 'Passport Copy', 'Clear color copy of valid passport (minimum 6 months validity)', true, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 1),
  ('PHOTO', 'Passport Photo', 'White background, recent photo', true, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["jpg", "png"]'::jsonb, 2, true, 2),
  ('EID', 'Emirates ID', 'Front and back copy (UAE residents only)', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 3),
  ('VISA', 'UAE Visa Copy', 'Current valid UAE visa (UAE residents only)', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 4),
  ('ADDR_PROOF', 'Address Proof', 'Utility bill or bank statement (not older than 3 months)', true, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 5),
  ('CV', 'CV/Resume', 'Professional CV of shareholder/manager', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf", "doc", "docx"]'::jsonb, 5, true, 6),
  ('NOC', 'NOC from Sponsor', 'No Objection Certificate (UAE employees only)', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 7),
  ('BANK_REF', 'Bank Reference Letter', 'From existing bank relationship', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf"]'::jsonb, 5, true, 8),
  ('BUS_PLAN', 'Business Plan', 'Detailed business plan document', false, '[]'::jsonb, '["DXB-DIFC", "AUH-ADGM"]'::jsonb, '[]'::jsonb, '["pdf", "doc", "docx"]'::jsonb, 10, true, 9),
  ('QUAL_CERT', 'Qualification Certificate', 'Degree or professional certification', false, '[]'::jsonb, '[]'::jsonb, '["CONS-FIN", "HEALTH-CLINIC", "HEALTH-PHARM"]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 10),
  ('PROF_LICENSE', 'Professional License', 'License from home country (if applicable)', false, '[]'::jsonb, '[]'::jsonb, '["HEALTH-CLINIC", "HEALTH-PHARM", "CONS-FIN"]'::jsonb, '["pdf", "jpg", "png"]'::jsonb, 5, true, 11),
  ('INC_CERT', 'Incorporation Certificate', 'For branch/subsidiary setup', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf"]'::jsonb, 5, true, 12),
  ('MOA_AOA', 'MOA/AOA of Parent Company', 'Memorandum and Articles (for branch setup)', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf"]'::jsonb, 10, true, 13),
  ('BOARD_RES', 'Board Resolution', 'Resolution to open UAE entity', false, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '["pdf"]'::jsonb, 5, true, 14),
  ('FIN_STMT', 'Financial Statements', 'Audited financials (last 2 years)', false, '[]'::jsonb, '["DXB-DIFC", "AUH-ADGM"]'::jsonb, '["FIN-EXCHANGE", "CRYPTO"]'::jsonb, '["pdf"]'::jsonb, 20, true, 15);
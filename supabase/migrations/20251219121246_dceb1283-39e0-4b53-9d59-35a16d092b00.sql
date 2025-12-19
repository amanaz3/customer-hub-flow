-- Add remaining UAE banks to bank_profiles
INSERT INTO bank_profiles (bank_code, bank_name, risk_tolerance, min_monthly_turnover, processing_time_days, accepts_non_residents, accepts_high_risk_nationalities, preferred_jurisdictions, preferred_activities, avoid_activities, is_active)
VALUES
  -- Islamic Banks
  ('ADIB', 'Abu Dhabi Islamic Bank', 'medium', 'AED 50,000 - 100,000', 7, false, false, ARRAY['mainland', 'freezone'], ARRAY['halal', 'retail', 'trading'], ARRAY['alcohol', 'gambling', 'interest-based', 'pork'], true),
  ('EIB', 'Emirates Islamic Bank', 'medium', 'AED 50,000 - 100,000', 5, false, false, ARRAY['mainland', 'freezone'], ARRAY['halal', 'retail', 'sme'], ARRAY['alcohol', 'gambling', 'interest-based'], true),
  ('SIB', 'Sharjah Islamic Bank', 'medium', 'AED 50,000 - 100,000', 7, false, false, ARRAY['mainland', 'freezone'], ARRAY['halal', 'retail', 'trading'], ARRAY['alcohol', 'gambling', 'interest-based'], true),
  ('HILAL', 'Al Hilal Bank', 'low', 'AED 100,000 - 500,000', 10, false, false, ARRAY['mainland'], ARRAY['halal', 'corporate', 'professional'], ARRAY['alcohol', 'gambling', 'interest-based', 'crypto'], true),
  
  -- Conventional Banks
  ('BOS', 'Bank of Sharjah', 'medium', 'AED 100,000 - 500,000', 7, false, false, ARRAY['mainland', 'freezone'], ARRAY['trading', 'manufacturing'], ARRAY['crypto', 'gambling'], true),
  ('UAB', 'United Arab Bank', 'medium', 'AED 100,000 - 500,000', 7, true, false, ARRAY['mainland', 'freezone'], ARRAY['trading', 'professional services'], ARRAY['crypto', 'gambling'], true),
  ('NBQ', 'National Bank of Umm Al Qaiwain', 'high', 'Below AED 50,000', 5, true, true, ARRAY['freezone', 'mainland'], ARRAY['sme', 'trading', 'general'], ARRAY['crypto'], true),
  ('INVESTBANK', 'Invest Bank', 'high', 'Below AED 50,000', 5, true, true, ARRAY['freezone', 'mainland'], ARRAY['sme', 'trading'], ARRAY['gambling'], true),
  
  -- International banks with UAE presence
  ('HSBC', 'HSBC Middle East', 'low', 'AED 500,000 - 1,000,000', 14, true, false, ARRAY['mainland', 'DIFC'], ARRAY['corporate', 'international trade', 'professional'], ARRAY['crypto', 'gambling', 'weapons'], true),
  ('SCB', 'Standard Chartered', 'low', 'AED 500,000 - 1,000,000', 14, true, false, ARRAY['mainland', 'DIFC'], ARRAY['corporate', 'international trade'], ARRAY['crypto', 'gambling'], true),
  ('CITI', 'Citibank UAE', 'low', 'AED 1,000,000+', 21, false, false, ARRAY['DIFC', 'mainland'], ARRAY['corporate', 'large enterprise'], ARRAY['crypto', 'gambling', 'high-risk'], true)
ON CONFLICT (bank_code) DO NOTHING;
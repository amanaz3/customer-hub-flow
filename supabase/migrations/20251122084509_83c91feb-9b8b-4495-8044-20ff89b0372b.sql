-- Drop risk_calculation_type and risk_score columns as they're replaced by application_assessment
ALTER TABLE account_applications 
DROP COLUMN IF EXISTS risk_calculation_type,
DROP COLUMN IF EXISTS risk_score;
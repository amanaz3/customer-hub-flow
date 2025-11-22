-- Add risk calculation tracking columns to account_applications table
ALTER TABLE account_applications 
ADD COLUMN risk_calculation_type text CHECK (risk_calculation_type IN ('manual', 'rule', 'ai', 'hybrid')),
ADD COLUMN risk_score numeric CHECK (risk_score >= 0 AND risk_score <= 100);

-- Add comment for documentation
COMMENT ON COLUMN account_applications.risk_calculation_type IS 'Method used to determine risk: manual (user selected), rule (rule-based calculation), ai (AI-powered), hybrid (AI with manual override)';
COMMENT ON COLUMN account_applications.risk_score IS 'Calculated or assigned risk score (0-100 scale)';
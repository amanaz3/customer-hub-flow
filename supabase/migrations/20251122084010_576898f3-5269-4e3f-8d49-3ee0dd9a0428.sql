-- Add application_assessment column to store detailed risk calculation information
ALTER TABLE account_applications 
ADD COLUMN application_assessment JSONB DEFAULT NULL;

COMMENT ON COLUMN account_applications.application_assessment IS 'Stores detailed risk assessment information including calculation breakdown, factors considered, and AI reasoning';
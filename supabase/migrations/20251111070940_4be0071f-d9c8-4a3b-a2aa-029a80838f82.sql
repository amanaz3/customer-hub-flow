-- Add all application_status enum values to customer_status enum
-- This preserves all existing customer_status values and adds new ones from application_status

ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'need more info';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE customer_status ADD VALUE IF NOT EXISTS 'approved';
-- Create table to track application assessment changes
CREATE TABLE IF NOT EXISTS application_assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES account_applications(id) ON DELETE CASCADE,
  previous_assessment JSONB,
  new_assessment JSONB,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'updated', 'deleted')),
  changed_by UUID NOT NULL,
  changed_by_role app_role NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_assessment_history_application ON application_assessment_history(application_id);
CREATE INDEX idx_assessment_history_created_at ON application_assessment_history(created_at DESC);

-- Enable RLS
ALTER TABLE application_assessment_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all assessment history
CREATE POLICY "Admins can view all assessment history"
ON application_assessment_history
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Users can view their own application assessment history
CREATE POLICY "Users can view their application assessment history"
ON application_assessment_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM account_applications aa
    JOIN customers c ON c.id = aa.customer_id
    WHERE aa.id = application_assessment_history.application_id
    AND c.user_id = auth.uid()
  )
);

-- System can insert assessment history
CREATE POLICY "Admins can insert assessment history"
ON application_assessment_history
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));
-- Create application_workflow_steps table for tracking substeps
CREATE TABLE IF NOT EXISTS application_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES account_applications(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(application_id, step_key)
);

-- Create application_step_history table for audit trail
CREATE TABLE IF NOT EXISTS application_step_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES application_workflow_steps(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES account_applications(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  changed_by_role app_role NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_workflow_steps_application ON application_workflow_steps(application_id);
CREATE INDEX idx_workflow_steps_status ON application_workflow_steps(status);
CREATE INDEX idx_workflow_steps_assigned ON application_workflow_steps(assigned_to);
CREATE INDEX idx_step_history_application ON application_step_history(application_id);
CREATE INDEX idx_step_history_step ON application_step_history(step_id);

-- Enable RLS
ALTER TABLE application_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_step_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for application_workflow_steps
CREATE POLICY "Users can view steps for their applications"
  ON application_workflow_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_workflow_steps.application_id
      AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can update steps for their applications"
  ON application_workflow_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_workflow_steps.application_id
      AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "Admins can insert workflow steps"
  ON application_workflow_steps FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete workflow steps"
  ON application_workflow_steps FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for application_step_history
CREATE POLICY "Users can view step history for their applications"
  ON application_step_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_step_history.application_id
      AND (c.user_id = auth.uid() OR is_admin(auth.uid()))
    )
  );

CREATE POLICY "System can insert step history"
  ON application_step_history FOR INSERT
  WITH CHECK (true);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_step_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_workflow_step_updated_at
  BEFORE UPDATE ON application_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_step_timestamp();

-- Create trigger function to log workflow step changes
CREATE OR REPLACE FUNCTION log_workflow_step_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO application_step_history (
      step_id,
      application_id,
      previous_status,
      new_status,
      changed_by,
      changed_by_role,
      comment
    ) VALUES (
      NEW.id,
      NEW.application_id,
      OLD.status,
      NEW.status,
      COALESCE(auth.uid(), NEW.completed_by),
      COALESCE(
        (SELECT role FROM profiles WHERE id = auth.uid()),
        'user'::app_role
      ),
      NEW.notes
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic step history logging
CREATE TRIGGER log_step_status_change
  AFTER UPDATE ON application_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION log_workflow_step_change();
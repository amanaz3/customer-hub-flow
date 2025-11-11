-- Create application_status_changes table
CREATE TABLE IF NOT EXISTS application_status_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES account_applications(id) ON DELETE CASCADE,
  previous_status application_status NOT NULL,
  new_status application_status NOT NULL,
  changed_by uuid NOT NULL,
  changed_by_role app_role NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_application_status_changes_application_id 
  ON application_status_changes(application_id);

CREATE INDEX IF NOT EXISTS idx_application_status_changes_created_at 
  ON application_status_changes(created_at DESC);

-- Enable RLS
ALTER TABLE application_status_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their application status changes"
  ON application_status_changes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM account_applications aa
      JOIN customers c ON c.id = aa.customer_id
      WHERE aa.id = application_status_changes.application_id
        AND c.user_id = auth.uid()
    ) OR is_admin(auth.uid())
  );

CREATE POLICY "Admins can view all application status changes"
  ON application_status_changes FOR SELECT
  USING (is_admin(auth.uid()));

-- Create function to sync completed_actual from application_status_changes
CREATE OR REPLACE FUNCTION sync_completed_actual_from_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if new status is 'completed' (case-insensitive)
  IF LOWER(NEW.new_status::text) = 'completed' THEN
    -- Update account_applications.completed_actual only if it's NULL
    UPDATE account_applications
    SET completed_actual = NEW.created_at
    WHERE id = NEW.application_id
      AND completed_actual IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger on application_status_changes
DROP TRIGGER IF EXISTS trigger_sync_application_completed_actual ON application_status_changes;

CREATE TRIGGER trigger_sync_application_completed_actual
  AFTER INSERT ON application_status_changes
  FOR EACH ROW
  EXECUTE FUNCTION sync_completed_actual_from_status_change();
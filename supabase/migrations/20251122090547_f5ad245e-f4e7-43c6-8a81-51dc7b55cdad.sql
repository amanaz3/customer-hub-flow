-- Add foreign key constraint for changed_by to profiles table
ALTER TABLE application_assessment_history
ADD CONSTRAINT application_assessment_history_changed_by_fkey
FOREIGN KEY (changed_by)
REFERENCES profiles(id)
ON DELETE CASCADE;
-- Create completion_date_history table for audit trail
CREATE TABLE public.completion_date_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.account_applications(id) ON DELETE CASCADE,
  previous_date TIMESTAMP WITH TIME ZONE,
  new_date TIMESTAMP WITH TIME ZONE NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_role app_role NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX idx_completion_date_history_application ON public.completion_date_history(application_id);
CREATE INDEX idx_completion_date_history_changed_by ON public.completion_date_history(changed_by);
CREATE INDEX idx_completion_date_history_created_at ON public.completion_date_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.completion_date_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all completion date history
CREATE POLICY "Admins can view all completion date history"
ON public.completion_date_history
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Users can view completion date history for their own applications
CREATE POLICY "Users can view their application completion history"
ON public.completion_date_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM account_applications aa
    JOIN customers c ON c.id = aa.customer_id
    WHERE aa.id = completion_date_history.application_id
    AND c.user_id = auth.uid()
  )
);

-- Only admins can insert completion date history records
CREATE POLICY "Admins can insert completion date history"
ON public.completion_date_history
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Add comment to table
COMMENT ON TABLE public.completion_date_history IS 'Audit trail for all changes to application completion dates';
COMMENT ON COLUMN public.completion_date_history.previous_date IS 'The completion date before the change';
COMMENT ON COLUMN public.completion_date_history.new_date IS 'The completion date after the change';
COMMENT ON COLUMN public.completion_date_history.changed_by IS 'The user who made the change';
COMMENT ON COLUMN public.completion_date_history.changed_by_role IS 'The role of the user who made the change';
COMMENT ON COLUMN public.completion_date_history.comment IS 'Optional comment explaining the change';
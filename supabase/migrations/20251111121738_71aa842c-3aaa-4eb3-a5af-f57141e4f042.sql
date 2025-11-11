-- Add parent task support to tasks table
ALTER TABLE public.tasks 
ADD COLUMN parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add index for parent-child queries
CREATE INDEX idx_tasks_parent_id ON public.tasks(parent_id);

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.parent_id IS 'References parent task for subtask hierarchies';

-- Update RLS policies to include subtasks access (users can view/edit subtasks if they can access parent)
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
CREATE POLICY "Users can view tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
  OR EXISTS (
    -- Can view subtask if can view parent task
    SELECT 1 FROM public.tasks parent
    WHERE parent.id = tasks.parent_id
      AND (parent.created_by = auth.uid() OR parent.assigned_to = auth.uid())
  )
);
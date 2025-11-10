-- Ensure RLS is enabled on task_attachments and add proper policies
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view attachments (needed so team members can see each other's attachments)
CREATE POLICY "Authenticated can view task attachments"
ON public.task_attachments
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert attachments they upload
CREATE POLICY "Users can insert their task attachments"
ON public.task_attachments
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

-- Allow uploader or admins to delete attachments
CREATE POLICY "Uploader or admin can delete attachments"
ON public.task_attachments
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for task attachments storage

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

-- Allow authenticated users to view task attachments
CREATE POLICY "Authenticated users can view task attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'task-attachments');

-- Allow users to delete their own uploaded attachments
CREATE POLICY "Users can delete task attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments');
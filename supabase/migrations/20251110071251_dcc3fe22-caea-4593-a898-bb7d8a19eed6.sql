-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on task_attachments
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_attachments
CREATE POLICY "Users can view all task attachments"
  ON public.task_attachments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can upload attachments to tasks"
  ON public.task_attachments
  FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own attachments"
  ON public.task_attachments
  FOR DELETE
  USING (auth.uid() = uploaded_by OR is_admin(auth.uid()));

-- Storage policies for task-attachments bucket
CREATE POLICY "Users can view task attachments"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload task attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own task attachments"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'task-attachments' AND auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER update_task_attachments_updated_at
  BEFORE UPDATE ON public.task_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create logs table for storing application errors
CREATE TABLE public.logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    component TEXT,
    user_email TEXT,
    user_id UUID,
    level TEXT NOT NULL DEFAULT 'error',
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all logs" 
ON public.logs 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Only admins can insert logs
CREATE POLICY "Admins can insert logs" 
ON public.logs 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Only admins can delete logs
CREATE POLICY "Admins can delete logs" 
ON public.logs 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Create index for better performance
CREATE INDEX idx_logs_created_at ON public.logs(created_at DESC);
CREATE INDEX idx_logs_level ON public.logs(level);
CREATE INDEX idx_logs_user_email ON public.logs(user_email);
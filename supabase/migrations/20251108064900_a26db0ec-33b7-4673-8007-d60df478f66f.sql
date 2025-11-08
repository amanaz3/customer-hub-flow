-- Add product_id column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_tasks_product_id ON public.tasks(product_id);
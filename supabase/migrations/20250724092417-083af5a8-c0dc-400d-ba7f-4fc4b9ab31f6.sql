-- Add foreign key constraint to ensure customer.user_id references valid profiles
ALTER TABLE public.customers 
ADD CONSTRAINT fk_customers_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
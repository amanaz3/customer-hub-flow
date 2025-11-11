-- Add completion timestamp columns to customers table
ALTER TABLE public.customers
ADD COLUMN completed_at timestamp with time zone,
ADD COLUMN completed_actual timestamp with time zone;

-- Add comment to explain the difference between the two columns
COMMENT ON COLUMN public.customers.completed_at IS 'Business completion date that can be backdated by admins';
COMMENT ON COLUMN public.customers.completed_actual IS 'Immutable system timestamp of when status was first changed to Complete';
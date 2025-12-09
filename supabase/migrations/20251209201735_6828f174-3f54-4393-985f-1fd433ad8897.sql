-- Add DELETE policy for customers table (admin only)
CREATE POLICY "Admins can delete customers"
ON public.customers
FOR DELETE
USING (is_admin(auth.uid()));

-- Add DELETE policy for account_applications table (admin only)
CREATE POLICY "Admins can delete applications"
ON public.account_applications
FOR DELETE
USING (is_admin(auth.uid()));
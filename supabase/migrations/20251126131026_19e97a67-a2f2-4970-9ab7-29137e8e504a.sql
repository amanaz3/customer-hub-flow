-- Add admin-only policies for INSERT/UPDATE/DELETE (if not exist)
DO $$ 
BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_fees' 
    AND policyname = 'Admins can insert service fees'
  ) THEN
    CREATE POLICY "Admins can insert service fees"
    ON public.service_fees
    FOR INSERT
    WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_fees' 
    AND policyname = 'Admins can update service fees'
  ) THEN
    CREATE POLICY "Admins can update service fees"
    ON public.service_fees
    FOR UPDATE
    USING (is_admin(auth.uid()));
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_fees' 
    AND policyname = 'Admins can delete service fees'
  ) THEN
    CREATE POLICY "Admins can delete service fees"
    ON public.service_fees
    FOR DELETE
    USING (is_admin(auth.uid()));
  END IF;
END $$;
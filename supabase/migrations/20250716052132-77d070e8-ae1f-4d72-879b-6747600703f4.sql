-- Add is_active field to profiles table for soft deletion support
ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Remove unused Google Drive field from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS drive_folder_id;

-- Remove unused payment fields from customers table
ALTER TABLE public.customers DROP COLUMN IF EXISTS payment_received;
ALTER TABLE public.customers DROP COLUMN IF EXISTS payment_date;

-- Update RLS policies to respect is_active status
-- Drop existing user view policies and recreate with is_active check
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policy that respects is_active status
CREATE POLICY "Active users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id AND is_active = true);

-- Update admin policies to see all users (including inactive ones for management)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Update user update policies to respect is_active
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Active users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id AND is_active = true);

-- Ensure admin policies remain for user management
CREATE POLICY "Admins can manage user profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Add index on is_active for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Update the handle_new_user function to set is_active = true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role app_role := 'user';
    user_name text;
BEGIN
    -- Extract name from metadata or use email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Extract role from metadata, default to 'user'
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        user_role := (NEW.raw_user_meta_data->>'role')::app_role;
    END IF;
    
    -- Insert profile with is_active = true by default
    INSERT INTO public.profiles (id, email, name, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        true,
        now(),
        now()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error and continue (don't block user creation)
        RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;
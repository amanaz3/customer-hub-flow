-- Create enum for conflict resolution strategies
CREATE TYPE public.access_conflict_strategy AS ENUM ('user_overrides_role', 'most_restrictive', 'most_permissive', 'admin_review');

-- Create enum for expiry behavior
CREATE TYPE public.access_expiry_behavior AS ENUM ('auto_revoke_silent', 'auto_revoke_notify', 'flag_for_review');

-- Create access_management_settings table for global configuration
CREATE TABLE public.access_management_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conflict_strategy access_conflict_strategy NOT NULL DEFAULT 'admin_review',
  expiry_behavior access_expiry_behavior NOT NULL DEFAULT 'flag_for_review',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create access_permissions table for granular access control
CREATE TABLE public.access_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role,
  page_key text NOT NULL,
  feature_key text,
  is_allowed boolean NOT NULL DEFAULT true,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  reason text,
  is_sensitive boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT check_user_or_role CHECK (user_id IS NOT NULL OR role IS NOT NULL)
);

-- Create index for faster lookups
CREATE INDEX idx_access_permissions_user_id ON public.access_permissions(user_id);
CREATE INDEX idx_access_permissions_role ON public.access_permissions(role);
CREATE INDEX idx_access_permissions_page_key ON public.access_permissions(page_key);

-- Enable RLS
ALTER TABLE public.access_management_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for access_management_settings (admin only)
CREATE POLICY "Admins can manage access settings"
ON public.access_management_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS policies for access_permissions (admin only for management, all users can read their own)
CREATE POLICY "Admins can manage all access permissions"
ON public.access_permissions
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view their own access permissions"
ON public.access_permissions
FOR SELECT
USING (user_id = auth.uid());

-- Insert default settings
INSERT INTO public.access_management_settings (conflict_strategy, expiry_behavior)
VALUES ('admin_review', 'flag_for_review');

-- Create function to check page access
CREATE OR REPLACE FUNCTION public.check_page_access(
  _user_id uuid,
  _page_key text,
  _feature_key text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_role app_role;
  _user_permission boolean;
  _role_permission boolean;
  _conflict_strategy access_conflict_strategy;
  _now timestamp with time zone := now();
BEGIN
  -- Get user's role
  SELECT role INTO _user_role FROM profiles WHERE id = _user_id;
  
  -- Admins always have access
  IF _user_role = 'admin' THEN
    RETURN true;
  END IF;
  
  -- Get conflict strategy
  SELECT conflict_strategy INTO _conflict_strategy FROM access_management_settings LIMIT 1;
  
  -- Check user-specific permission (with time constraints)
  SELECT is_allowed INTO _user_permission
  FROM access_permissions
  WHERE user_id = _user_id
    AND page_key = _page_key
    AND (feature_key IS NULL OR feature_key = _feature_key)
    AND (start_date IS NULL OR start_date <= _now)
    AND (end_date IS NULL OR end_date >= _now)
  ORDER BY feature_key NULLS LAST
  LIMIT 1;
  
  -- Check role-based permission (with time constraints)
  SELECT is_allowed INTO _role_permission
  FROM access_permissions
  WHERE role = _user_role
    AND page_key = _page_key
    AND (feature_key IS NULL OR feature_key = _feature_key)
    AND (start_date IS NULL OR start_date <= _now)
    AND (end_date IS NULL OR end_date >= _now)
  ORDER BY feature_key NULLS LAST
  LIMIT 1;
  
  -- Apply conflict resolution strategy
  IF _user_permission IS NOT NULL AND _role_permission IS NOT NULL THEN
    CASE _conflict_strategy
      WHEN 'user_overrides_role' THEN
        RETURN _user_permission;
      WHEN 'most_restrictive' THEN
        RETURN _user_permission AND _role_permission;
      WHEN 'most_permissive' THEN
        RETURN _user_permission OR _role_permission;
      ELSE -- admin_review: user takes precedence but log for review
        RETURN _user_permission;
    END CASE;
  END IF;
  
  -- Return whichever is set, or default to true (allowed)
  RETURN COALESCE(_user_permission, _role_permission, true);
END;
$$;
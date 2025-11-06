-- Create table for role-based notification preferences
CREATE TABLE IF NOT EXISTS public.notification_role_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_type TEXT NOT NULL,
  role app_role NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(status_type, role)
);

-- Create table for user-specific notification preferences
CREATE TABLE IF NOT EXISTS public.notification_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status_type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(status_type, user_id)
);

-- Enable RLS
ALTER TABLE public.notification_role_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for role preferences
CREATE POLICY "Admins can manage role preferences"
  ON public.notification_role_preferences
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view role preferences"
  ON public.notification_role_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

-- RLS Policies for user preferences
CREATE POLICY "Admins can manage user preferences"
  ON public.notification_user_preferences
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can view user preferences"
  ON public.notification_user_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_notification_role_preferences_updated_at
  BEFORE UPDATE ON public.notification_role_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_user_preferences_updated_at
  BEFORE UPDATE ON public.notification_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default role preferences for all roles
INSERT INTO public.notification_role_preferences (status_type, role, is_enabled) VALUES
  ('Complete', 'admin', true),
  ('Complete', 'manager', true),
  ('Complete', 'user', false),
  ('Under Process', 'admin', true),
  ('Under Process', 'manager', true),
  ('Under Process', 'user', false),
  ('Rejected', 'admin', true),
  ('Rejected', 'manager', true),
  ('Rejected', 'user', false),
  ('Pending Documents', 'admin', false),
  ('Pending Documents', 'manager', true),
  ('Pending Documents', 'user', false),
  ('Draft', 'admin', false),
  ('Draft', 'manager', false),
  ('Draft', 'user', false)
ON CONFLICT (status_type, role) DO NOTHING;
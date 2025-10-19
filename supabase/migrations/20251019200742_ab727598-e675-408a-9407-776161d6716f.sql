-- Create monthly targets table
CREATE TABLE IF NOT EXISTS public.monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  target_applications INTEGER DEFAULT 0 CHECK (target_applications >= 0),
  target_completed INTEGER DEFAULT 0 CHECK (target_completed >= 0),
  target_revenue DECIMAL(12,2) DEFAULT 0 CHECK (target_revenue >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Create monthly performance cache table
CREATE TABLE IF NOT EXISTS public.monthly_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  actual_applications INTEGER DEFAULT 0,
  actual_completed INTEGER DEFAULT 0,
  actual_revenue DECIMAL(12,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_targets
CREATE POLICY "Users can view their own targets"
  ON public.monthly_targets
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own targets"
  ON public.monthly_targets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Users can update their own targets"
  ON public.monthly_targets
  FOR UPDATE
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all targets"
  ON public.monthly_targets
  FOR ALL
  USING (is_admin(auth.uid()));

-- RLS Policies for monthly_performance
CREATE POLICY "Users can view their own performance"
  ON public.monthly_performance
  FOR SELECT
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all performance"
  ON public.monthly_performance
  FOR ALL
  USING (is_admin(auth.uid()));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_monthly_targets_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_monthly_targets_updated_at
  BEFORE UPDATE ON public.monthly_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monthly_targets_updated_at();

-- Function to calculate monthly performance for a user
CREATE OR REPLACE FUNCTION public.calculate_monthly_performance(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE (
  actual_applications BIGINT,
  actual_completed BIGINT,
  actual_revenue DECIMAL,
  completion_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as actual_applications,
    COUNT(*) FILTER (WHERE status = 'Complete')::BIGINT as actual_completed,
    COALESCE(SUM(amount) FILTER (WHERE status = 'Complete'), 0)::DECIMAL as actual_revenue,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE status = 'Complete')::DECIMAL / COUNT(*)::DECIMAL) * 100, 2)
      ELSE 0
    END as completion_rate
  FROM public.customers
  WHERE 
    (user_id = p_user_id OR p_user_id IS NULL)
    AND EXTRACT(MONTH FROM created_at) = p_month
    AND EXTRACT(YEAR FROM created_at) = p_year;
END;
$$;

-- Function to get or create target for current month
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_target(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id UUID;
BEGIN
  -- Try to get existing target
  SELECT id INTO v_target_id
  FROM public.monthly_targets
  WHERE user_id = p_user_id
    AND month = p_month
    AND year = p_year;
  
  -- If not found, create one
  IF v_target_id IS NULL THEN
    INSERT INTO public.monthly_targets (user_id, month, year)
    VALUES (p_user_id, p_month, p_year)
    RETURNING id INTO v_target_id;
  END IF;
  
  RETURN v_target_id;
END;
$$;
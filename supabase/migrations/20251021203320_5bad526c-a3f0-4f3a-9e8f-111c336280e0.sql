-- Create quarterly performance calculation function
CREATE OR REPLACE FUNCTION public.calculate_quarterly_performance(
  p_user_id uuid,
  p_quarter integer,  -- 1-4
  p_year integer
)
RETURNS TABLE(
  actual_applications bigint,
  actual_completed bigint,
  actual_revenue numeric,
  completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  start_month integer;
  end_month integer;
BEGIN
  start_month := (p_quarter - 1) * 3 + 1;
  end_month := p_quarter * 3;
  
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
    AND EXTRACT(MONTH FROM created_at) BETWEEN start_month AND end_month
    AND EXTRACT(YEAR FROM created_at) = p_year;
END;
$$;

-- Create annual performance calculation function
CREATE OR REPLACE FUNCTION public.calculate_annual_performance(
  p_user_id uuid,
  p_year integer
)
RETURNS TABLE(
  actual_applications bigint,
  actual_completed bigint,
  actual_revenue numeric,
  completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    AND EXTRACT(YEAR FROM created_at) = p_year;
END;
$$;
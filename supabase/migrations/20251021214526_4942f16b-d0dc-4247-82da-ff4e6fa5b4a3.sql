-- =====================================================
-- ARR Target Management System - Database Schema
-- =====================================================

-- 1. SERVICE TYPES TABLE
-- Define the service catalog with pricing
CREATE TABLE IF NOT EXISTS public.service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_code TEXT NOT NULL UNIQUE,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'one-time')),
  arr_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  billing_period TEXT NOT NULL CHECK (billing_period IN ('month', 'quarter', 'year', 'one-time')),
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CUSTOMER SERVICES TABLE
-- Track which services each customer has
CREATE TABLE IF NOT EXISTS public.customer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES public.service_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  arr_contribution DECIMAL(10, 2) NOT NULL DEFAULT 0,
  next_billing_date DATE,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ARR TARGETS TABLE
-- ARR-focused monthly targets for users
CREATE TABLE IF NOT EXISTS public.arr_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  target_new_arr DECIMAL(12, 2) NOT NULL DEFAULT 48000,
  target_upsell_arr DECIMAL(12, 2) NOT NULL DEFAULT 32000,
  target_total_arr DECIMAL(12, 2) NOT NULL DEFAULT 80000,
  target_new_clients INTEGER NOT NULL DEFAULT 4,
  target_upsell_deals INTEGER NOT NULL DEFAULT 18,
  target_meetings INTEGER NOT NULL DEFAULT 2,
  target_checkins INTEGER NOT NULL DEFAULT 5,
  target_proposals INTEGER NOT NULL DEFAULT 3,
  target_closes INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- 4. ARR PERFORMANCE TABLE
-- Track actual ARR performance
CREATE TABLE IF NOT EXISTS public.arr_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  actual_new_arr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  actual_upsell_arr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  actual_total_arr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  new_clients_count INTEGER NOT NULL DEFAULT 0,
  upsell_deals_count INTEGER NOT NULL DEFAULT 0,
  meetings_held INTEGER NOT NULL DEFAULT 0,
  checkins_completed INTEGER NOT NULL DEFAULT 0,
  proposals_sent INTEGER NOT NULL DEFAULT 0,
  deals_closed INTEGER NOT NULL DEFAULT 0,
  pipeline_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  churn_arr DECIMAL(12, 2) NOT NULL DEFAULT 0,
  retention_rate DECIMAL(5, 2) NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- 5. DEALS TABLE
-- Track individual deals through pipeline
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('new_client', 'upsell')),
  deal_stage TEXT NOT NULL DEFAULT 'prospect' CHECK (deal_stage IN ('prospect', 'meeting_scheduled', 'proposal_sent', 'negotiation', 'won', 'lost')),
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  arr_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  expected_close_date DATE,
  actual_close_date DATE,
  probability INTEGER NOT NULL DEFAULT 50 CHECK (probability BETWEEN 0 AND 100),
  assigned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. WEEKLY ACTIVITIES TABLE
-- Track weekly KPI activities
CREATE TABLE IF NOT EXISTS public.weekly_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('meeting', 'checkin', 'proposal', 'close')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customer_services_customer ON public.customer_services(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_user ON public.customer_services(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_services_status ON public.customer_services(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_arr_targets_user_period ON public.arr_targets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_arr_performance_user_period ON public.arr_performance(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_deals_user ON public.deals(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(deal_stage);
CREATE INDEX IF NOT EXISTS idx_weekly_activities_user_week ON public.weekly_activities(user_id, week_start_date);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_service_types_updated_at BEFORE UPDATE ON public.service_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_services_updated_at BEFORE UPDATE ON public.customer_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arr_targets_updated_at BEFORE UPDATE ON public.arr_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_arr_performance_updated_at BEFORE UPDATE ON public.arr_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Calculate ARR performance for a user/period
CREATE OR REPLACE FUNCTION public.calculate_arr_performance(
  p_user_id UUID,
  p_month INTEGER,
  p_year INTEGER
)
RETURNS TABLE(
  actual_new_arr DECIMAL,
  actual_upsell_arr DECIMAL,
  actual_total_arr DECIMAL,
  new_clients_count INTEGER,
  upsell_deals_count INTEGER,
  pipeline_value DECIMAL,
  churn_arr DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + INTERVAL '1 month')::DATE;
  
  RETURN QUERY
  WITH new_services AS (
    SELECT 
      cs.customer_id,
      SUM(cs.arr_contribution) as arr
    FROM customer_services cs
    WHERE cs.assigned_user_id = p_user_id
      AND cs.start_date >= v_start_date
      AND cs.start_date < v_end_date
      AND cs.status = 'active'
    GROUP BY cs.customer_id
    HAVING COUNT(*) = (
      SELECT COUNT(*)
      FROM customer_services cs2
      WHERE cs2.customer_id = cs.customer_id
        AND cs2.status = 'active'
    )
  ),
  upsell_services AS (
    SELECT 
      cs.customer_id,
      SUM(cs.arr_contribution) as arr
    FROM customer_services cs
    WHERE cs.assigned_user_id = p_user_id
      AND cs.start_date >= v_start_date
      AND cs.start_date < v_end_date
      AND cs.status = 'active'
      AND EXISTS (
        SELECT 1 FROM customer_services cs2
        WHERE cs2.customer_id = cs.customer_id
          AND cs2.start_date < v_start_date
          AND cs2.status = 'active'
      )
    GROUP BY cs.customer_id
  ),
  churned_services AS (
    SELECT SUM(cs.arr_contribution) as churn
    FROM customer_services cs
    WHERE cs.assigned_user_id = p_user_id
      AND cs.end_date >= v_start_date
      AND cs.end_date < v_end_date
  ),
  pipeline AS (
    SELECT SUM(d.arr_value * d.probability / 100.0) as weighted_value
    FROM deals d
    WHERE d.assigned_user_id = p_user_id
      AND d.deal_stage NOT IN ('won', 'lost')
  )
  SELECT 
    COALESCE((SELECT SUM(arr) FROM new_services), 0)::DECIMAL as actual_new_arr,
    COALESCE((SELECT SUM(arr) FROM upsell_services), 0)::DECIMAL as actual_upsell_arr,
    COALESCE((SELECT SUM(arr) FROM new_services), 0)::DECIMAL + COALESCE((SELECT SUM(arr) FROM upsell_services), 0)::DECIMAL as actual_total_arr,
    COALESCE((SELECT COUNT(*) FROM new_services), 0)::INTEGER as new_clients_count,
    COALESCE((SELECT COUNT(*) FROM upsell_services), 0)::INTEGER as upsell_deals_count,
    COALESCE((SELECT weighted_value FROM pipeline), 0)::DECIMAL as pipeline_value,
    COALESCE((SELECT churn FROM churned_services), 0)::DECIMAL as churn_arr;
END;
$$;

-- Get or create ARR target
CREATE OR REPLACE FUNCTION public.get_or_create_arr_target(
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
  SELECT id INTO v_target_id
  FROM public.arr_targets
  WHERE user_id = p_user_id
    AND month = p_month
    AND year = p_year;
  
  IF v_target_id IS NULL THEN
    INSERT INTO public.arr_targets (user_id, month, year)
    VALUES (p_user_id, p_month, p_year)
    RETURNING id INTO v_target_id;
  END IF;
  
  RETURN v_target_id;
END;
$$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Service Types: Everyone can view active services
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active service types"
  ON public.service_types FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage service types"
  ON public.service_types FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Customer Services: Users can view their assigned services
ALTER TABLE public.customer_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their customer services"
  ON public.customer_services FOR SELECT
  TO authenticated
  USING (
    assigned_user_id = auth.uid() OR 
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_services.customer_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their customer services"
  ON public.customer_services FOR ALL
  TO authenticated
  USING (
    assigned_user_id = auth.uid() OR 
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_services.customer_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    assigned_user_id = auth.uid() OR 
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_services.customer_id
        AND c.user_id = auth.uid()
    )
  );

-- ARR Targets: Users can view/edit their own, admins can view/edit all
ALTER TABLE public.arr_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own arr targets"
  ON public.arr_targets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own arr targets"
  ON public.arr_targets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can update their own arr targets"
  ON public.arr_targets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete arr targets"
  ON public.arr_targets FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ARR Performance: Users can view their own, admins can view all
ALTER TABLE public.arr_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance"
  ON public.arr_performance FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "System can manage performance records"
  ON public.arr_performance FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Deals: Users can manage their own deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deals"
  ON public.deals FOR SELECT
  TO authenticated
  USING (assigned_user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can manage their own deals"
  ON public.deals FOR ALL
  TO authenticated
  USING (assigned_user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (assigned_user_id = auth.uid() OR is_admin(auth.uid()));

-- Weekly Activities: Users can manage their own activities
ALTER TABLE public.weekly_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON public.weekly_activities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can manage their own activities"
  ON public.weekly_activities FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR is_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR is_admin(auth.uid()));

-- =====================================================
-- SEED DATA: Service Types
-- =====================================================

INSERT INTO public.service_types (service_name, service_code, frequency, arr_value, unit_price, billing_period, is_recurring, is_active)
VALUES 
  ('Bank Account Setup', 'BANK_SETUP', 'one-time', 0, 3000, 'one-time', false, true),
  ('Bookkeeping', 'BOOKKEEPING', 'monthly', 12000, 1000, 'month', true, true),
  ('VAT Filing', 'VAT', 'quarterly', 2000, 500, 'quarter', true, true),
  ('Corporate Tax Filing', 'CORP_TAX', 'annual', 1250, 1250, 'year', true, true)
ON CONFLICT (service_code) DO NOTHING;
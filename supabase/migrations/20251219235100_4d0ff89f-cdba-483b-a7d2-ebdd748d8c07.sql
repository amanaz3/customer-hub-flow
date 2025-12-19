-- AI Match Suggestions (stores AI-generated reconciliation suggestions)
CREATE TABLE public.bookkeeper_ai_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_type text NOT NULL, -- 'bill_payment', 'invoice_receipt'
  source_type text NOT NULL, -- 'bill', 'invoice'
  source_id uuid NOT NULL,
  target_type text NOT NULL, -- 'payment', 'receipt'
  target_id uuid NOT NULL,
  confidence_score numeric NOT NULL DEFAULT 0,
  match_reasons jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{rule: 'amount_tolerance', score: 0.95, reason: 'Within 2%'}]
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'auto_matched'
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Feedback for AI Learning
CREATE TABLE public.bookkeeper_ai_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id uuid REFERENCES public.bookkeeper_ai_suggestions(id) ON DELETE CASCADE,
  feedback_type text NOT NULL, -- 'approve', 'reject', 'correct'
  original_match jsonb, -- what AI suggested
  corrected_match jsonb, -- what user chose instead (if correction)
  feedback_reason text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Risk Flags for Missing/Inconsistent Data
CREATE TABLE public.bookkeeper_risk_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_type text NOT NULL, -- 'missing_invoice', 'duplicate_payment', 'amount_mismatch', 'date_gap', 'unreconciled'
  severity text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  entity_type text NOT NULL, -- 'bill', 'invoice', 'payment', 'transaction'
  entity_id uuid NOT NULL,
  related_entity_type text,
  related_entity_id uuid,
  description text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb, -- additional context
  status text NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'dismissed'
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Cash Flow Forecasts (enhanced)
CREATE TABLE public.bookkeeper_cash_flow_forecasts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  forecast_date date NOT NULL,
  period_type text NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  projected_inflow numeric NOT NULL DEFAULT 0,
  projected_outflow numeric NOT NULL DEFAULT 0,
  net_position numeric NOT NULL DEFAULT 0,
  confidence_level numeric DEFAULT 0.8, -- AI confidence in forecast
  data_completeness_score numeric DEFAULT 1.0, -- 0-1 score based on data availability
  risk_factors jsonb DEFAULT '[]'::jsonb, -- [{factor: 'overdue_receivables', impact: -5000}]
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookkeeper_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookkeeper_ai_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookkeeper_risk_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookkeeper_cash_flow_forecasts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI suggestions
CREATE POLICY "Authenticated users can view AI suggestions"
  ON public.bookkeeper_ai_suggestions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert AI suggestions"
  ON public.bookkeeper_ai_suggestions FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update AI suggestions"
  ON public.bookkeeper_ai_suggestions FOR UPDATE USING (true);

-- RLS Policies for AI feedback
CREATE POLICY "Authenticated users can view AI feedback"
  ON public.bookkeeper_ai_feedback FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create AI feedback"
  ON public.bookkeeper_ai_feedback FOR INSERT WITH CHECK (true);

-- RLS Policies for risk flags
CREATE POLICY "Authenticated users can view risk flags"
  ON public.bookkeeper_risk_flags FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create risk flags"
  ON public.bookkeeper_risk_flags FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update risk flags"
  ON public.bookkeeper_risk_flags FOR UPDATE USING (true);

-- RLS Policies for cash flow forecasts
CREATE POLICY "Authenticated users can view forecasts"
  ON public.bookkeeper_cash_flow_forecasts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forecasts"
  ON public.bookkeeper_cash_flow_forecasts FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_ai_suggestions_status ON public.bookkeeper_ai_suggestions(status);
CREATE INDEX idx_ai_suggestions_source ON public.bookkeeper_ai_suggestions(source_type, source_id);
CREATE INDEX idx_ai_suggestions_target ON public.bookkeeper_ai_suggestions(target_type, target_id);
CREATE INDEX idx_risk_flags_status ON public.bookkeeper_risk_flags(status, severity);
CREATE INDEX idx_risk_flags_entity ON public.bookkeeper_risk_flags(entity_type, entity_id);
CREATE INDEX idx_cash_flow_date ON public.bookkeeper_cash_flow_forecasts(forecast_date, period_type);

-- Update triggers
CREATE TRIGGER update_bookkeeper_ai_suggestions_updated_at
  BEFORE UPDATE ON public.bookkeeper_ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookkeeper_risk_flags_updated_at
  BEFORE UPDATE ON public.bookkeeper_risk_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
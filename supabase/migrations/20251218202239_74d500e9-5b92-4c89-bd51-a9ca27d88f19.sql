-- Create bank_readiness_cases table for outcome tracking
CREATE TABLE public.bank_readiness_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  
  -- Link to customer/application if applicable
  customer_id UUID REFERENCES public.customers(id),
  application_id UUID REFERENCES public.account_applications(id),
  
  -- Input fields
  applicant_nationality TEXT NOT NULL,
  uae_residency BOOLEAN NOT NULL DEFAULT false,
  company_jurisdiction TEXT NOT NULL DEFAULT 'mainland',
  license_activity TEXT NOT NULL,
  business_model TEXT NOT NULL DEFAULT 'service',
  expected_monthly_inflow TEXT NOT NULL,
  source_of_funds TEXT NOT NULL,
  source_of_funds_notes TEXT,
  incoming_payment_countries TEXT[] DEFAULT '{}',
  previous_rejection BOOLEAN NOT NULL DEFAULT false,
  previous_rejection_notes TEXT,
  
  -- Assessment results
  risk_score INTEGER,
  risk_category TEXT,
  risk_flags TEXT[] DEFAULT '{}',
  recommended_banks JSONB DEFAULT '[]',
  banks_to_avoid JSONB DEFAULT '[]',
  best_bank TEXT,
  best_bank_reason TEXT,
  required_documents TEXT[] DEFAULT '{}',
  
  -- Outcome tracking - THE KEY PART
  status TEXT NOT NULL DEFAULT 'assessed',
  
  -- Track actual bank applications and outcomes
  bank_applied_to TEXT,
  application_date DATE,
  outcome TEXT, -- 'approved', 'rejected', 'pending', 'withdrawn'
  outcome_date DATE,
  outcome_notes TEXT,
  rejection_reason TEXT
);

-- Create bank_readiness_outcomes table for multiple bank attempts per case
CREATE TABLE public.bank_readiness_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  case_id UUID NOT NULL REFERENCES public.bank_readiness_cases(id) ON DELETE CASCADE,
  
  bank_name TEXT NOT NULL,
  was_recommended BOOLEAN NOT NULL DEFAULT false,
  was_avoided BOOLEAN NOT NULL DEFAULT false,
  
  -- Outcome
  outcome TEXT, -- 'approved', 'rejected', 'pending', 'withdrawn', 'not_applied'
  outcome_date DATE,
  rejection_reason TEXT,
  notes TEXT,
  
  -- For rule validation
  prediction_correct BOOLEAN -- true if recommended and approved, or avoided and rejected
);

-- Enable RLS
ALTER TABLE public.bank_readiness_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_readiness_outcomes ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_readiness_cases
CREATE POLICY "Users can view all bank readiness cases" 
ON public.bank_readiness_cases 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create bank readiness cases" 
ON public.bank_readiness_cases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update bank readiness cases" 
ON public.bank_readiness_cases 
FOR UPDATE 
USING (true);

-- RLS policies for bank_readiness_outcomes
CREATE POLICY "Users can view all bank readiness outcomes" 
ON public.bank_readiness_outcomes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create bank readiness outcomes" 
ON public.bank_readiness_outcomes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update bank readiness outcomes" 
ON public.bank_readiness_outcomes 
FOR UPDATE 
USING (true);

-- Create indexes for common queries
CREATE INDEX idx_bank_readiness_cases_customer ON public.bank_readiness_cases(customer_id);
CREATE INDEX idx_bank_readiness_cases_status ON public.bank_readiness_cases(status);
CREATE INDEX idx_bank_readiness_cases_outcome ON public.bank_readiness_cases(outcome);
CREATE INDEX idx_bank_readiness_outcomes_case ON public.bank_readiness_outcomes(case_id);
CREATE INDEX idx_bank_readiness_outcomes_bank ON public.bank_readiness_outcomes(bank_name);

-- Trigger for updated_at
CREATE TRIGGER update_bank_readiness_cases_updated_at
BEFORE UPDATE ON public.bank_readiness_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
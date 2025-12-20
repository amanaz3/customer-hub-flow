-- Tax Filing Jobs table
CREATE TABLE public.tax_filing_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  filing_period_type TEXT NOT NULL DEFAULT 'quarterly' CHECK (filing_period_type IN ('quarterly', 'monthly_internal')),
  tax_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Status & State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'processing', 'awaiting_review', 'approved', 'submitted', 'completed', 'failed', 'cancelled')),
  current_task TEXT,
  workflow_state JSONB DEFAULT '{}',
  
  -- Queue Assignment
  current_queue TEXT DEFAULT 'standard' CHECK (current_queue IN ('ai_preparation', 'human_review', 'standard', 'premium', 'risk_prioritized', 'batch', 'parallel')),
  queue_history JSONB DEFAULT '[]',
  
  -- Priority & Risk
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('low', 'standard', 'high', 'premium', 'urgent')),
  risk_score NUMERIC(5,2),
  risk_category TEXT CHECK (risk_category IN ('low', 'medium', 'high', 'critical')),
  anomaly_flags JSONB DEFAULT '[]',
  
  -- Execution
  execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK (execution_mode IN ('manual', 'ai_orchestrated', 'background')),
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'auto', 'scheduled', 'batch')),
  assigned_to UUID REFERENCES public.profiles(id),
  worker_id TEXT,
  machine_id TEXT,
  
  -- Financial Data
  total_revenue NUMERIC(15,2),
  total_expenses NUMERIC(15,2),
  taxable_income NUMERIC(15,2),
  tax_liability NUMERIC(15,2),
  
  -- Audit & Notes
  notes JSONB DEFAULT '[]',
  audit_log JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  
  -- Metrics
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

-- Tax Filing Tasks table
CREATE TABLE public.tax_filing_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.tax_filing_jobs(id) ON DELETE CASCADE,
  
  -- Task Definition
  task_key TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_order INTEGER NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'sequential' CHECK (task_type IN ('sequential', 'parallel')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'skipped', 'blocked')),
  
  -- Dependencies
  depends_on UUID[],
  
  -- Execution
  executed_by TEXT CHECK (executed_by IN ('ai', 'human', 'system')),
  assigned_to UUID REFERENCES public.profiles(id),
  worker_id TEXT,
  
  -- Results
  result JSONB,
  output_data JSONB,
  confidence_score NUMERIC(5,2),
  
  -- Verification
  requires_verification BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Audit
  notes JSONB DEFAULT '[]',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Metrics
  execution_time_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);

-- Queue Configuration table
CREATE TABLE public.tax_filing_queue_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  max_workers INTEGER DEFAULT 1,
  max_batch_size INTEGER DEFAULT 10,
  max_parallel_jobs INTEGER DEFAULT 5,
  
  -- Throttling
  rate_limit_per_minute INTEGER,
  cooldown_seconds INTEGER DEFAULT 0,
  
  -- Priority & Thresholds
  priority_weight INTEGER DEFAULT 1,
  risk_threshold NUMERIC(5,2),
  
  -- Processing Rules
  auto_assign BOOLEAN DEFAULT false,
  auto_start BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Queue Workers table
CREATE TABLE public.tax_filing_workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id TEXT NOT NULL UNIQUE,
  machine_id TEXT,
  queue_name TEXT REFERENCES public.tax_filing_queue_config(queue_name),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'busy', 'paused', 'offline', 'error')),
  current_job_id UUID REFERENCES public.tax_filing_jobs(id),
  
  -- Metrics
  jobs_processed INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  avg_processing_time_ms INTEGER,
  last_heartbeat TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default queue configurations
INSERT INTO public.tax_filing_queue_config (queue_name, display_name, description, max_workers, priority_weight) VALUES
  ('ai_preparation', 'AI Preparation', 'AI orchestration for bookkeeping verification, anomaly detection, risk scoring', 3, 2),
  ('human_review', 'Human Review', 'Mandatory accountant verification before submission', 2, 3),
  ('standard', 'Standard Priority', 'Default processing queue', 2, 1),
  ('premium', 'Premium', 'Fast-track paid processing', 2, 4),
  ('risk_prioritized', 'Risk Prioritized', 'High-risk jobs requiring immediate attention', 1, 5),
  ('batch', 'Batch Processing', 'Groups multiple jobs for efficiency', 1, 1),
  ('parallel', 'Parallel Execution', 'Distributed task execution across workers', 4, 2);

-- Enable RLS
ALTER TABLE public.tax_filing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filing_queue_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_filing_workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for authenticated users
CREATE POLICY "Authenticated users can view all jobs" ON public.tax_filing_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert jobs" ON public.tax_filing_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update jobs" ON public.tax_filing_jobs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view all tasks" ON public.tax_filing_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert tasks" ON public.tax_filing_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update tasks" ON public.tax_filing_tasks FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view queue config" ON public.tax_filing_queue_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update queue config" ON public.tax_filing_queue_config FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view workers" ON public.tax_filing_workers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage workers" ON public.tax_filing_workers FOR ALL TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX idx_tax_filing_jobs_status ON public.tax_filing_jobs(status);
CREATE INDEX idx_tax_filing_jobs_queue ON public.tax_filing_jobs(current_queue);
CREATE INDEX idx_tax_filing_jobs_priority ON public.tax_filing_jobs(priority);
CREATE INDEX idx_tax_filing_jobs_customer ON public.tax_filing_jobs(customer_id);
CREATE INDEX idx_tax_filing_tasks_job ON public.tax_filing_tasks(job_id);
CREATE INDEX idx_tax_filing_tasks_status ON public.tax_filing_tasks(status);

-- Update trigger for jobs
CREATE OR REPLACE FUNCTION public.update_tax_filing_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_filing_jobs_timestamp
  BEFORE UPDATE ON public.tax_filing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tax_filing_job_timestamp();

CREATE TRIGGER update_tax_filing_tasks_timestamp
  BEFORE UPDATE ON public.tax_filing_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tax_filing_job_timestamp();
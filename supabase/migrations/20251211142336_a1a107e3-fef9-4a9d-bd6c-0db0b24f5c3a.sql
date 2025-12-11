-- Create call_stage_history table to track stage transitions during live calls
CREATE TABLE public.call_stage_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id uuid REFERENCES public.sales_call_sessions(id) ON DELETE CASCADE,
  stage_id uuid REFERENCES public.playbook_stages(id) ON DELETE SET NULL,
  stage_name text NOT NULL,
  stage_order integer,
  entered_at timestamp with time zone NOT NULL DEFAULT now(),
  exited_at timestamp with time zone,
  duration_seconds integer,
  triggered_by text NOT NULL DEFAULT 'agent' CHECK (triggered_by IN ('agent', 'customer', 'system')),
  was_jump boolean NOT NULL DEFAULT false,
  skipped_stages text[] DEFAULT '{}',
  jump_direction text CHECK (jump_direction IN ('forward', 'backward')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_call_stage_history_session ON public.call_stage_history(call_session_id);
CREATE INDEX idx_call_stage_history_stage ON public.call_stage_history(stage_id);
CREATE INDEX idx_call_stage_history_entered ON public.call_stage_history(entered_at);

-- Enable RLS
ALTER TABLE public.call_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own call stage history"
ON public.call_stage_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sales_call_sessions scs
    WHERE scs.id = call_stage_history.call_session_id
    AND (scs.agent_id = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Users can insert their own call stage history"
ON public.call_stage_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sales_call_sessions scs
    WHERE scs.id = call_stage_history.call_session_id
    AND (scs.agent_id = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Users can update their own call stage history"
ON public.call_stage_history FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM sales_call_sessions scs
    WHERE scs.id = call_stage_history.call_session_id
    AND (scs.agent_id = auth.uid() OR is_admin(auth.uid()))
  )
);

CREATE POLICY "Admins can manage all call stage history"
ON public.call_stage_history FOR ALL
USING (is_admin(auth.uid()));
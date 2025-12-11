-- Create call_transcripts table for storing full transcript history
CREATE TABLE public.call_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_session_id UUID REFERENCES public.sales_call_sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  playbook_id UUID REFERENCES public.sales_playbooks(id) ON DELETE SET NULL,
  transcript_text TEXT NOT NULL,
  transcript_lines JSONB DEFAULT '[]'::jsonb,
  call_type TEXT,
  outcome TEXT,
  duration_seconds INTEGER,
  ai_summary TEXT,
  sentiment_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own transcripts"
ON public.call_transcripts FOR SELECT
USING (agent_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can insert their own transcripts"
ON public.call_transcripts FOR INSERT
WITH CHECK (agent_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all transcripts"
ON public.call_transcripts FOR ALL
USING (is_admin(auth.uid()));

-- Indexes for common queries
CREATE INDEX idx_call_transcripts_customer ON public.call_transcripts(customer_id);
CREATE INDEX idx_call_transcripts_agent ON public.call_transcripts(agent_id);
CREATE INDEX idx_call_transcripts_created ON public.call_transcripts(created_at DESC);
CREATE INDEX idx_call_transcripts_call_type ON public.call_transcripts(call_type);

-- Trigger for updated_at
CREATE TRIGGER update_call_transcripts_updated_at
  BEFORE UPDATE ON public.call_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.call_transcripts IS 'Stores full call transcripts for history, training, and future RAG implementation';
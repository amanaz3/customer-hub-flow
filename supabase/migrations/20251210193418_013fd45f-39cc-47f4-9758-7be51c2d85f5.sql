
-- Sales Playbook Structure for Live Sales Assistant

-- 1. Sales Playbooks (one per service type)
CREATE TABLE public.sales_playbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  call_type TEXT NOT NULL DEFAULT 'outbound' CHECK (call_type IN ('inbound', 'outbound', 'follow_up')),
  target_segments TEXT[] DEFAULT '{}', -- RFM segments this playbook targets
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Playbook Stages (call flow stages)
CREATE TABLE public.playbook_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.sales_playbooks(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_type TEXT NOT NULL CHECK (stage_type IN ('opening', 'discovery', 'pitch', 'objection_handling', 'negotiation', 'closing', 'follow_up')),
  duration_seconds INTEGER DEFAULT 60,
  key_objectives TEXT[],
  success_criteria TEXT[],
  next_stage_conditions JSONB DEFAULT '{}', -- branching logic
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Stage Scripts (what to say at each stage)
CREATE TABLE public.stage_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL REFERENCES public.playbook_stages(id) ON DELETE CASCADE,
  script_type TEXT NOT NULL CHECK (script_type IN ('primary', 'alternative', 'segment_specific')),
  customer_segment TEXT, -- for segment-specific scripts (High-Value, At-Risk, etc.)
  script_content TEXT NOT NULL,
  tone TEXT DEFAULT 'professional', -- professional, friendly, urgent, consultative
  key_phrases TEXT[],
  avoid_phrases TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Objection Handlers
CREATE TABLE public.objection_handlers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.sales_playbooks(id) ON DELETE CASCADE,
  objection_type TEXT NOT NULL, -- pricing, timing, competitor, trust, need
  objection_trigger TEXT NOT NULL, -- keywords/phrases that trigger this
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  response_script TEXT NOT NULL,
  follow_up_question TEXT,
  escalation_threshold INTEGER DEFAULT 3, -- times before escalating
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Pricing Strategies (segment-based)
CREATE TABLE public.pricing_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.sales_playbooks(id) ON DELETE CASCADE,
  customer_segment TEXT NOT NULL, -- RFM segment
  urgency_level TEXT CHECK (urgency_level IN ('low', 'medium', 'high', 'immediate')),
  discount_range_min DECIMAL(5,2) DEFAULT 0,
  discount_range_max DECIMAL(5,2) DEFAULT 0,
  bundle_suggestions TEXT[],
  upsell_products UUID[], -- product IDs to suggest
  pricing_script TEXT,
  negotiation_floor DECIMAL(10,2), -- minimum acceptable price
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Discovery Questions (to reveal customer needs)
CREATE TABLE public.discovery_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.sales_playbooks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_purpose TEXT, -- budget, timeline, decision_maker, pain_point, competitor
  stage_id UUID REFERENCES public.playbook_stages(id),
  priority INTEGER DEFAULT 1,
  follow_up_based_on JSONB DEFAULT '{}', -- conditional follow-ups based on answers
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Emotional Triggers & Responses
CREATE TABLE public.emotional_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playbook_id UUID NOT NULL REFERENCES public.sales_playbooks(id) ON DELETE CASCADE,
  emotion_detected TEXT NOT NULL CHECK (emotion_detected IN ('frustrated', 'confused', 'interested', 'skeptical', 'excited', 'hesitant', 'angry', 'neutral')),
  response_strategy TEXT NOT NULL,
  tone_adjustment TEXT,
  suggested_phrases TEXT[],
  avoid_actions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Call Session Tracking
CREATE TABLE public.sales_call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.profiles(id),
  customer_id UUID REFERENCES public.customers(id),
  playbook_id UUID REFERENCES public.sales_playbooks(id),
  call_type TEXT NOT NULL,
  current_stage_id UUID REFERENCES public.playbook_stages(id),
  customer_emotion TEXT,
  objections_raised JSONB DEFAULT '[]',
  pricing_offered DECIMAL(10,2),
  outcome TEXT CHECK (outcome IN ('scheduled', 'converted', 'follow_up', 'not_interested', 'callback', 'in_progress')),
  call_notes TEXT,
  ai_suggestions_used INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objection_handlers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotional_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_call_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Playbooks readable by all authenticated, editable by admin
CREATE POLICY "Playbooks viewable by authenticated users" ON public.sales_playbooks FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Playbooks editable by admins" ON public.sales_playbooks FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Stages viewable by authenticated users" ON public.playbook_stages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Stages editable by admins" ON public.playbook_stages FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Scripts viewable by authenticated users" ON public.stage_scripts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Scripts editable by admins" ON public.stage_scripts FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Objections viewable by authenticated users" ON public.objection_handlers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Objections editable by admins" ON public.objection_handlers FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Pricing viewable by authenticated users" ON public.pricing_strategies FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Pricing editable by admins" ON public.pricing_strategies FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Questions viewable by authenticated users" ON public.discovery_questions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Questions editable by admins" ON public.discovery_questions FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Emotions viewable by authenticated users" ON public.emotional_responses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Emotions editable by admins" ON public.emotional_responses FOR ALL USING (public.is_admin(auth.uid()));

-- Call sessions - users see their own, admins see all
CREATE POLICY "Users view own call sessions" ON public.sales_call_sessions FOR SELECT USING (agent_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE POLICY "Users manage own call sessions" ON public.sales_call_sessions FOR INSERT WITH CHECK (agent_id = auth.uid());
CREATE POLICY "Users update own call sessions" ON public.sales_call_sessions FOR UPDATE USING (agent_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_playbooks_product ON public.sales_playbooks(product_id);
CREATE INDEX idx_playbook_stages_playbook ON public.playbook_stages(playbook_id);
CREATE INDEX idx_stage_scripts_stage ON public.stage_scripts(stage_id);
CREATE INDEX idx_objection_handlers_playbook ON public.objection_handlers(playbook_id);
CREATE INDEX idx_pricing_strategies_playbook ON public.pricing_strategies(playbook_id);
CREATE INDEX idx_discovery_questions_playbook ON public.discovery_questions(playbook_id);
CREATE INDEX idx_call_sessions_agent ON public.sales_call_sessions(agent_id);
CREATE INDEX idx_call_sessions_customer ON public.sales_call_sessions(customer_id);

-- Update trigger for playbooks
CREATE TRIGGER update_sales_playbooks_updated_at
  BEFORE UPDATE ON public.sales_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

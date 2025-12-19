-- Create AI Assistant configuration table
CREATE TABLE public.ai_assistant_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'default',
  system_prompt text NOT NULL,
  greeting_message text NOT NULL DEFAULT 'Hello! I''m your AI assistant for company formation in the UAE. How can I help you today?',
  is_active boolean NOT NULL DEFAULT true,
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  workflow_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  api_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  CONSTRAINT unique_active_config UNIQUE (name, is_active)
);

-- Enable RLS
ALTER TABLE public.ai_assistant_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage AI config" 
ON public.ai_assistant_config 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Everyone can view active AI config" 
ON public.ai_assistant_config 
FOR SELECT 
USING (is_active = true);

-- Insert default configuration
INSERT INTO public.ai_assistant_config (name, system_prompt, greeting_message, workflow_rules, api_mappings)
VALUES (
  'default',
  'You are a helpful AI assistant for a UAE company formation platform. You help customers with:
- Company formation in UAE free zones and mainland
- Bank account opening guidance
- Visa and residency services
- Bookkeeping and tax compliance

Be professional, friendly, and guide users through the process step by step. Ask clarifying questions when needed.',
  'Hello! I''m your AI assistant for company formation in the UAE. How can I help you today?',
  '[
    {"step": "greeting", "action": "welcome_user"},
    {"step": "identify_need", "action": "ask_service_type"},
    {"step": "collect_info", "action": "gather_requirements"},
    {"step": "recommend", "action": "suggest_solution"}
  ]'::jsonb,
  '{
    "company_formation": "/api/webflow/create-application",
    "bank_account": "/api/bank-readiness",
    "document_upload": "/api/documents/upload"
  }'::jsonb
);
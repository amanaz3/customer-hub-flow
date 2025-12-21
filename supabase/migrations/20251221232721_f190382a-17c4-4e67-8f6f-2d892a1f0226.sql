-- Add parent_key column to support hierarchy
ALTER TABLE public.sandbox_card_settings 
ADD COLUMN parent_key TEXT REFERENCES public.sandbox_card_settings(card_key) ON DELETE CASCADE;

-- Insert child cards for Customer section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('customer_web', 'Web', true, 1, 'customer'),
  ('customer_workflow_builder', 'Workflow Builder', true, 2, 'customer');

-- Insert child cards for Agent section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('agent_bank_readiness', 'Bank Readiness', true, 1, 'agent'),
  ('agent_doc_search', 'Doc Search & Q/A', true, 2, 'agent'),
  ('agent_dashboard', 'Dashboard', true, 3, 'agent');

-- Insert child cards for Company section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('company_tracker', 'Tracker', true, 1, 'company');

-- Insert child cards for Team section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('team_track_tasks', 'Track Tasks', true, 1, 'team');

-- Insert child cards for Accounting section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('accounting_ai_workflows', 'AI Workflows', true, 1, 'accounting'),
  ('accounting_ai_advisory', 'AI Advisory', true, 2, 'accounting');

-- Insert child cards for Fintech section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('fintech_open_banking', 'Open Banking', true, 1, 'fintech');

-- Insert child cards for Sales section
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('sales_lead_workflow', 'Lead Workflow', true, 1, 'sales'),
  ('sales_leads', 'Leads', true, 2, 'sales'),
  ('sales_data_analysis', 'Data Analysis', true, 3, 'sales'),
  ('sales_live_assistant', 'Live Assistant', true, 4, 'sales');
-- Create Company Formation - Inbound Support playbook
INSERT INTO sales_playbooks (id, name, call_type, description, is_active, target_segments)
VALUES (
  'cf1b0001-0000-0000-0000-000000000001',
  'Company Formation - Inbound Support',
  'inbound',
  'Inbound support playbook for customers inquiring about company formation services',
  true,
  ARRAY['new_business', 'entrepreneurs', 'investors']
);

-- Create Follow-up After Outbound Sales playbook
INSERT INTO sales_playbooks (id, name, call_type, description, is_active, target_segments)
VALUES (
  'f0110001-0000-0000-0000-000000000001',
  'Follow-up After Outbound Sales',
  'outbound',
  'Follow-up playbook for prospects contacted via initial outbound sales call',
  true,
  ARRAY['warm_leads', 'pending_decision', 'proposal_sent']
);

-- Add stages for Company Formation - Inbound Support
INSERT INTO playbook_stages (id, playbook_id, stage_name, stage_type, stage_order, duration_seconds, opening_lines, key_objectives) VALUES
('cf110001-1111-0000-0000-000000000001', 'cf1b0001-0000-0000-0000-000000000001', 'Greeting & Qualification', 'opening', 1, 60, 
  ARRAY['Thank you for calling AMANA. My name is [Agent], how may I assist you today?', 'I understand you''re interested in setting up a business in the UAE. That''s exciting!'],
  ARRAY['Warm greeting', 'Identify inquiry type', 'Qualify lead']),
('cf110001-2222-0000-0000-000000000002', 'cf1b0001-0000-0000-0000-000000000001', 'Needs Discovery', 'discovery', 2, 180,
  ARRAY['To better assist you, may I ask a few questions about your business plans?'],
  ARRAY['Understand business type', 'Identify preferred jurisdiction', 'Assess timeline and budget']),
('cf110001-3333-0000-0000-000000000003', 'cf1b0001-0000-0000-0000-000000000001', 'Solution Presentation', 'pitch', 3, 240,
  ARRAY['Based on what you''ve shared, I''d recommend...'],
  ARRAY['Present suitable license types', 'Explain jurisdiction options', 'Outline process and timeline']),
('cf110001-4444-0000-0000-000000000004', 'cf1b0001-0000-0000-0000-000000000001', 'Pricing & Next Steps', 'negotiation', 4, 120,
  ARRAY['Let me share our pricing structure for your requirements...'],
  ARRAY['Present pricing', 'Address concerns', 'Schedule consultation or collect documents']),
('cf110001-5555-0000-0000-000000000005', 'cf1b0001-0000-0000-0000-000000000001', 'Wrap-up & Follow-up', 'closing', 5, 60,
  ARRAY['Thank you for choosing AMANA. Is there anything else I can help with today?'],
  ARRAY['Confirm next steps', 'Set expectations', 'Collect contact details']);

-- Add stages for Follow-up After Outbound Sales
INSERT INTO playbook_stages (id, playbook_id, stage_name, stage_type, stage_order, duration_seconds, opening_lines, key_objectives) VALUES
('f0110001-1111-0000-0000-000000000001', 'f0110001-0000-0000-0000-000000000001', 'Re-engagement Opening', 'opening', 1, 45,
  ARRAY['Hi [Customer Name], this is [Agent] from AMANA. We spoke [timeframe] ago about your business setup plans. Is this still a good time?', 'I wanted to follow up on our previous conversation and see how your planning is progressing.'],
  ARRAY['Re-establish rapport', 'Confirm continued interest', 'Gauge current status']),
('f0110001-2222-0000-0000-000000000002', 'f0110001-0000-0000-0000-000000000001', 'Status Check & Updates', 'discovery', 2, 120,
  ARRAY['Have there been any changes to your requirements since we last spoke?', 'Did you have a chance to review the information I sent?'],
  ARRAY['Identify any new requirements', 'Address questions from previous call', 'Understand decision timeline']),
('f0110001-3333-0000-0000-000000000003', 'f0110001-0000-0000-0000-000000000001', 'Objection Handling', 'objection_handling', 3, 180,
  ARRAY['I understand you may have some concerns. What''s holding you back from moving forward?'],
  ARRAY['Identify blockers', 'Address pricing concerns', 'Handle competitor comparisons']),
('f0110001-4444-0000-0000-000000000004', 'f0110001-0000-0000-0000-000000000001', 'Commitment & Close', 'negotiation', 4, 120,
  ARRAY['Based on our discussion, shall we proceed with the next step?', 'I can schedule a consultation with our specialist this week if that works for you.'],
  ARRAY['Secure commitment', 'Schedule next action', 'Collect required documents']),
('f0110001-5555-0000-0000-000000000005', 'f0110001-0000-0000-0000-000000000001', 'Confirmation & Next Steps', 'closing', 5, 60,
  ARRAY['Excellent! Let me confirm what we''ve agreed on...', 'You''ll receive an email with all the details shortly.'],
  ARRAY['Confirm agreements', 'Set clear expectations', 'Thank and close professionally']);
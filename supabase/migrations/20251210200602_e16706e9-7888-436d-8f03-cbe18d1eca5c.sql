-- Seed Outbound Sales Playbook
INSERT INTO sales_playbooks (id, name, description, call_type, is_active, target_segments)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Outbound Sales - Standard', 'Standard outbound sales playbook for new customer acquisition', 'outbound', true, ARRAY['SMB', 'Enterprise', 'Startup']),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Inbound Support - Standard', 'Standard inbound support playbook for customer service', 'inbound', true, ARRAY['All Customers']);

-- Seed Stages for Outbound Sales
INSERT INTO playbook_stages (id, playbook_id, stage_name, stage_type, stage_order, duration_seconds, key_objectives, success_criteria)
VALUES
  ('c1d1e1f1-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Opening & Rapport', 'opening', 1, 60, ARRAY['Build rapport', 'Establish credibility', 'Set agenda'], ARRAY['Customer engaged', 'Permission to continue']),
  ('c2d2e2f2-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Discovery', 'discovery', 2, 180, ARRAY['Understand pain points', 'Identify decision makers', 'Qualify opportunity'], ARRAY['Key pain points identified', 'Budget discussed', 'Timeline understood']),
  ('c3d3e3f3-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Solution Presentation', 'pitch', 3, 240, ARRAY['Present relevant solutions', 'Address specific needs', 'Demonstrate value'], ARRAY['Customer understands offering', 'Interest confirmed']),
  ('c4d4e4f4-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Objection Handling', 'objection_handling', 4, 120, ARRAY['Address concerns', 'Provide evidence', 'Build confidence'], ARRAY['Objections resolved', 'Customer reassured']),
  ('c5d5e5f5-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Closing', 'closing', 5, 60, ARRAY['Summarize value', 'Ask for commitment', 'Define next steps'], ARRAY['Meeting scheduled', 'Proposal requested', 'Deal closed']);

-- Seed Stages for Inbound Support
INSERT INTO playbook_stages (id, playbook_id, stage_name, stage_type, stage_order, duration_seconds, key_objectives, success_criteria)
VALUES
  ('c6d6e6f6-6666-6666-6666-666666666666', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Greeting & Verification', 'opening', 1, 30, ARRAY['Warm greeting', 'Verify customer identity', 'Set expectations'], ARRAY['Customer verified', 'Rapport established']),
  ('c7d7e7f7-7777-7777-7777-777777777777', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Issue Identification', 'discovery', 2, 120, ARRAY['Understand the issue', 'Gather details', 'Show empathy'], ARRAY['Issue clearly understood', 'All details captured']),
  ('c8d8e8f8-8888-8888-8888-888888888888', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Resolution', 'pitch', 3, 180, ARRAY['Provide solution', 'Guide through steps', 'Confirm resolution'], ARRAY['Issue resolved', 'Customer satisfied']),
  ('c9d9e9f9-9999-9999-9999-999999999999', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Wrap-up & Follow-up', 'closing', 4, 60, ARRAY['Summarize resolution', 'Offer additional help', 'Thank customer'], ARRAY['Case documented', 'Customer thanked']);

-- Seed Discovery Questions for Sales
INSERT INTO discovery_questions (playbook_id, stage_id, question_text, question_purpose, priority)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2d2e2f2-2222-2222-2222-222222222222', 'What challenges are you currently facing with your business operations?', 'Identify pain points', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2d2e2f2-2222-2222-2222-222222222222', 'Who else is involved in making this decision?', 'Identify decision makers', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2d2e2f2-2222-2222-2222-222222222222', 'What is your timeline for implementing a solution?', 'Understand urgency', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2d2e2f2-2222-2222-2222-222222222222', 'Have you set aside a budget for this initiative?', 'Qualify budget', 4),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'c2d2e2f2-2222-2222-2222-222222222222', 'What would success look like for you?', 'Define success criteria', 5);

-- Seed Discovery Questions for Support
INSERT INTO discovery_questions (playbook_id, stage_id, question_text, question_purpose, priority)
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'c7d7e7f7-7777-7777-7777-777777777777', 'Can you describe the issue you are experiencing?', 'Understand the problem', 1),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'c7d7e7f7-7777-7777-7777-777777777777', 'When did this issue first occur?', 'Establish timeline', 2),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'c7d7e7f7-7777-7777-7777-777777777777', 'Have you tried any troubleshooting steps already?', 'Avoid redundant steps', 3),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'c7d7e7f7-7777-7777-7777-777777777777', 'Is this affecting your ability to complete your work?', 'Assess impact', 4);

-- Seed Objection Handlers for Sales
INSERT INTO objection_handlers (playbook_id, objection_type, objection_trigger, response_script, follow_up_question, severity)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Price', 'too expensive|cost too much|budget|pricing', 'I understand budget is important. Let me show you the ROI our clients typically see.', 'What ROI would make this investment worthwhile for you?', 'medium'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Timing', 'not the right time|too busy|next quarter|later', 'I completely understand timing concerns. The key question is what is the cost of waiting?', 'What would need to change for the timing to be right?', 'medium'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Competitor', 'using another|competitor|already have', 'That is great that you are already addressing this need. Would you be open to a quick comparison?', 'What do you wish your current solution did better?', 'high'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Authority', 'need to check|ask my boss|not my decision', 'Absolutely, involving the right stakeholders is important. How about we schedule a brief call together?', 'Who else should be part of this conversation?', 'low');

-- Seed Objection Handlers for Support
INSERT INTO objection_handlers (playbook_id, objection_type, objection_trigger, response_script, follow_up_question, severity)
VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Frustration', 'frustrated|angry|upset|terrible', 'I completely understand your frustration. Let me personally ensure we resolve this for you right now.', 'Can you tell me exactly what happened so I can make this right?', 'high'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Escalation', 'supervisor|manager|escalate', 'I would be happy to involve a supervisor if needed. Before I do, may I try one more solution?', 'Would you allow me 2 more minutes to try an alternative solution?', 'high'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Refund', 'refund|money back|cancel', 'I understand. Before we proceed, may I ask what led to this decision?', 'Is there anything we could do differently that would change your mind?', 'high');

-- Seed Emotional Responses
INSERT INTO emotional_responses (playbook_id, emotion_detected, response_strategy, tone_adjustment, suggested_phrases, avoid_actions)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'skeptical', 'Provide evidence and social proof', 'More factual and data-driven', ARRAY['Let me share some specific results...', 'The data shows...'], ARRAY['Making claims without evidence', 'Being overly enthusiastic']),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'interested', 'Build momentum and excitement', 'Enthusiastic but professional', ARRAY['That is exactly why our clients love...', 'The best part is...'], ARRAY['Being too pushy', 'Rushing the close']),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'frustrated', 'Show empathy and take ownership', 'Calm and reassuring', ARRAY['I completely understand...', 'Let me personally handle this...'], ARRAY['Deflecting blame', 'Using jargon']),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'confused', 'Simplify and guide step-by-step', 'Patient and clear', ARRAY['Let me walk you through this...', 'No worries, this is simple...'], ARRAY['Using technical terms', 'Moving too fast']);

-- Seed Pricing Strategies for Sales (without upsell_products which requires UUID[])
INSERT INTO pricing_strategies (playbook_id, customer_segment, discount_range_min, discount_range_max, negotiation_floor, pricing_script)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SMB', 5, 15, 10, 'For businesses your size, our standard package offers the best value.'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Enterprise', 10, 25, 15, 'For enterprise clients, we offer customized pricing based on your specific needs.');
-- Create stages for customer support flow (using valid stage_type values)
WITH playbook AS (SELECT id FROM sales_playbooks WHERE name = 'Company Formation - Customer Support')
INSERT INTO playbook_stages (playbook_id, stage_name, stage_type, stage_order, key_objectives, opening_lines, script, duration_seconds)
SELECT 
  playbook.id,
  stage_data.stage_name,
  stage_data.stage_type,
  stage_data.stage_order,
  stage_data.key_objectives,
  stage_data.opening_lines,
  stage_data.script,
  stage_data.duration_seconds
FROM playbook, (VALUES
  ('Greeting & Verification', 'opening', 1, 
    ARRAY['Warm greeting', 'Verify customer identity', 'Access customer account'],
    ARRAY['Thank you for calling, this is [Agent Name]. How may I assist you today?', 'Good [morning/afternoon], thank you for reaching out. May I have your company name or reference number please?'],
    'Start with a warm, empathetic greeting. Verify the customer identity by asking for their company name, reference number, or registered email. Pull up their account before proceeding.',
    60),
  ('Issue Identification', 'discovery', 2,
    ARRAY['Understand the issue clearly', 'Identify urgency level', 'Document the problem'],
    ARRAY['I understand. Could you please describe the issue you are experiencing?', 'I am here to help. Can you walk me through what happened?'],
    'Listen actively and take notes. Ask clarifying questions to fully understand the issue. Determine if this is urgent (license expiry, legal deadline) or routine.',
    120),
  ('Troubleshooting & Resolution', 'pitch', 3,
    ARRAY['Provide solution or workaround', 'Escalate if needed', 'Set clear expectations'],
    ARRAY['Based on what you have described, here is what we can do...', 'Let me check our records and find the best solution for you.'],
    'Offer immediate solutions if possible. If escalation is needed, explain the process clearly. Always provide a timeline for resolution.',
    180),
  ('Handle Objections', 'objection_handling', 4,
    ARRAY['Address concerns', 'De-escalate frustration', 'Offer alternatives'],
    ARRAY['I understand your concern...', 'Let me see what options we have for you.'],
    'Listen to objections without interrupting. Acknowledge the concern before offering solutions. Stay calm and professional.',
    90),
  ('Confirmation & Close', 'closing', 5,
    ARRAY['Confirm understanding', 'Summarize actions', 'Provide reference number', 'Thank the customer'],
    ARRAY['Let me summarize what we have discussed and the next steps...', 'Is there anything else I can help you with today?'],
    'Summarize the resolution. Confirm the customer understands. Provide ticket number. Thank them for their patience.',
    60)
) AS stage_data(stage_name, stage_type, stage_order, key_objectives, opening_lines, script, duration_seconds);

-- Objection handlers for support scenarios
INSERT INTO objection_handlers (playbook_id, objection_type, objection_trigger, response_script, follow_up_question, severity)
SELECT 
  (SELECT id FROM sales_playbooks WHERE name = 'Company Formation - Customer Support'),
  objection_data.objection_type,
  objection_data.objection_trigger,
  objection_data.response_script,
  objection_data.follow_up_question,
  objection_data.severity
FROM (VALUES
  ('frustration', 'This should have been done already', 'I completely understand your frustration, and I apologize for any inconvenience caused. Let me prioritize this and find a solution for you right away.', 'Can you tell me the original timeline you were given?', 'high'),
  ('escalation_request', 'I want to speak to a manager', 'I understand you would like to escalate this. Before I transfer you, may I try to resolve this for you? If not, I will connect you with my supervisor immediately.', 'Would you like me to attempt a resolution first, or proceed directly to my supervisor?', 'high'),
  ('refund_request', 'I want my money back', 'I hear your concern and I want to make this right. Let me review your account and see what options are available to address this situation fairly.', 'Can you help me understand what outcome would satisfy you?', 'high'),
  ('blame', 'This is your fault', 'I take full responsibility for ensuring we resolve this for you. Regardless of what happened, my priority is fixing this issue now.', 'What would be the best outcome for you at this point?', 'medium'),
  ('deadline_pressure', 'I have a deadline tomorrow', 'I understand the urgency. Let me see what we can do to expedite this. I will escalate immediately if needed to meet your deadline.', 'What specific document or action do you need by tomorrow?', 'high')
) AS objection_data(objection_type, objection_trigger, response_script, follow_up_question, severity);

-- Emotional responses for support
INSERT INTO emotional_responses (playbook_id, emotion_detected, response_strategy, suggested_phrases, tone_adjustment, avoid_actions)
SELECT 
  (SELECT id FROM sales_playbooks WHERE name = 'Company Formation - Customer Support'),
  emotion_data.emotion_detected,
  emotion_data.response_strategy,
  emotion_data.suggested_phrases,
  emotion_data.tone_adjustment,
  emotion_data.avoid_actions
FROM (VALUES
  ('frustrated', 'Acknowledge, apologize, and act quickly. Show urgency in resolving their issue.', ARRAY['I completely understand your frustration', 'Let me prioritize this for you right now', 'I apologize for the inconvenience this has caused'], 'empathetic and action-oriented', ARRAY['Making excuses', 'Blaming other departments', 'Using jargon']),
  ('confused', 'Simplify explanations, use examples, and confirm understanding at each step.', ARRAY['Let me break this down step by step', 'In simple terms, this means...', 'Does that make sense so far?'], 'patient and clear', ARRAY['Using technical terms', 'Rushing through explanations', 'Assuming prior knowledge']),
  ('interested', 'Provide thorough information and offer additional resources or services.', ARRAY['Great question, let me explain further', 'I can also help you with...', 'Would you like more details on this?'], 'helpful and informative', ARRAY['Being dismissive', 'Rushing the conversation']),
  ('skeptical', 'Provide evidence, documentation, and clear timelines. Be transparent about processes.', ARRAY['I can send you documentation to confirm this', 'Let me show you exactly where we are in the process', 'Here is what you can expect and when'], 'transparent and factual', ARRAY['Making promises without certainty', 'Being vague about timelines'])
) AS emotion_data(emotion_detected, response_strategy, suggested_phrases, tone_adjustment, avoid_actions);

-- Discovery questions for support
INSERT INTO discovery_questions (playbook_id, question_text, question_purpose, priority)
SELECT 
  (SELECT id FROM sales_playbooks WHERE name = 'Company Formation - Customer Support'),
  question_data.question_text,
  question_data.question_purpose,
  question_data.priority
FROM (VALUES
  ('When did you first notice this issue?', 'Timeline identification', 1),
  ('Have you received any communication or documents related to this matter?', 'Documentation check', 2),
  ('Is there a deadline or urgency we should be aware of?', 'Urgency assessment', 3),
  ('Has this happened before, or is this the first time?', 'Pattern identification', 4),
  ('Would you prefer us to handle this directly, or would you like guidance to resolve it yourself?', 'Resolution preference', 5)
) AS question_data(question_text, question_purpose, priority);
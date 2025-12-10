-- Create Company Formation playbook (System Generated)
INSERT INTO sales_playbooks (id, name, description, product_id, call_type, is_active)
VALUES (
  'cf123456-7890-abcd-ef12-345678901234',
  'Company Formation - System Generated',
  'AI-generated playbook for company formation services including license types, jurisdictions, and business setup guidance',
  '5264529a-923a-4b53-b0e9-865fed5e625b',
  'outbound',
  true
);

-- Create stages for Company Formation
INSERT INTO playbook_stages (id, playbook_id, stage_name, stage_type, stage_order, duration_seconds, key_objectives, success_criteria) VALUES
('cf110001-0000-0000-0000-000000000001', 'cf123456-7890-abcd-ef12-345678901234', 'Introduction & Qualification', 'opening', 1, 60, 
  ARRAY['Introduce company formation services', 'Verify business intent', 'Establish credibility'],
  ARRAY['Client engaged', 'Business purpose understood', 'Permission to continue']
),
('cf110002-0000-0000-0000-000000000002', 'cf123456-7890-abcd-ef12-345678901234', 'Business Discovery', 'discovery', 2, 180,
  ARRAY['Understand business activity', 'Identify ownership structure', 'Assess jurisdiction preferences', 'Determine timeline urgency'],
  ARRAY['Activity type confirmed', 'Shareholder details captured', 'Preferred jurisdiction identified']
),
('cf110003-0000-0000-0000-000000000003', 'cf123456-7890-abcd-ef12-345678901234', 'License & Jurisdiction Recommendation', 'pitch', 3, 240,
  ARRAY['Present suitable license types', 'Explain jurisdiction benefits', 'Compare Mainland vs Freezone', 'Discuss visa requirements'],
  ARRAY['Client understands options', 'Preferred license type selected', 'Jurisdiction decision made']
),
('cf110004-0000-0000-0000-000000000004', 'cf123456-7890-abcd-ef12-345678901234', 'Pricing & Package Presentation', 'negotiation', 4, 120,
  ARRAY['Present pricing packages', 'Explain included services', 'Address cost concerns', 'Offer add-ons'],
  ARRAY['Pricing accepted', 'Package selected', 'Value understood']
),
('cf110005-0000-0000-0000-000000000005', 'cf123456-7890-abcd-ef12-345678901234', 'Objection Resolution', 'objection_handling', 5, 120,
  ARRAY['Address documentation concerns', 'Handle timeline questions', 'Resolve competitor comparisons'],
  ARRAY['Objections resolved', 'Client confident', 'Ready to proceed']
),
('cf110006-0000-0000-0000-000000000006', 'cf123456-7890-abcd-ef12-345678901234', 'Closing & Next Steps', 'closing', 6, 60,
  ARRAY['Summarize selected package', 'Confirm documentation requirements', 'Schedule follow-up', 'Collect initial payment'],
  ARRAY['Agreement confirmed', 'Document checklist sent', 'Payment received or scheduled']
);

-- Create discovery questions for Company Formation
INSERT INTO discovery_questions (playbook_id, stage_id, question_text, question_purpose, priority) VALUES
('cf123456-7890-abcd-ef12-345678901234', 'cf110002-0000-0000-0000-000000000002', 'What type of business activity are you planning to conduct in the UAE?', 'Identify license type', 1),
('cf123456-7890-abcd-ef12-345678901234', 'cf110002-0000-0000-0000-000000000002', 'How many shareholders or partners will be involved in the company?', 'Understand ownership structure', 2),
('cf123456-7890-abcd-ef12-345678901234', 'cf110002-0000-0000-0000-000000000002', 'Do you have a preference between Mainland, Freezone, or Offshore setup?', 'Jurisdiction preference', 3),
('cf123456-7890-abcd-ef12-345678901234', 'cf110002-0000-0000-0000-000000000002', 'How many visas will you need for yourself and employees?', 'Visa requirements', 4),
('cf123456-7890-abcd-ef12-345678901234', 'cf110002-0000-0000-0000-000000000002', 'What is your target timeline for getting the company operational?', 'Assess urgency', 5),
('cf123456-7890-abcd-ef12-345678901234', 'cf110002-0000-0000-0000-000000000002', 'Will you require a physical office space or is a virtual office acceptable?', 'Office requirements', 6),
('cf123456-7890-abcd-ef12-345678901234', 'cf110003-0000-0000-0000-000000000003', 'Do you plan to trade within the UAE or primarily for international business?', 'Market scope', 7),
('cf123456-7890-abcd-ef12-345678901234', 'cf110003-0000-0000-0000-000000000003', 'Have you considered the banking requirements for your business?', 'Banking needs', 8);

-- Create objection handlers for Company Formation
INSERT INTO objection_handlers (playbook_id, objection_type, objection_trigger, severity, response_script, follow_up_question) VALUES
('cf123456-7890-abcd-ef12-345678901234', 'Price', 'too expensive|high cost|cheaper elsewhere|budget', 'medium',
  'I understand cost is an important factor. Our packages include end-to-end support, document preparation, PRO services, and ongoing compliance assistance.',
  'Would you like me to break down exactly what is included in each package?'),
('cf123456-7890-abcd-ef12-345678901234', 'Timeline', 'takes too long|need it faster|urgent|quickly', 'medium',
  'I completely understand the urgency. Freezone setups can be completed in 2-3 days, Mainland typically takes 5-7 working days.',
  'What is your ideal timeline?'),
('cf123456-7890-abcd-ef12-345678901234', 'Documentation', 'too many documents|complicated|paperwork', 'high',
  'We provide a clear checklist and our team assists with document preparation, attestation, and translation.',
  'Which specific documents are you concerned about?'),
('cf123456-7890-abcd-ef12-345678901234', 'Jurisdiction Confusion', 'mainland vs freezone|which is better|confused', 'medium',
  'Mainland allows UAE-wide trading, Freezones offer 100% ownership and tax benefits but with some trading limitations.',
  'Will you primarily be serving clients within the UAE or internationally?'),
('cf123456-7890-abcd-ef12-345678901234', 'Competitor', 'other company|cheaper quote|shopping around', 'high',
  'Our value comes from comprehensive support, transparent pricing with no hidden fees, and dedicated account management.',
  'What factors besides price are most important to you?'),
('cf123456-7890-abcd-ef12-345678901234', 'Trust', 'how do I know|guarantee|what if problems', 'high',
  'We have successfully set up over 500 companies. We provide clear contracts, regular updates, and dedicated support.',
  'Would you like to speak with a reference client in your industry?');

-- Add emotional responses with correct lowercase emotion values
INSERT INTO emotional_responses (playbook_id, emotion_detected, response_strategy, tone_adjustment, suggested_phrases, avoid_actions) VALUES
('cf123456-7890-abcd-ef12-345678901234', 'frustrated', 'Acknowledge and solve', 'Empathetic and solution-focused',
  ARRAY['I understand this can be frustrating', 'Let me help simplify this for you', 'We are here to make this easy'],
  ARRAY['Dismissing concerns', 'Adding more complexity', 'Being impatient']),
('cf123456-7890-abcd-ef12-345678901234', 'confused', 'Simplify and reassure', 'Calm and structured',
  ARRAY['Let me break this down step by step', 'We handle most of this for you', 'You focus on your business, we handle the paperwork'],
  ARRAY['Overwhelming with options', 'Using technical jargon', 'Rushing the conversation']),
('cf123456-7890-abcd-ef12-345678901234', 'interested', 'Match enthusiasm and guide', 'Energetic but focused',
  ARRAY['This is a great time to start!', 'Lets get your business up and running', 'I can see you have a clear vision'],
  ARRAY['Being too slow or cautious', 'Dampening enthusiasm', 'Over-explaining risks']),
('cf123456-7890-abcd-ef12-345678901234', 'skeptical', 'Provide evidence and transparency', 'Professional and factual',
  ARRAY['Let me show you exactly what is included', 'Here is our process step by step', 'I can provide references if helpful'],
  ARRAY['Making unsupported claims', 'Being defensive', 'Pressuring for quick decision']);
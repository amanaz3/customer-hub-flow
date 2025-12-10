-- Populate default scripts and opening lines for Outbound Sales playbook stages
UPDATE playbook_stages SET 
  opening_lines = ARRAY['Good morning/afternoon, this is [Name] from [Company].', 'Am I speaking with [Customer Name]?', 'I hope I am not catching you at a bad time.'],
  script = 'Introduce yourself and the company. Verify you are speaking with the right person. Ask for permission to continue the conversation. Briefly mention the purpose of your call without going into details yet.'
WHERE id = 'c1d1e1f1-1111-1111-1111-111111111111';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['I would love to understand more about your current situation.', 'Can you tell me a bit about your business?'],
  script = 'Ask open-ended questions to understand the customer''s needs, pain points, and goals. Listen actively and take notes. Identify decision makers and budget. Qualify the opportunity before moving to presentation.'
WHERE id = 'c2d2e2f2-2222-2222-2222-222222222222';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['Based on what you have shared, I think we have a great solution for you.', 'Let me show you how we can help with [specific pain point].'],
  script = 'Present your solution tailored to the customer''s specific needs mentioned in discovery. Focus on benefits, not features. Use relevant case studies or examples. Address how your solution solves their specific challenges.'
WHERE id = 'c3d3e3f3-3333-3333-3333-333333333333';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['I completely understand your concern.', 'That is a great question, let me address that.'],
  script = 'Listen carefully to objections without interrupting. Acknowledge concerns before responding. Provide evidence, testimonials, or data to address concerns. Ask follow-up questions to ensure the objection is fully resolved.'
WHERE id = 'c4d4e4f4-4444-4444-4444-444444444444';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['Based on our conversation, I think we are a great fit.', 'What would you like to do as a next step?'],
  script = 'Summarize the key benefits discussed. Ask for commitment or next steps. Handle any final hesitations. Confirm timeline and follow-up actions. Thank them for their time.'
WHERE id = 'c5d5e5f5-5555-5555-5555-555555555555';

-- Populate default scripts and opening lines for Inbound Support playbook stages
UPDATE playbook_stages SET 
  opening_lines = ARRAY['Thank you for calling [Company], my name is [Name].', 'How may I assist you today?', 'May I have your account number or email to verify your identity?'],
  script = 'Greet the customer warmly. Verify their identity for security. Set expectations for the call. Show empathy and willingness to help.'
WHERE id = 'c6d6e6f6-6666-6666-6666-666666666666';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['I am sorry to hear you are experiencing this issue.', 'Can you walk me through exactly what happened?'],
  script = 'Ask clarifying questions to fully understand the issue. Take detailed notes. Show empathy throughout. Repeat back the issue to confirm understanding before attempting resolution.'
WHERE id = 'c7d7e7f7-7777-7777-7777-777777777777';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['I have found a solution for you.', 'Let me walk you through the steps to resolve this.'],
  script = 'Explain the solution clearly step by step. Confirm the customer can follow along. Verify the issue is resolved before closing. Offer additional assistance if needed.'
WHERE id = 'c8d8e8f8-8888-8888-8888-888888888888';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['Is there anything else I can help you with today?', 'I am glad we could resolve this for you.'],
  script = 'Summarize what was accomplished. Confirm customer satisfaction. Offer additional assistance. Thank them for their patience. Document the case properly.'
WHERE id = 'c9d9e9f9-9999-9999-9999-999999999999';

-- Populate default scripts and opening lines for Company Formation playbook stages
UPDATE playbook_stages SET 
  opening_lines = ARRAY['Good morning/afternoon, this is [Name] from [Company].', 'I understand you are interested in setting up a business in the UAE.', 'Congratulations on taking this exciting step!'],
  script = 'Introduce yourself and establish credibility. Verify the customer''s interest in company formation. Ask about their timeline and urgency. Set the agenda for the call.'
WHERE id = 'cf110001-0000-0000-0000-000000000001';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['To recommend the best setup for you, I need to understand your business better.', 'What type of business are you planning to start?'],
  script = 'Ask about business activity, ownership structure, visa requirements, office needs, and jurisdiction preferences. Take detailed notes on all requirements. Identify any special licensing needs based on activity.'
WHERE id = 'cf110002-0000-0000-0000-000000000002';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['Based on your requirements, I recommend...', 'Let me explain the key differences between your options.'],
  script = 'Present the recommended license type and jurisdiction. Explain Mainland vs Freezone differences clearly. Discuss visa quotas and office options. Address any specific regulatory requirements for their activity.'
WHERE id = 'cf110003-0000-0000-0000-000000000003';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['Let me walk you through our packages and pricing.', 'Here is what is included in our service.'],
  script = 'Present pricing packages clearly. Explain what is included (license, visa, PRO services, etc.). Highlight value-added services. Offer package comparisons if applicable.'
WHERE id = 'cf110004-0000-0000-0000-000000000004';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['I understand you may have some concerns.', 'Let me address that for you.'],
  script = 'Listen to objections carefully. Provide clear, factual responses. Use testimonials and case studies when relevant. Offer alternatives if the original recommendation does not fit.'
WHERE id = 'cf110005-0000-0000-0000-000000000005';

UPDATE playbook_stages SET 
  opening_lines = ARRAY['Great! Let us get started on your company formation.', 'Here is what happens next.'],
  script = 'Summarize the selected package and pricing. Explain the document requirements and next steps. Collect initial payment or confirm payment method. Schedule follow-up for document collection. Send confirmation email with checklist.'
WHERE id = 'cf110006-0000-0000-0000-000000000006';
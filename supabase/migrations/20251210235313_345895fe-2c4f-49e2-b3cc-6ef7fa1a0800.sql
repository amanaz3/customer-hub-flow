-- Insert Bank Account Opening Outbound Sales Playbook
DO $$
DECLARE
  playbook_id uuid;
  bank_product_id uuid;
  stage_opening_id uuid;
  stage_discovery_id uuid;
  stage_pitch_id uuid;
  stage_negotiation_id uuid;
  stage_closing_id uuid;
BEGIN
  -- Get Bank Account product ID
  SELECT id INTO bank_product_id FROM products WHERE name ILIKE '%bank%account%' LIMIT 1;
  
  -- Create the playbook
  INSERT INTO sales_playbooks (name, description, product_id, call_type, target_segments, is_active)
  VALUES (
    'Bank Account Opening - Outbound Sales',
    'Comprehensive outbound sales playbook for new business bank account opening services. Covers UAE banks, documentation requirements, and compliance considerations.',
    bank_product_id,
    'outbound',
    ARRAY['new_business', 'startup', 'sme', 'corporate'],
    true
  )
  RETURNING id INTO playbook_id;

  -- Create Stages
  INSERT INTO playbook_stages (playbook_id, stage_name, stage_order, stage_type, duration_seconds, key_objectives, success_criteria, script, opening_lines)
  VALUES 
    (playbook_id, 'Opening & Rapport', 1, 'opening', 120, 
     ARRAY['Build initial trust', 'Confirm decision maker', 'Set call agenda', 'Establish authority'],
     ARRAY['Client engaged and responsive', 'Confirmed speaking with right person', 'Client agrees to continue call'],
     'Start with a warm, professional greeting. Reference any prior touchpoints. Quickly establish your credibility and the value you provide. Set clear expectations for the call duration and agenda.',
     ARRAY['Good morning/afternoon, this is [Name] from Amana Corporate. Am I speaking with [Client Name]?', 'I noticed you recently incorporated a business - congratulations! Most new businesses need a corporate bank account, and I wanted to share how we can help make that process smooth.', 'Do you have about 10 minutes? I would like to understand your banking needs and see if we can help.'])
  RETURNING id INTO stage_opening_id;

  INSERT INTO playbook_stages (playbook_id, stage_name, stage_order, stage_type, duration_seconds, key_objectives, success_criteria, script, opening_lines)
  VALUES 
    (playbook_id, 'Discovery & Qualification', 2, 'discovery', 300,
     ARRAY['Understand business type and activities', 'Identify banking requirements', 'Assess urgency and timeline', 'Uncover pain points with current/past banking'],
     ARRAY['Clear understanding of business model', 'Identified specific banking needs', 'Understood timeline urgency', 'Qualified budget expectations'],
     'Ask open-ended questions to understand their business activities, expected transaction volumes, and specific banking features they need. Listen actively for pain points and urgency indicators.',
     ARRAY['Tell me about your business - what industry are you in and what are your main activities?', 'Have you had any experience with UAE banks before, or is this your first time?', 'What is driving your timeline - do you have any urgent payments or transactions coming up?'])
  RETURNING id INTO stage_discovery_id;

  INSERT INTO playbook_stages (playbook_id, stage_name, stage_order, stage_type, duration_seconds, key_objectives, success_criteria, script, opening_lines)
  VALUES 
    (playbook_id, 'Solution Presentation', 3, 'pitch', 240,
     ARRAY['Present tailored bank recommendations', 'Explain our value proposition', 'Address documentation requirements', 'Highlight success stories'],
     ARRAY['Client understands bank options', 'Clear on documentation needs', 'Sees value in our service', 'Shows interest in proceeding'],
     'Based on their needs, recommend 2-3 suitable banks. Explain processing times, minimum balance requirements, and our role in facilitating the process. Use specific examples and success stories.',
     ARRAY['Based on what you have shared, I recommend we look at [Bank 1] and [Bank 2] - both work well for [industry] businesses.', 'Our role is to handle the entire application process, liaise with the bank, and ensure your documents are perfect before submission.', 'Most of our clients get their accounts opened within 2-3 weeks when they work with us.'])
  RETURNING id INTO stage_pitch_id;

  INSERT INTO playbook_stages (playbook_id, stage_name, stage_order, stage_type, duration_seconds, key_objectives, success_criteria, script, opening_lines)
  VALUES 
    (playbook_id, 'Pricing & Negotiation', 4, 'negotiation', 180,
     ARRAY['Present pricing structure', 'Handle fee objections', 'Discuss payment terms', 'Demonstrate ROI'],
     ARRAY['Client understands pricing', 'Objections addressed', 'Agreement on commercial terms', 'Client sees value exceeds cost'],
     'Present pricing confidently. Be prepared to justify the fee based on time saved, success rate, and expertise. Have flexibility for bundled services but maintain value positioning.',
     ARRAY['Our service fee for bank account opening is [X] AED, which includes document preparation, bank liaison, and follow-up until account activation.', 'Many clients tell us this saves them weeks of back-and-forth with banks - time they use to focus on growing their business.', 'If you are also looking at [other services], we can offer a package rate.'])
  RETURNING id INTO stage_negotiation_id;

  INSERT INTO playbook_stages (playbook_id, stage_name, stage_order, stage_type, duration_seconds, key_objectives, success_criteria, script, opening_lines)
  VALUES 
    (playbook_id, 'Closing & Next Steps', 5, 'closing', 120,
     ARRAY['Secure commitment', 'Clarify next steps', 'Set document collection timeline', 'Schedule follow-up'],
     ARRAY['Client confirms to proceed', 'Clear action items agreed', 'Timeline established', 'Payment/contract discussed'],
     'Summarize what was discussed, confirm their decision, and outline exactly what happens next. Create urgency where appropriate and end with clear action items.',
     ARRAY['So to confirm, you would like us to proceed with [Bank] for your [Company] account opening. Is that correct?', 'The next step is to collect your documents. I will send you our checklist today - can you have everything ready by [date]?', 'Once we have your documents and the service fee, we typically submit to the bank within 48 hours.'])
  RETURNING id INTO stage_closing_id;

  -- Create Discovery Questions
  INSERT INTO discovery_questions (playbook_id, stage_id, question_text, question_purpose, priority)
  VALUES
    (playbook_id, stage_discovery_id, 'What type of business activities will your company be engaged in?', 'Understand business nature for bank matching', 1),
    (playbook_id, stage_discovery_id, 'What is your expected monthly transaction volume in terms of number and value?', 'Assess banking tier requirements', 2),
    (playbook_id, stage_discovery_id, 'Will you be receiving international transfers or mainly local transactions?', 'Determine need for international banking features', 3),
    (playbook_id, stage_discovery_id, 'Have you applied to any banks before? If so, what happened?', 'Identify previous issues or rejections', 4),
    (playbook_id, stage_discovery_id, 'What is your timeline for having an active bank account?', 'Assess urgency and prioritization', 5),
    (playbook_id, stage_discovery_id, 'Where are your shareholders based? Are any from high-risk countries?', 'Risk assessment for bank matching', 6),
    (playbook_id, stage_discovery_id, 'Do you need any specific banking features like online banking, multiple signatories, or cards?', 'Identify specific feature requirements', 7),
    (playbook_id, stage_discovery_id, 'What minimum balance can you maintain in the account?', 'Match to appropriate bank tier', 8);

  -- Create Objection Handlers
  INSERT INTO objection_handlers (playbook_id, objection_type, objection_trigger, severity, response_script, follow_up_question)
  VALUES
    (playbook_id, 'price', 'Your fees are too high / I can apply directly', 'high', 
     'I understand cost is important. The difference is our 95% approval rate versus 40% for direct applications. When banks reject, you lose weeks and sometimes damage your relationship with that bank. Our fee includes document optimization, bank liaison, and resubmission if needed - essentially insurance for your time and success.',
     'How much is your time worth? If we save you 3-4 weeks of back-and-forth, does that change the equation?'),
    (playbook_id, 'timing', 'I need to think about it / Not ready yet', 'medium',
     'Of course, this is an important decision. What specific aspects would you like to think through? Many clients initially delay, then realize bank account delays cost them business opportunities. We had a client last month who lost a contract because they could not receive payment in time.',
     'Is there a specific concern I can address now that would help with your decision?'),
    (playbook_id, 'competition', 'I am getting other quotes / Someone offered cheaper', 'high',
     'Thats smart to compare. May I ask what services are included in that quote? Some providers just submit applications without the bank relationship or document preparation. Our approach includes direct contact with bank relationship managers, which significantly improves approval chances and speed.',
     'What matters most to you - the lowest price or the highest chance of quick approval?'),
    (playbook_id, 'trust', 'How do I know you can deliver?', 'medium',
     'Great question. We have opened over 500 business accounts in the past 3 years with a 95% success rate. I can share references from businesses similar to yours. We also work on a milestone basis - you can see progress at each stage.',
     'Would you like me to connect you with a client in your industry who recently worked with us?'),
    (playbook_id, 'process', 'The process seems complicated', 'low',
     'I hear that concern often. Our job is to make it simple for you. You provide the documents once, and we handle everything with the bank. We have a client portal where you can track progress, and I will personally update you at each milestone.',
     'What if I walk you through exactly what you need to provide? It is simpler than you might think.'),
    (playbook_id, 'banks', 'I want a specific bank only', 'medium',
     'I understand you have a preference for [Bank]. We work with all major UAE banks including [Bank]. Let me check their current requirements for your business type. If [Bank] is not suitable, I can explain why and suggest alternatives that would work better for your needs.',
     'Is there a specific reason you prefer [Bank]? It helps me understand your priorities.');

  -- Create Pricing Strategies
  INSERT INTO pricing_strategies (playbook_id, customer_segment, urgency_level, discount_range_min, discount_range_max, pricing_script, negotiation_floor)
  VALUES
    (playbook_id, 'startup', 'high', 0, 10, 'For new startups, we offer our standard rate of [X] AED. Given your timeline urgency, we can prioritize your application. If you are also incorporating with us, we can bundle for better value.', 10),
    (playbook_id, 'sme', 'medium', 5, 15, 'For established SMEs, our rate is [X] AED. This includes premium bank matching based on your business profile. For ongoing clients, we offer loyalty discounts on additional services.', 15),
    (playbook_id, 'corporate', 'low', 10, 20, 'For corporate clients, we customize our pricing based on complexity. Standard accounts start at [X] AED. For multiple accounts or complex structures, we offer package rates.', 20),
    (playbook_id, 'new_business', 'high', 0, 5, 'Our bank account opening service is [X] AED. This is a fixed, transparent fee with no hidden charges. Given you are just starting, speed is usually critical - we prioritize new business accounts.', 5);

  -- Create Emotional Responses (using valid emotion_detected values)
  INSERT INTO emotional_responses (playbook_id, emotion_detected, response_strategy, tone_adjustment, suggested_phrases, avoid_actions)
  VALUES
    (playbook_id, 'frustrated', 'Acknowledge their frustration first, then offer solutions. Use empathetic language and focus on how you can solve their problem.', 'calm_empathetic',
     ARRAY['I completely understand how frustrating this must be', 'You are right to be concerned about this', 'Let me see how we can fix this for you'],
     ARRAY['Do not dismiss their concerns', 'Avoid being defensive', 'Do not rush to solutions before acknowledging']),
    (playbook_id, 'confused', 'Reassure them with clarity and process transparency. Break down steps into manageable pieces. Provide certainty where possible.', 'reassuring_confident',
     ARRAY['I will guide you through each step', 'This is a very common concern - here is how we handle it', 'You are in good hands with our track record'],
     ARRAY['Do not add more complexity', 'Avoid uncertain language', 'Do not overwhelm with information']),
    (playbook_id, 'interested', 'Match their energy positively. Use this momentum to move toward commitment. Reinforce their good decision.', 'enthusiastic_professional',
     ARRAY['This is a great time to be starting your business', 'I can see why you are excited - you have a solid plan', 'Let us get this moving quickly for you'],
     ARRAY['Do not dampen enthusiasm', 'Avoid being too formal', 'Do not slow momentum unnecessarily']),
    (playbook_id, 'skeptical', 'Provide proof points and references. Be transparent about process and pricing. Offer to address specific concerns directly.', 'factual_transparent',
     ARRAY['That is a fair question - let me give you the specifics', 'I can provide references from similar businesses', 'Here is exactly what is included and what is not'],
     ARRAY['Do not be vague', 'Avoid overselling', 'Do not ignore their doubts']);

  RAISE NOTICE 'Bank Account Opening Playbook created successfully with ID: %', playbook_id;
END $$;
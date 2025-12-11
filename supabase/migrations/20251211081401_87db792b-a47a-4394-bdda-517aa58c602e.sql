
-- Emotional Responses for all 3 playbooks (using lowercase emotion values)
INSERT INTO emotional_responses (playbook_id, emotion_detected, response_strategy, tone_adjustment, suggested_phrases, avoid_actions)
VALUES
  -- Inbound Support emotions
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'interested', 'Match their energy and move quickly to next steps', 'Enthusiastic and positive', ARRAY['That is great to hear!', 'I am excited to help you get started!', 'Let us make this happen!'], ARRAY['Being too slow', 'Over-explaining']),
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'confused', 'Slow down and explain clearly with examples', 'Patient and reassuring', ARRAY['Let me explain that more simply', 'Think of it this way', 'Does that make sense so far?'], ARRAY['Using jargon', 'Rushing', 'Being condescending']),
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'skeptical', 'Provide proof points and testimonials', 'Confident but not pushy', ARRAY['I understand your concern', 'Let me share some examples', 'Here is what our clients say'], ARRAY['Being defensive', 'Overselling']),
  -- Customer Support emotions
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'frustrated', 'Acknowledge feelings first, then solve', 'Calm and empathetic', ARRAY['I completely understand your frustration', 'You have every right to be upset', 'Let me fix this for you'], ARRAY['Being defensive', 'Interrupting', 'Minimizing concerns']),
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'confused', 'Reassure and provide clear timeline', 'Calm and confident', ARRAY['I am here to help', 'Let me walk you through exactly what happens next', 'You are in good hands'], ARRAY['Adding uncertainty', 'Being vague']),
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'skeptical', 'Acknowledge and commit to resolution', 'Sincere and action-oriented', ARRAY['I am sorry we let you down', 'Here is what I am going to do', 'I will personally ensure this is resolved'], ARRAY['Making excuses', 'Blaming others']),
  -- Follow-up emotions
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'interested', 'Build momentum and guide to action', 'Encouraging and helpful', ARRAY['Great question!', 'I can help with that', 'Let us take the next step together'], ARRAY['Being passive', 'Letting momentum fade']),
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'confused', 'Address concerns without pressure', 'Understanding and supportive', ARRAY['Take your time', 'What concerns do you have?', 'There is no pressure'], ARRAY['Being pushy', 'Creating artificial urgency']),
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'frustrated', 'Offer to reschedule or send summary', 'Respectful of their time', ARRAY['I can tell you are busy', 'Would another time work better?', 'I can send you a summary to review'], ARRAY['Pushing through', 'Long explanations']);

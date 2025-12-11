
-- Insert stages for New Business Bank Account - Inbound Support
INSERT INTO playbook_stages (playbook_id, stage_name, stage_type, stage_order, key_objectives, opening_lines)
VALUES 
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'Greeting & Qualification', 'opening', 1, 
   ARRAY['Warm greeting', 'Identify inquiry type', 'Qualify lead'], 
   ARRAY['Thank you for calling AMANA. My name is [Agent], how may I assist you today?', 'I understand you are interested in opening a business bank account. That is great!']),
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'Needs Discovery', 'discovery', 2,
   ARRAY['Understand business type', 'Identify banking requirements', 'Assess transaction volume needs'],
   ARRAY['Could you tell me more about your business and your banking needs?', 'What type of transactions will you primarily be doing?']),
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'Solution Presentation', 'pitch', 3,
   ARRAY['Present suitable bank options', 'Explain requirements and timeline', 'Highlight benefits'],
   ARRAY['Based on your requirements, I would recommend these banking options...', 'Let me explain the process and what documents you will need.']),
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'Handle Concerns', 'objection_handling', 4,
   ARRAY['Address pricing questions', 'Handle timeline concerns', 'Clarify requirements'],
   ARRAY['I understand your concern about the timeline...', 'Let me address that for you.']),
  ('ef098fce-d2f8-494a-bae3-f25f8bc9602c', 'Close & Next Steps', 'closing', 5,
   ARRAY['Confirm interest', 'Schedule follow-up', 'Collect initial information'],
   ARRAY['Shall I schedule a consultation to discuss this further?', 'I will send you an email with all the details.']);

-- Insert stages for New Business Bank Account - Customer Support
INSERT INTO playbook_stages (playbook_id, stage_name, stage_type, stage_order, key_objectives, opening_lines)
VALUES 
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'Greeting & Verification', 'opening', 1,
   ARRAY['Warm greeting', 'Verify customer identity', 'Access customer account'],
   ARRAY['Thank you for calling, this is [Agent Name]. How may I assist you today?', 'May I have your company name or reference number please?']),
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'Issue Identification', 'discovery', 2,
   ARRAY['Understand the issue clearly', 'Identify urgency level', 'Document the problem'],
   ARRAY['I understand. Could you please describe the issue with your bank account application?', 'I am here to help. Can you walk me through what happened?']),
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'Troubleshooting & Resolution', 'pitch', 3,
   ARRAY['Provide solution or workaround', 'Escalate if needed', 'Set clear expectations'],
   ARRAY['Based on what you have described, here is what we can do...', 'Let me check your application status and find the best solution.']),
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'Handle Objections', 'objection_handling', 4,
   ARRAY['Address concerns', 'De-escalate frustration', 'Offer alternatives'],
   ARRAY['I understand your concern...', 'Let me see what options we have for you.']),
  ('0f3fcadb-4ec9-4605-856d-7bfc737d5937', 'Confirmation & Close', 'closing', 5,
   ARRAY['Confirm understanding', 'Summarize actions', 'Provide reference number', 'Thank the customer'],
   ARRAY['Let me summarize what we have discussed and the next steps...', 'Is there anything else I can help you with today?']);

-- Insert stages for New Business Bank Account - Follow-up
INSERT INTO playbook_stages (playbook_id, stage_name, stage_type, stage_order, key_objectives, opening_lines)
VALUES 
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'Re-engagement Opening', 'opening', 1,
   ARRAY['Re-establish rapport', 'Confirm continued interest', 'Gauge current status'],
   ARRAY['Hi [Customer Name], this is [Agent] from AMANA. We spoke [timeframe] ago about your bank account application. Is this still a good time?', 'I wanted to follow up and see how things are progressing.']),
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'Status Check & Updates', 'discovery', 2,
   ARRAY['Identify any new requirements', 'Address questions from previous call', 'Understand decision timeline'],
   ARRAY['Have there been any changes since we last spoke?', 'Did you have a chance to review the bank options I sent?']),
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'Objection Handling', 'objection_handling', 3,
   ARRAY['Identify blockers', 'Address documentation concerns', 'Handle timeline questions'],
   ARRAY['I understand you may have some concerns. What is holding you back from moving forward?', 'Let me help address any questions about the documents needed.']),
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'Commitment & Close', 'negotiation', 4,
   ARRAY['Secure commitment', 'Schedule next action', 'Collect required documents'],
   ARRAY['Based on our discussion, shall we proceed with the bank account application?', 'I can schedule a document collection meeting this week if that works for you.']),
  ('9fbcb522-48d4-404c-ad7a-a9a1fd2440d9', 'Confirmation & Next Steps', 'closing', 5,
   ARRAY['Confirm agreements', 'Set clear expectations', 'Thank and close professionally'],
   ARRAY['Excellent! Let me confirm what we have agreed on...', 'You will receive an email with all the details and next steps shortly.']);

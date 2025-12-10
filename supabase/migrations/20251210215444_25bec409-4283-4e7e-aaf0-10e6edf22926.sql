-- Fix Company Formation outbound opening to proper outbound language
UPDATE playbook_stages 
SET opening_lines = ARRAY[
  'Good morning/afternoon! This is [Agent] from AMANA. Am I speaking with [Customer Name]?',
  'I hope I''m not catching you at a bad time. I''m reaching out regarding company formation services in the UAE.'
]
WHERE id = 'cf110001-0000-0000-0000-000000000001';
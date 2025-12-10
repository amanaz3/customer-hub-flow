-- Sample Decision Tree for "Introduction & Qualification" stage (Company Formation)
-- Using gen_random_uuid() for proper UUIDs

-- First, insert root nodes and capture their IDs via CTEs
WITH root_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  VALUES ('cf110001-0000-0000-0000-000000000001', NULL, 'root', 
    'Good morning/afternoon! Thank you for calling AMANA. My name is [Agent]. I understand you''re interested in setting up a business in the UAE. Is that correct?', 
    NULL, 0)
  RETURNING id
),
branch1_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'cf110001-0000-0000-0000-000000000001', id, 'branch',
    'Excellent! I''d love to help you with that. To recommend the best solution, may I ask what type of business activity you''re planning?',
    'Customer confirms interest', 1
  FROM root_cf
  RETURNING id
),
branch2_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'cf110001-0000-0000-0000-000000000001', id, 'branch',
    'No problem at all. Many of our clients start by exploring their options. Would you like me to give you a quick overview of how company formation works in the UAE?',
    'Customer is unsure or just browsing', 2
  FROM root_cf
  RETURNING id
),
branch3_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'cf110001-0000-0000-0000-000000000001', id, 'branch',
    'I completely understand - budget is important. Our packages start from AED 15,000. To give you an accurate quote, could I ask a few quick questions about your business needs?',
    'Customer asks about pricing immediately', 3
  FROM root_cf
  RETURNING id
),
-- Sub-branches under "confirms interest"
sub1_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'cf110001-0000-0000-0000-000000000001', id, 'branch',
    'Trading and general trading are very popular choices. Will you need to import/export goods, or primarily trade within the UAE?',
    'Trading or general trading', 4
  FROM branch1_cf
  RETURNING id
),
sub2_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'cf110001-0000-0000-0000-000000000001', id, 'branch',
    'Consultancy services are excellent for the UAE market. Will you be providing services to local companies, international clients, or both?',
    'Consultancy or professional services', 5
  FROM branch1_cf
  RETURNING id
),
sub3_cf AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'cf110001-0000-0000-0000-000000000001', id, 'leaf',
    'E-commerce is a growing sector here. Will you need a physical warehouse, or will you be dropshipping?',
    'E-commerce or online business', 6
  FROM branch1_cf
  RETURNING id
),
-- Inbound Support - Issue Identification stage
root_is AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  VALUES ('c7d7e7f7-7777-7777-7777-777777777777', NULL, 'root',
    'I''m sorry to hear you''re experiencing an issue. Could you please describe what''s happening so I can help you resolve it?',
    NULL, 0)
  RETURNING id
),
branch1_is AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'c7d7e7f7-7777-7777-7777-777777777777', id, 'branch',
    'I understand you''re having trouble with your documents. Is this related to uploading documents, viewing documents, or document requirements?',
    'Document-related issue', 1
  FROM root_is
  RETURNING id
),
branch2_is AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'c7d7e7f7-7777-7777-7777-777777777777', id, 'branch',
    'I can help you with that payment concern. Is the issue related to making a payment, a failed transaction, or needing a refund?',
    'Payment or billing issue', 2
  FROM root_is
  RETURNING id
),
branch3_is AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'c7d7e7f7-7777-7777-7777-777777777777', id, 'branch',
    'Let me check your application status right away. Could you please provide your reference number?',
    'Application status inquiry', 3
  FROM root_is
  RETURNING id
),
sub1_is AS (
  INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
  SELECT 'c7d7e7f7-7777-7777-7777-777777777777', id, 'leaf',
    'For uploading issues, please try using Chrome browser and ensure your file is under 10MB in PDF format. Would you like me to stay on the line while you try again?',
    'Upload problem', 4
  FROM branch1_is
  RETURNING id
)
INSERT INTO public.script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c7d7e7f7-7777-7777-7777-777777777777', id, 'leaf',
  'I can see your documents in the system. Let me resend the access link to your registered email. Please check your spam folder as well.',
  'Cannot view documents', 5
FROM branch1_is;
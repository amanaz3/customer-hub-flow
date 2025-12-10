-- Add sample decision trees for all remaining stages using gen_random_uuid()

-- Company Formation - Business Discovery
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'cf110002-0000-0000-0000-000000000002', NULL, 'root', 'To recommend the best business setup, I need to understand your business better. What type of business activity are you planning?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110002-0000-0000-0000-000000000002', id, 'branch', 'Trading is very common here. Will you be importing/exporting goods, or focusing on local trade?', 'Trading or General Trading', 1
FROM script_nodes WHERE stage_id = 'cf110002-0000-0000-0000-000000000002' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110002-0000-0000-0000-000000000002', id, 'branch', 'Professional services are popular. Will you need office space or can you operate remotely?', 'Consultancy or Services', 2
FROM script_nodes WHERE stage_id = 'cf110002-0000-0000-0000-000000000002' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110002-0000-0000-0000-000000000002', id, 'branch', 'Technology companies have great options here. Are you a startup or established company?', 'Technology or IT', 3
FROM script_nodes WHERE stage_id = 'cf110002-0000-0000-0000-000000000002' AND parent_id IS NULL LIMIT 1;

-- Company Formation - License & Jurisdiction
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'cf110003-0000-0000-0000-000000000003', NULL, 'root', 'Based on your business activity, I have some great jurisdiction options. Do you prefer mainland or free zone?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110003-0000-0000-0000-000000000003', id, 'branch', 'Mainland gives you unrestricted access to UAE market. You can trade anywhere without restrictions.', 'Prefers mainland', 1
FROM script_nodes WHERE stage_id = 'cf110003-0000-0000-0000-000000000003' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110003-0000-0000-0000-000000000003', id, 'branch', 'Free zones offer 100% ownership and tax benefits. Which features matter most - location, cost, or activity permissions?', 'Prefers free zone', 2
FROM script_nodes WHERE stage_id = 'cf110003-0000-0000-0000-000000000003' AND parent_id IS NULL LIMIT 1;

-- Company Formation - Pricing & Package
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'cf110004-0000-0000-0000-000000000004', NULL, 'root', 'Let me share our package options. We have Standard, Premium, and Enterprise. What level of support are you looking for?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110004-0000-0000-0000-000000000004', id, 'branch', 'Our Standard package covers all essentials. It includes license, visa allocation, and basic support.', 'Budget conscious', 1
FROM script_nodes WHERE stage_id = 'cf110004-0000-0000-0000-000000000004' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110004-0000-0000-0000-000000000004', id, 'branch', 'Premium includes priority processing, dedicated manager, and bank account assistance.', 'Wants full service', 2
FROM script_nodes WHERE stage_id = 'cf110004-0000-0000-0000-000000000004' AND parent_id IS NULL LIMIT 1;

-- Company Formation - Objection Resolution
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'cf110005-0000-0000-0000-000000000005', NULL, 'root', 'I understand you might have some concerns. What would you like me to clarify?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110005-0000-0000-0000-000000000005', id, 'branch', 'I understand price is important. Let me break down the value you get with our comprehensive service.', 'Price concern', 1
FROM script_nodes WHERE stage_id = 'cf110005-0000-0000-0000-000000000005' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110005-0000-0000-0000-000000000005', id, 'branch', 'Timeline concerns are valid. With our expedited service, we can complete setup faster.', 'Timeline concern', 2
FROM script_nodes WHERE stage_id = 'cf110005-0000-0000-0000-000000000005' AND parent_id IS NULL LIMIT 1;

-- Company Formation - Closing
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'cf110006-0000-0000-0000-000000000006', NULL, 'root', 'Excellent! Let me summarize what we discussed. Shall we proceed with the application today?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110006-0000-0000-0000-000000000006', id, 'branch', 'Great! I will send you the document checklist right away. We will start processing immediately.', 'Ready to proceed', 1
FROM script_nodes WHERE stage_id = 'cf110006-0000-0000-0000-000000000006' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'cf110006-0000-0000-0000-000000000006', id, 'branch', 'No problem, take your time. I will send you a detailed proposal by email.', 'Needs time to decide', 2
FROM script_nodes WHERE stage_id = 'cf110006-0000-0000-0000-000000000006' AND parent_id IS NULL LIMIT 1;

-- Inbound Support - Greeting & Verification
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c6d6e6f6-6666-6666-6666-666666666666', NULL, 'root', 'Thank you for calling. My name is [Agent]. May I have your name and reference number please?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c6d6e6f6-6666-6666-6666-666666666666', id, 'branch', 'Thank you. I can see your account. How may I assist you today?', 'Customer verified', 1
FROM script_nodes WHERE stage_id = 'c6d6e6f6-6666-6666-6666-666666666666' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c6d6e6f6-6666-6666-6666-666666666666', id, 'branch', 'I could not find that reference. Could you verify the email or phone on the account?', 'Cannot find account', 2
FROM script_nodes WHERE stage_id = 'c6d6e6f6-6666-6666-6666-666666666666' AND parent_id IS NULL LIMIT 1;

-- Inbound Support - Resolution
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c8d8e8f8-8888-8888-8888-888888888888', NULL, 'root', 'I understand your concern. Let me look into this for you right away.', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c8d8e8f8-8888-8888-8888-888888888888', id, 'branch', 'I found the issue and can resolve it now. Does this solve your problem?', 'Issue identified', 1
FROM script_nodes WHERE stage_id = 'c8d8e8f8-8888-8888-8888-888888888888' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c8d8e8f8-8888-8888-8888-888888888888', id, 'branch', 'This requires specialist attention. I will escalate and they will contact you shortly.', 'Needs escalation', 2
FROM script_nodes WHERE stage_id = 'c8d8e8f8-8888-8888-8888-888888888888' AND parent_id IS NULL LIMIT 1;

-- Inbound Support - Wrap-up
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c9d9e9f9-9999-9999-9999-999999999999', NULL, 'root', 'Is there anything else I can help you with today?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c9d9e9f9-9999-9999-9999-999999999999', id, 'branch', 'Thank you for contacting us. You will receive a summary email shortly. Have a great day!', 'No further questions', 1
FROM script_nodes WHERE stage_id = 'c9d9e9f9-9999-9999-9999-999999999999' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c9d9e9f9-9999-9999-9999-999999999999', id, 'branch', 'Of course, I am happy to help with that as well.', 'Has more questions', 2
FROM script_nodes WHERE stage_id = 'c9d9e9f9-9999-9999-9999-999999999999' AND parent_id IS NULL LIMIT 1;

-- Outbound Sales - Opening & Rapport
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c1d1e1f1-1111-1111-1111-111111111111', NULL, 'root', 'Hi, this is [Agent] from [Company]. I am calling because [reason]. Do you have a moment?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c1d1e1f1-1111-1111-1111-111111111111', id, 'branch', 'Great! I wanted to share how we have helped similar businesses like yours.', 'Has time', 1
FROM script_nodes WHERE stage_id = 'c1d1e1f1-1111-1111-1111-111111111111' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c1d1e1f1-1111-1111-1111-111111111111', id, 'branch', 'No problem. When would be a better time to call?', 'Busy now', 2
FROM script_nodes WHERE stage_id = 'c1d1e1f1-1111-1111-1111-111111111111' AND parent_id IS NULL LIMIT 1;

-- Outbound Sales - Discovery
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c2d2e2f2-2222-2222-2222-222222222222', NULL, 'root', 'To share the most relevant information, can you tell me about your current situation?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c2d2e2f2-2222-2222-2222-222222222222', id, 'branch', 'That is a common challenge. What impact is this having on your business?', 'Shares pain point', 1
FROM script_nodes WHERE stage_id = 'c2d2e2f2-2222-2222-2222-222222222222' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c2d2e2f2-2222-2222-2222-222222222222', id, 'branch', 'Understood. What would an ideal solution look like for you?', 'Describes current state', 2
FROM script_nodes WHERE stage_id = 'c2d2e2f2-2222-2222-2222-222222222222' AND parent_id IS NULL LIMIT 1;

-- Outbound Sales - Solution Presentation
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c3d3e3f3-3333-3333-3333-333333333333', NULL, 'root', 'Based on what you shared, I think our solution would be perfect. Let me explain.', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c3d3e3f3-3333-3333-3333-333333333333', id, 'branch', 'Exactly! Would you like to see how this works in practice?', 'Shows interest', 1
FROM script_nodes WHERE stage_id = 'c3d3e3f3-3333-3333-3333-333333333333' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c3d3e3f3-3333-3333-3333-333333333333', id, 'branch', 'I understand the hesitation. Let me share a quick example of similar success.', 'Seems skeptical', 2
FROM script_nodes WHERE stage_id = 'c3d3e3f3-3333-3333-3333-333333333333' AND parent_id IS NULL LIMIT 1;

-- Outbound Sales - Objection Handling
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c4d4e4f4-4444-4444-4444-444444444444', NULL, 'root', 'That is a fair concern. Many of our clients felt the same way initially.', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c4d4e4f4-4444-4444-4444-444444444444', id, 'branch', 'The investment typically pays for itself quickly. Shall I walk you through the ROI?', 'Price objection', 1
FROM script_nodes WHERE stage_id = 'c4d4e4f4-4444-4444-4444-444444444444' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c4d4e4f4-4444-4444-4444-444444444444', id, 'branch', 'I understand needing to involve others. What info would help you present this internally?', 'Needs approval', 2
FROM script_nodes WHERE stage_id = 'c4d4e4f4-4444-4444-4444-444444444444' AND parent_id IS NULL LIMIT 1;

-- Outbound Sales - Closing
INSERT INTO script_nodes (id, stage_id, parent_id, node_type, script_text, trigger_condition, order_index) VALUES
(gen_random_uuid(), 'c5d5e5f5-5555-5555-5555-555555555555', NULL, 'root', 'Based on our conversation, this would really help. What would you need to move forward?', NULL, 0);

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c5d5e5f5-5555-5555-5555-555555555555', id, 'branch', 'Excellent! Let me send you the agreement right now. We can start immediately.', 'Ready to buy', 1
FROM script_nodes WHERE stage_id = 'c5d5e5f5-5555-5555-5555-555555555555' AND parent_id IS NULL LIMIT 1;

INSERT INTO script_nodes (stage_id, parent_id, node_type, script_text, trigger_condition, order_index)
SELECT 'c5d5e5f5-5555-5555-5555-555555555555', id, 'branch', 'No rush. Can we schedule a follow-up to answer any questions?', 'Needs more time', 2
FROM script_nodes WHERE stage_id = 'c5d5e5f5-5555-5555-5555-555555555555' AND parent_id IS NULL LIMIT 1;
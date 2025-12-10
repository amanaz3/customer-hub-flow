-- Create the Customer Support playbook
INSERT INTO sales_playbooks (name, call_type, description, is_active, target_segments)
VALUES (
  'Company Formation - Customer Support',
  'inbound',
  'Post-sale customer support playbook for handling issues, questions, and problems after company formation services are delivered',
  true,
  ARRAY['existing_customers', 'post_sale']
);
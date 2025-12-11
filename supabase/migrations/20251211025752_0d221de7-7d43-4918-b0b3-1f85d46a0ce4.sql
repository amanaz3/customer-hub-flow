-- Insert 3 playbooks for Business Bank Account service
INSERT INTO sales_playbooks (name, description, call_type, product_id, target_segments, is_active)
VALUES 
  ('New Business Bank Account - Inbound Support', 'Handle inbound inquiries about business bank account opening services', 'inbound', '0d0004ce-8b5d-46d1-8dbf-9f9ef9692aa3', ARRAY['new_leads', 'website_inquiries'], true),
  ('New Business Bank Account - Customer Support', 'Post-purchase support for business bank account clients with ongoing issues or questions', 'inbound', '0d0004ce-8b5d-46d1-8dbf-9f9ef9692aa3', ARRAY['existing_customers', 'post_purchase'], true),
  ('New Business Bank Account - Follow-up', 'Follow-up calls after initial outbound sales contact for bank account services', 'outbound', '0d0004ce-8b5d-46d1-8dbf-9f9ef9692aa3', ARRAY['warm_leads', 'previous_contact'], true);
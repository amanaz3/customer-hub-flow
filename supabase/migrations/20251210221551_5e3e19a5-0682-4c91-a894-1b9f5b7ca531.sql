-- Add pricing strategies for Company Formation - System Generated (Outbound)
INSERT INTO pricing_strategies (
  playbook_id, customer_segment, discount_range_min, discount_range_max, 
  negotiation_floor, pricing_script, bundle_suggestions, urgency_level
) VALUES
('cf123456-7890-abcd-ef12-345678901234', 'new_business', 0, 10, 5, 
 'Our standard company formation package starts at AED 15,000. For new businesses, we offer a 5-10% early bird discount when you proceed within this week.', 
 ARRAY['PRO License + Visa Package', 'Annual Compliance Bundle'], 'medium'),
('cf123456-7890-abcd-ef12-345678901234', 'existing_client', 5, 15, 10, 
 'As a valued existing client, you qualify for our loyalty discount of 10-15% on additional company formations.', 
 ARRAY['Multi-Company Package', 'Group Formation Discount'], 'low'),
('cf123456-7890-abcd-ef12-345678901234', 'enterprise', 10, 20, 15, 
 'For enterprise clients forming multiple entities, we offer volume pricing with discounts of 15-20% and dedicated account management.', 
 ARRAY['Enterprise Formation Package', 'Annual Retainer'], 'low'),
('cf123456-7890-abcd-ef12-345678901234', 'price_sensitive', 0, 5, 0, 
 'I understand budget is a concern. Let me show you our most cost-effective formation options that still meet your business needs.', 
 ARRAY['Basic Formation Package', 'Payment Plan Option'], 'high');

-- Add pricing strategies for Company Formation - Inbound Support
INSERT INTO pricing_strategies (
  playbook_id, customer_segment, discount_range_min, discount_range_max, 
  negotiation_floor, pricing_script, bundle_suggestions, urgency_level
) VALUES
('cf1b0001-0000-0000-0000-000000000001', 'new_business', 0, 10, 5, 
 'Thank you for your interest! Our company formation services start at AED 15,000. I can offer a 5% discount if you decide to proceed today.', 
 ARRAY['Visa Package Add-on', 'Bank Account Opening'], 'medium'),
('cf1b0001-0000-0000-0000-000000000001', 'existing_client', 5, 15, 10, 
 'Great to hear from you again! As an existing client, you automatically qualify for our 10% loyalty discount.', 
 ARRAY['Additional Company Formation', 'Renewal Bundle'], 'low'),
('cf1b0001-0000-0000-0000-000000000001', 'referral', 5, 10, 5, 
 'Since you were referred by one of our clients, you qualify for our referral discount of 5-10%.', 
 ARRAY['Referral Reward Package', 'First-Year Compliance'], 'medium'),
('cf1b0001-0000-0000-0000-000000000001', 'price_sensitive', 0, 5, 0, 
 'I hear you on the budget. Let me walk you through our flexible payment options and most affordable packages.', 
 ARRAY['Starter Package', '3-Month Payment Plan'], 'high');

-- Add emotional responses for Company Formation - Inbound Support (using allowed values)
INSERT INTO emotional_responses (
  playbook_id, emotion_detected, response_strategy, tone_adjustment, 
  suggested_phrases, avoid_actions
) VALUES
('cf1b0001-0000-0000-0000-000000000001', 'frustrated', 
 'Acknowledge frustration immediately, apologize for any inconvenience, and focus on resolution', 
 'Calm, empathetic, and solution-focused',
 ARRAY['I completely understand your frustration', 'Let me help resolve this right away', 'I apologize for any inconvenience this has caused'],
 ARRAY['Rushing the customer', 'Being defensive', 'Dismissing their concerns']),
('cf1b0001-0000-0000-0000-000000000001', 'confused', 
 'Simplify explanations, use clear examples, and confirm understanding at each step', 
 'Patient, clear, and reassuring',
 ARRAY['Let me explain that more clearly', 'Here is a simple way to think about it', 'Does that make sense so far?'],
 ARRAY['Using jargon', 'Moving too fast', 'Assuming prior knowledge']),
('cf1b0001-0000-0000-0000-000000000001', 'skeptical', 
 'Provide evidence and social proof, address concerns directly, and build credibility', 
 'Professional, transparent, and confident',
 ARRAY['I understand your hesitation', 'Let me show you some examples', 'Here is what other clients have experienced'],
 ARRAY['Being pushy', 'Dismissing concerns', 'Overpromising']),
('cf1b0001-0000-0000-0000-000000000001', 'interested', 
 'Build on their enthusiasm, provide detailed information, and guide toward next steps', 
 'Enthusiastic and informative',
 ARRAY['Great question!', 'Let me tell you more about that', 'I can see this would be perfect for you'],
 ARRAY['Overwhelming with details', 'Missing buying signals', 'Slow response']);
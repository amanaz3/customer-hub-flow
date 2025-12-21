-- Add remaining Web child cards
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('customer_web_webflow', 'Webflow', true, 0, 'customer_web'),
  ('customer_web_ai_assistant', 'AI Assistant', true, 2, 'customer_web'),
  ('customer_web_ai_assistant_config', 'AI Assistant Config', true, 3, 'customer_web');
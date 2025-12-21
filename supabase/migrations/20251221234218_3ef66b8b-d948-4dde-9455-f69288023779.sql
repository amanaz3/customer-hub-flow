-- Insert Webflow Simple as a child card under customer_web
INSERT INTO public.sandbox_card_settings (card_key, card_name, is_visible, card_order, parent_key) VALUES
  ('customer_web_webflow_simple', 'Webflow Simple', true, 1, 'customer_web');
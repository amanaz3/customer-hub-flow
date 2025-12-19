-- Insert AI Assistant feature flag
INSERT INTO public.feature_flags (feature_key, feature_name, feature_description, is_enabled)
VALUES (
  'ai_assistant',
  'AI Assistant',
  'Enable AI Assistant chatbot on the website. When disabled, the AI Assistant will not be available to users.',
  true
)
ON CONFLICT (feature_key) DO NOTHING;
-- Fix function search path security by recreating with proper settings
CREATE OR REPLACE FUNCTION public.update_webflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
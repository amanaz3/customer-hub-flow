-- Fix Function Search Path Mutable security warnings by adding SET search_path = public
-- This prevents SQL injection attacks through search_path manipulation

-- Update all database functions to set search_path explicitly
ALTER FUNCTION public.get_user_products(uuid) SET search_path = public;
ALTER FUNCTION public.update_products_updated_at() SET search_path = public;
ALTER FUNCTION public.get_products() SET search_path = public;
ALTER FUNCTION public.create_product(text, text, boolean) SET search_path = public;
ALTER FUNCTION public.update_product(uuid, text, text, boolean) SET search_path = public;
ALTER FUNCTION public.delete_product(uuid) SET search_path = public;
ALTER FUNCTION public.get_secure_document_url(text, integer) SET search_path = public;
ALTER FUNCTION public.has_role(uuid, app_role) SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
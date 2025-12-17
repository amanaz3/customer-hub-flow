-- Seed default pricing plans
INSERT INTO webflow_pricing (plan_code, plan_name, description, base_price, features, included_services, is_popular, is_active, sort_order)
VALUES 
  ('starter', 'Starter', 'Company formation essentials', 5500, 
   '["Trade License", "Immigration Card", "Establishment Card", "1 Visa Quota", "Basic Support"]'::jsonb,
   '[]'::jsonb, false, true, 1),
  ('business', 'Business', 'Formation + Banking assistance', 8500,
   '["Everything in Starter", "3 Visa Quota", "Bank Account Assistance", "PRO Services", "Priority Support"]'::jsonb,
   '["banking"]'::jsonb, true, true, 2),
  ('complete', 'Complete', 'Full service package', 14500,
   '["Everything in Business", "5 Visa Quota", "Bookkeeping (Monthly)", "VAT Registration & Filing", "Dedicated Account Manager"]'::jsonb,
   '["banking", "bookkeeping", "vat"]'::jsonb, false, true, 3);
-- Reset application_reference_seq to current max + 1
DO $$
DECLARE
  max_ref INTEGER;
BEGIN
  SELECT COALESCE(MAX(reference_number), 0) INTO max_ref FROM account_applications;
  PERFORM setval('application_reference_seq', max_ref, true);
END $$;
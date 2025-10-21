-- Cleanup orphaned customers (user_id IS NULL)
-- These are 24 rejected test/duplicate entries

-- Step 1: Delete related documents
DELETE FROM public.documents 
WHERE customer_id IN (
  SELECT id FROM public.customers WHERE user_id IS NULL
);

-- Step 2: Delete related status changes
DELETE FROM public.status_changes 
WHERE customer_id IN (
  SELECT id FROM public.customers WHERE user_id IS NULL
);

-- Step 3: Delete related comments
DELETE FROM public.comments 
WHERE customer_id IN (
  SELECT id FROM public.customers WHERE user_id IS NULL
);

-- Step 4: Delete related account applications and their sub-records
DELETE FROM public.application_documents
WHERE application_id IN (
  SELECT aa.id FROM public.account_applications aa
  WHERE aa.customer_id IN (
    SELECT id FROM public.customers WHERE user_id IS NULL
  )
);

DELETE FROM public.application_owners
WHERE application_id IN (
  SELECT aa.id FROM public.account_applications aa
  WHERE aa.customer_id IN (
    SELECT id FROM public.customers WHERE user_id IS NULL
  )
);

DELETE FROM public.application_messages
WHERE application_id IN (
  SELECT aa.id FROM public.account_applications aa
  WHERE aa.customer_id IN (
    SELECT id FROM public.customers WHERE user_id IS NULL
  )
);

DELETE FROM public.account_applications 
WHERE customer_id IN (
  SELECT id FROM public.customers WHERE user_id IS NULL
);

-- Step 5: Delete related notifications
DELETE FROM public.notifications 
WHERE customer_id IN (
  SELECT id FROM public.customers WHERE user_id IS NULL
);

-- Step 6: Delete the orphaned customers
DELETE FROM public.customers 
WHERE user_id IS NULL;

-- Step 7: Log the cleanup action
INSERT INTO public.logs (message, level, component)
VALUES (
  'Cleaned up orphaned customers (user_id IS NULL) and all related data', 
  'info', 
  'data_cleanup'
);
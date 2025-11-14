-- Set customer reference sequence to start after current maximum (89)
SELECT setval('customer_reference_seq', 89, true);
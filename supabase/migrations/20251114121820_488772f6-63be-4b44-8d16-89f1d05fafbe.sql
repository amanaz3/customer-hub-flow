-- Remove artificial max_value limits on reference sequences
-- Customer references can now grow beyond 999
ALTER SEQUENCE customer_reference_seq MAXVALUE 2147483647;

-- Application references can now grow beyond 9999
ALTER SEQUENCE application_reference_seq MAXVALUE 2147483647;

-- Both sequences will now auto-scale with the formatting function
-- CUST-yyyy-00001, CUST-yyyy-00002, ... CUST-yyyy-99999, CUST-yyyy-100000, etc.
-- APP-yyyy-01001, APP-yyyy-01002, ... APP-yyyy-99999, APP-yyyy-100000, etc.
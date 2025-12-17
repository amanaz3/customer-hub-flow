-- Fix price_modifier column to allow larger values
ALTER TABLE webflow_activities 
ALTER COLUMN price_modifier TYPE numeric(12,2);
-- Drop CRM tables and functions

-- Drop triggers first
DROP TRIGGER IF EXISTS update_crm_configurations_updated_at ON crm_configurations;
DROP TRIGGER IF EXISTS update_crm_sync_logs_updated_at ON crm_sync_logs;
DROP TRIGGER IF EXISTS update_crm_webhooks_updated_at ON crm_webhooks;
DROP TRIGGER IF EXISTS update_crm_api_keys_updated_at ON crm_api_keys;

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS crm_sync_logs CASCADE;
DROP TABLE IF EXISTS crm_webhooks CASCADE;
DROP TABLE IF EXISTS crm_api_keys CASCADE;
DROP TABLE IF EXISTS crm_configurations CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_crm_updated_at_column() CASCADE;
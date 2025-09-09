export interface CRMConfiguration {
  id: string;
  name: string;
  crm_type: string;
  api_endpoint: string;
  api_key_hash: string;
  webhook_secret?: string;
  field_mappings: any;
  sync_settings: any;
  is_active: boolean;
  last_sync_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CRMSyncLog {
  id: string;
  crm_config_id: string;
  sync_type: string;
  entity_type: string;
  status: string;
  records_processed: number;
  records_success: number;
  records_failed: number;
  error_message?: string;
  sync_data?: any;
  started_at: string;
  completed_at?: string;
  crm_configurations?: {
    name: string;
    crm_type: string;
  };
}

export interface CRMWebhook {
  id: string;
  webhook_url: string;
  events: string[];
  api_key_hash: string;
  secret_token: string;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMApiKey {
  id: string;
  key_name: string;
  key_hash: string;
  permissions: string[];
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
  key?: string; // Only available when creating a new key
}

export interface PartnerData {
  id: string;
  company_name: string;
  contact_phone: string;
  full_name: string;
  email: string;
  is_active: boolean;
  total_referrals: number;
  successful_referrals: number;
  conversion_rate: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationData {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  company_name: string;
  status: string;
  license_type: string;
  annual_turnover: number;
  jurisdiction: string;
  banking_preference: string;
  partner_id: string | null;
  partner_company: string | null;
  partner_contact: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface CRMConnectRequest {
  name: string;
  crm_type: string;
  api_endpoint: string;
  api_key: string;
  webhook_secret?: string;
  field_mappings?: any;
  sync_settings?: any;
}

export interface CRMSyncRequest {
  crm_config_id: string;
  sync_type?: string;
  entity_type: string;
}

export interface WebhookPayload {
  event: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  data: any;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
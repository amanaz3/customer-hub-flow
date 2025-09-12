import { supabase } from '@/lib/supabase';
import type {
  CRMConfiguration,
  CRMSyncLog,
  CRMApiKey,
  CRMConnectRequest,
  CRMSyncRequest,
  PaginationResponse
} from '@/types/crm';

class CRMService {
  private baseUrl = 'https://gddibkhyhcnejxthsyzu.supabase.co/functions/v1';

  // Frontend API methods (for admin interface)
  async connectCRM(config: CRMConnectRequest): Promise<{ data: CRMConfiguration; message: string }> {
    const { data, error } = await supabase.functions.invoke('crm-frontend-api/connect', {
      body: config
    });

    if (error) {
      throw new Error(error.message || 'Failed to connect CRM');
    }

    return data;
  }

  async getCRMStatus(): Promise<{ data: CRMConfiguration[] }> {
    const { data, error } = await supabase.functions.invoke('crm-frontend-api/status');

    if (error) {
      throw new Error(error.message || 'Failed to fetch CRM status');
    }

    return data;
  }

  async triggerSync(request: CRMSyncRequest): Promise<{ data: CRMSyncLog; message: string }> {
    const { data, error } = await supabase.functions.invoke('crm-frontend-api/sync', {
      body: request
    });

    if (error) {
      throw new Error(error.message || 'Failed to trigger sync');
    }

    return data;
  }

  async getSyncHistory(page = 1, limit = 20): Promise<PaginationResponse<CRMSyncLog>> {
    const { data, error } = await supabase.functions.invoke('crm-frontend-api/sync-history', {
      body: { page, limit }
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch sync history');
    }

    return data;
  }

  async getApiKeys(): Promise<{ data: CRMApiKey[] }> {
    const { data, error } = await supabase.functions.invoke('crm-frontend-api/api-keys');

    if (error) {
      throw new Error(error.message || 'Failed to fetch API keys');
    }

    return data;
  }

  async createApiKey(keyName: string, permissions: string[] = [], expiresAt?: string): Promise<{ data: CRMApiKey; message: string }> {
    const { data, error } = await supabase.functions.invoke('crm-frontend-api/api-keys', {
      body: {
        key_name: keyName,
        permissions,
        expires_at: expiresAt
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to create API key');
    }

    return data;
  }

  // Webhook trigger methods
  async triggerWebhook(event: string, entityType: string, entityId: string, data?: any): Promise<void> {
    try {
      await supabase.functions.invoke('crm-webhook-handler/trigger', {
        body: {
          event,
          entity_type: entityType,
          entity_id: entityId,
          data
        }
      });
    } catch (error) {
      console.error('Failed to trigger webhook:', error);
      // Don't throw error for webhook failures to avoid disrupting main operations
    }
  }

  // Convenience methods for common webhook events
  async notifyApplicationCreated(applicationId: string, applicationData: any): Promise<void> {
    await this.triggerWebhook('application.created', 'customers', applicationId, applicationData);
  }

  async notifyApplicationUpdated(applicationId: string, applicationData: any): Promise<void> {
    await this.triggerWebhook('application.updated', 'customers', applicationId, applicationData);
  }

  async notifyApplicationStatusChanged(applicationId: string, oldStatus: string, newStatus: string, applicationData: any): Promise<void> {
    await this.triggerWebhook('application.status_changed', 'customers', applicationId, {
      ...applicationData,
      old_status: oldStatus,
      new_status: newStatus
    });
  }

  async notifyPartnerCreated(partnerId: string, partnerData: any): Promise<void> {
    await this.triggerWebhook('partner.created', 'profiles', partnerId, partnerData);
  }

  async notifyPartnerUpdated(partnerId: string, partnerData: any): Promise<void> {
    await this.triggerWebhook('partner.updated', 'profiles', partnerId, partnerData);
  }

  // Direct database queries for local data access
  async getCRMConfigurations(): Promise<CRMConfiguration[]> {
    const { data, error } = await supabase
      .from('crm_configurations')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async getCRMSyncLogs(limit = 50): Promise<CRMSyncLog[]> {
    const { data, error } = await supabase
      .from('crm_sync_logs')
      .select(`
        *,
        crm_configurations (
          name,
          crm_type
        )
      `)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  async updateCRMConfiguration(id: string, updates: Partial<CRMConfiguration>): Promise<CRMConfiguration> {
    const { data, error } = await supabase
      .from('crm_configurations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async deleteCRMConfiguration(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_configurations')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deactivateApiKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_api_keys')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const crmService = new CRMService();
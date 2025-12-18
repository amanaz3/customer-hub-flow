import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RuleCondition {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
}

interface RuleAction {
  type: string;
  value?: number | string;
  message?: string;
}

export interface BankReadinessRule {
  id: string;
  rule_name: string;
  rule_type: string;
  description: string | null;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
}

export interface BankProfile {
  id: string;
  bank_code: string;
  bank_name: string;
  preferred_jurisdictions: string[];
  preferred_business_models: string[];
  preferred_activities: string[];
  avoid_activities: string[];
  accepts_non_residents: boolean;
  accepts_high_risk_nationalities: boolean;
  risk_tolerance: string;
  min_monthly_turnover: string;
  processing_time_days: number;
  is_active: boolean;
}

export interface BankReadinessConfigData {
  rules: BankReadinessRule[];
  bankProfiles: BankProfile[];
}

interface BankReadinessConfiguration {
  id: string;
  name: string;
  description: string | null;
  config_data: BankReadinessConfigData;
  is_active: boolean;
  version_number: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CONFIG: BankReadinessConfigData = {
  rules: [],
  bankProfiles: []
};

export function useBankReadinessConfig() {
  const [config, setConfig] = useState<BankReadinessConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('bank_readiness_configurations')
        .select('*')
        .eq('is_active', true)
        .eq('name', 'default')
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No config found, create default
          const { data: newConfig, error: createError } = await supabase
            .from('bank_readiness_configurations')
            .insert([{
              name: 'default',
              description: 'Bank Readiness Rules Configuration',
              config_data: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
              is_active: true,
              version_number: 1
            }])
            .select()
            .single();

          if (createError) throw createError;
          
          setConfig({
            ...newConfig,
            config_data: newConfig.config_data as unknown as BankReadinessConfigData
          });
        } else {
          throw fetchError;
        }
      } else {
        setConfig({
          ...data,
          config_data: (data.config_data as unknown as BankReadinessConfigData) || DEFAULT_CONFIG
        });
      }
    } catch (err: any) {
      console.error('[BankReadinessConfig] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const saveVersion = async (configId: string, configData: BankReadinessConfigData, versionNumber: number) => {
    try {
      await supabase
        .from('bank_readiness_configuration_versions')
        .insert({
          configuration_id: configId,
          version_number: versionNumber,
          config_data: JSON.parse(JSON.stringify(configData)),
          change_notes: 'Configuration updated'
        });
    } catch (err) {
      console.error('[BankReadinessConfig] Failed to save version:', err);
    }
  };

  const updateRules = async (rules: BankReadinessRule[]): Promise<boolean> => {
    if (!config) return false;

    try {
      const newConfigData: BankReadinessConfigData = {
        ...config.config_data,
        rules
      };
      const newVersionNumber = config.version_number + 1;

      // Save version history first
      await saveVersion(config.id, config.config_data, config.version_number);

      // Update main config
      const { data, error: updateError } = await supabase
        .from('bank_readiness_configurations')
        .update({
          config_data: JSON.parse(JSON.stringify(newConfigData)),
          version_number: newVersionNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setConfig({
        ...data,
        config_data: newConfigData
      } as unknown as BankReadinessConfiguration);

      toast.success('Rules saved successfully');
      return true;
    } catch (err: any) {
      console.error('[BankReadinessConfig] Update failed:', err);
      toast.error('Failed to save rules');
      return false;
    }
  };

  const updateBankProfiles = async (bankProfiles: BankProfile[]): Promise<boolean> => {
    if (!config) return false;

    try {
      const newConfigData: BankReadinessConfigData = {
        ...config.config_data,
        bankProfiles
      };
      const newVersionNumber = config.version_number + 1;

      await saveVersion(config.id, config.config_data, config.version_number);

      const { data, error: updateError } = await supabase
        .from('bank_readiness_configurations')
        .update({
          config_data: JSON.parse(JSON.stringify(newConfigData)),
          version_number: newVersionNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setConfig({
        ...data,
        config_data: newConfigData
      } as unknown as BankReadinessConfiguration);

      toast.success('Bank profiles saved successfully');
      return true;
    } catch (err: any) {
      console.error('[BankReadinessConfig] Update failed:', err);
      toast.error('Failed to save bank profiles');
      return false;
    }
  };

  const updateFullConfig = async (newConfigData: BankReadinessConfigData): Promise<boolean> => {
    if (!config) return false;

    try {
      const newVersionNumber = config.version_number + 1;

      await saveVersion(config.id, config.config_data, config.version_number);

      const { data, error: updateError } = await supabase
        .from('bank_readiness_configurations')
        .update({
          config_data: JSON.parse(JSON.stringify(newConfigData)),
          version_number: newVersionNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', config.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setConfig({
        ...data,
        config_data: newConfigData
      } as unknown as BankReadinessConfiguration);

      toast.success('Configuration saved successfully');
      return true;
    } catch (err: any) {
      console.error('[BankReadinessConfig] Update failed:', err);
      toast.error('Failed to save configuration');
      return false;
    }
  };

  return {
    config,
    loading,
    error,
    rules: config?.config_data.rules || [],
    bankProfiles: config?.config_data.bankProfiles || [],
    versionNumber: config?.version_number || 1,
    updateRules,
    updateBankProfiles,
    updateFullConfig,
    refetch: fetchConfig
  };
}

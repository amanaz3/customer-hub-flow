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

const ADDITIONAL_RULES: BankReadinessRule[] = [
  // Bank-specific eligibility rules
  {
    id: 'bank-enbd-crypto',
    rule_name: 'ENBD - No Crypto Activities',
    rule_type: 'bank_eligibility',
    description: 'Emirates NBD does not accept crypto-related businesses',
    conditions: [{ field: 'license_activity', operator: 'contains_any', value: ['crypto', 'bitcoin', 'blockchain', 'nft'] }],
    actions: [{ type: 'exclude_bank', value: 'ENBD', message: 'ENBD does not accept crypto businesses' }],
    priority: 200,
    is_active: true
  },
  {
    id: 'bank-fab-freezone',
    rule_name: 'FAB - Mainland Preference',
    rule_type: 'bank_eligibility',
    description: 'FAB has limited freezone appetite',
    conditions: [{ field: 'company_jurisdiction', operator: 'equals', value: 'freezone' }],
    actions: [{ type: 'reduce_bank_score', value: 'FAB', message: 'FAB prefers mainland companies' }],
    priority: 201,
    is_active: true
  },
  {
    id: 'bank-dib-halal',
    rule_name: 'DIB - Islamic Banking Restrictions',
    rule_type: 'bank_eligibility',
    description: 'DIB cannot accept interest-based or non-halal activities',
    conditions: [{ field: 'license_activity', operator: 'contains_any', value: ['alcohol', 'pork', 'gambling', 'interest', 'conventional finance'] }],
    actions: [{ type: 'exclude_bank', value: 'DIB', message: 'DIB (Islamic bank) cannot accept this activity' }],
    priority: 202,
    is_active: true
  },
  {
    id: 'bank-rakbank-sme',
    rule_name: 'RAKBANK - SME Friendly',
    rule_type: 'bank_eligibility',
    description: 'RAKBANK welcomes SME and startups',
    conditions: [{ field: 'expected_monthly_inflow', operator: 'in', value: ['Below AED 50,000', 'AED 50,000 - 100,000'] }],
    actions: [{ type: 'boost_bank_score', value: 'RAKBANK', message: 'RAKBANK is SME-friendly' }],
    priority: 203,
    is_active: true
  },
  // Turnover-based rules
  {
    id: 'turnover-very-low',
    rule_name: 'Very Low Turnover',
    rule_type: 'risk_scoring',
    description: 'Very low turnover limits Tier 1 bank options',
    conditions: [{ field: 'expected_monthly_inflow', operator: 'equals', value: 'Below AED 50,000' }],
    actions: [{ type: 'add_score', value: 8 }, { type: 'add_flag', message: 'Very low turnover - Consider Tier 2/3 banks' }],
    priority: 80,
    is_active: true
  },
  {
    id: 'turnover-high-tier1',
    rule_name: 'High Turnover - Tier 1 Eligible',
    rule_type: 'risk_scoring',
    description: 'High turnover qualifies for premium banks',
    conditions: [{ field: 'expected_monthly_inflow', operator: 'in', value: ['AED 1,000,000 - 5,000,000', 'Above AED 5,000,000'] }],
    actions: [{ type: 'add_score', value: -5 }, { type: 'add_flag', message: 'High turnover - Tier 1 banks recommended' }],
    priority: 81,
    is_active: true
  },
  // Document requirement rules
  {
    id: 'doc-trading-business',
    rule_name: 'Trading Business Documents',
    rule_type: 'document_requirement',
    description: 'Trading businesses need additional documentation',
    conditions: [{ field: 'business_model', operator: 'equals', value: 'trading' }],
    actions: [{ type: 'require_document', value: 'supplier_contracts' }, { type: 'require_document', value: 'sample_invoices' }, { type: 'add_flag', message: 'Trading docs: supplier contracts + sample invoices required' }],
    priority: 300,
    is_active: true
  },
  {
    id: 'doc-non-resident',
    rule_name: 'Non-Resident Documents',
    rule_type: 'document_requirement',
    description: 'Non-residents need additional residence proof',
    conditions: [{ field: 'uae_residency', operator: 'equals', value: false }],
    actions: [{ type: 'require_document', value: 'home_country_address_proof' }, { type: 'require_document', value: 'bank_reference_letter' }, { type: 'add_flag', message: 'Non-resident: home country address proof + bank reference required' }],
    priority: 301,
    is_active: true
  },
  {
    id: 'doc-high-turnover',
    rule_name: 'High Turnover Documents',
    rule_type: 'document_requirement',
    description: 'High turnover requires financial statements',
    conditions: [{ field: 'expected_monthly_inflow', operator: 'in', value: ['AED 1,000,000 - 5,000,000', 'Above AED 5,000,000'] }],
    actions: [{ type: 'require_document', value: 'audited_financials' }, { type: 'require_document', value: 'business_plan' }, { type: 'add_flag', message: 'High turnover: audited financials + business plan recommended' }],
    priority: 302,
    is_active: true
  },
  // Industry-specific rules
  {
    id: 'industry-real-estate',
    rule_name: 'Real Estate Industry',
    rule_type: 'risk_scoring',
    description: 'Real estate has additional AML scrutiny',
    conditions: [{ field: 'license_activity', operator: 'contains_any', value: ['real estate', 'property', 'brokerage'] }],
    actions: [{ type: 'add_score', value: 8 }, { type: 'add_flag', message: 'Real estate: Enhanced AML checks apply' }],
    priority: 62,
    is_active: true
  },
  {
    id: 'industry-consulting',
    rule_name: 'Consulting/Professional Services',
    rule_type: 'risk_scoring',
    description: 'Consulting services are low-risk',
    conditions: [{ field: 'license_activity', operator: 'contains_any', value: ['consulting', 'advisory', 'professional services', 'management consultancy'] }],
    actions: [{ type: 'add_score', value: -3 }, { type: 'add_flag', message: 'Professional services - Low risk profile' }],
    priority: 63,
    is_active: true
  },
  {
    id: 'industry-tech',
    rule_name: 'Technology/IT Services',
    rule_type: 'risk_scoring',
    description: 'Tech businesses are generally well-received',
    conditions: [{ field: 'license_activity', operator: 'contains_any', value: ['technology', 'software', 'IT', 'saas', 'digital'] }],
    actions: [{ type: 'add_score', value: -2 }, { type: 'add_flag', message: 'Technology sector - Banks have good appetite' }],
    priority: 64,
    is_active: true
  },
  {
    id: 'industry-food',
    rule_name: 'Food & Beverage',
    rule_type: 'risk_scoring',
    description: 'F&B businesses need health permits',
    conditions: [{ field: 'license_activity', operator: 'contains_any', value: ['restaurant', 'cafe', 'food', 'catering', 'beverage'] }],
    actions: [{ type: 'add_score', value: 2 }, { type: 'require_document', value: 'health_permit' }, { type: 'add_flag', message: 'F&B: Health permit documentation required' }],
    priority: 65,
    is_active: true
  }
];

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

  const addMissingRules = async (): Promise<{ added: number }> => {
    if (!config) return { added: 0 };

    const existingIds = new Set(config.config_data.rules.map(r => r.id));
    const newRules = ADDITIONAL_RULES.filter(r => !existingIds.has(r.id));
    
    if (newRules.length === 0) {
      toast.info('All additional rules already exist');
      return { added: 0 };
    }

    const updatedRules = [...config.config_data.rules, ...newRules].sort((a, b) => a.priority - b.priority);
    const success = await updateRules(updatedRules);
    
    if (success) {
      toast.success(`Added ${newRules.length} new rules`);
      return { added: newRules.length };
    }
    return { added: 0 };
  };

  const getMissingRulesCount = (): number => {
    if (!config) return ADDITIONAL_RULES.length;
    const existingIds = new Set(config.config_data.rules.map(r => r.id));
    return ADDITIONAL_RULES.filter(r => !existingIds.has(r.id)).length;
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
    refetch: fetchConfig,
    addMissingRules,
    getMissingRulesCount
  };
}

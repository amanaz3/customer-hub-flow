import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Types for JSON config structure
export interface WebflowCountryConfig {
  id: string;
  country_code: string;
  country_name: string;
  is_blocked: boolean;
  block_reason: string | null;
  risk_level: string;
  requires_enhanced_due_diligence: boolean;
  is_active: boolean;
}

export interface WebflowJurisdictionConfig {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  jurisdiction_type: 'mainland' | 'freezone' | 'offshore';
  emirate: string;
  legal_forms: string[];
  base_price: number;
  processing_days: number;
  is_active: boolean;
  notes: string | null;
}

export interface WebflowActivityConfig {
  id: string;
  activity_code: string;
  activity_name: string;
  category: string;
  risk_level: string;
  is_restricted: boolean;
  restriction_reason: string | null;
  requires_approval: boolean;
  allowed_jurisdictions: string[];
  price_modifier: number;
  enhanced_due_diligence: boolean;
  edd_requirements: string[];
  is_active: boolean;
}

export interface WebflowDocumentConfig {
  id: string;
  document_code: string;
  document_name: string;
  description: string | null;
  is_mandatory: boolean;
  applies_to_nationalities: string[];
  applies_to_jurisdictions: string[];
  applies_to_activities: string[];
  accepted_formats: string[];
  max_file_size_mb: number;
  is_active: boolean;
  sort_order: number;
}

export interface WebflowPricingConfig {
  id: string;
  plan_code: string;
  plan_name: string;
  description: string | null;
  base_price: number;
  features: string[];
  included_services: string[];
  jurisdiction_pricing: Record<string, number>;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface WebflowRuleConfig {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any[];
  actions: any[];
  priority: number;
  is_active: boolean;
  description: string | null;
}

export interface WebflowConfigData {
  countries: WebflowCountryConfig[];
  jurisdictions: WebflowJurisdictionConfig[];
  activities: WebflowActivityConfig[];
  documents: WebflowDocumentConfig[];
  pricing: WebflowPricingConfig[];
  rules: WebflowRuleConfig[];
}

export interface WebflowConfiguration {
  id: string;
  name: string;
  description: string | null;
  config_data: WebflowConfigData;
  is_active: boolean;
  version_number: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebflowConfigVersion {
  id: string;
  configuration_id: string;
  version_number: number;
  config_data: WebflowConfigData;
  change_notes: string | null;
  changed_by: string | null;
  created_at: string;
}

const DEFAULT_CONFIG: WebflowConfigData = {
  countries: [],
  jurisdictions: [],
  activities: [],
  documents: [],
  pricing: [],
  rules: []
};

export const useWebflowConfig = () => {
  const [config, setConfig] = useState<WebflowConfiguration | null>(null);
  const [versions, setVersions] = useState<WebflowConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active configuration
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('webflow_configurations')
        .select('*')
        .eq('is_active', true)
        .eq('name', 'default')
        .single();

      if (fetchError) {
        // If no config exists, create default
        if (fetchError.code === 'PGRST116') {
          const { data: newConfig, error: createError } = await supabase
            .from('webflow_configurations')
            .insert([{
              name: 'default',
              description: 'Default webflow configuration',
              config_data: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
              is_active: true,
              version_number: 1
            }])
            .select()
            .single();

          if (createError) throw createError;
          setConfig(newConfig as unknown as WebflowConfiguration);
        } else {
          throw fetchError;
        }
      } else {
        // Parse config_data properly
        const configData = typeof data.config_data === 'string' 
          ? JSON.parse(data.config_data) 
          : data.config_data;
        
        setConfig({
          ...data,
          config_data: {
            countries: configData?.countries || [],
            jurisdictions: configData?.jurisdictions || [],
            activities: configData?.activities || [],
            documents: configData?.documents || [],
            pricing: configData?.pricing || [],
            rules: configData?.rules || []
          }
        } as WebflowConfiguration);
      }
    } catch (err: any) {
      console.error('Error fetching webflow config:', err);
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch version history
  const fetchVersions = useCallback(async (configId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('webflow_configuration_versions')
        .select('*')
        .eq('configuration_id', configId)
        .order('version_number', { ascending: false });

      if (fetchError) throw fetchError;
      setVersions((data || []) as unknown as WebflowConfigVersion[]);
    } catch (err: any) {
      console.error('Error fetching versions:', err);
    }
  }, []);

  // Save configuration with version history
  const saveConfig = useCallback(async (
    newConfigData: WebflowConfigData,
    changeNotes?: string
  ) => {
    if (!config) return false;

    setSaving(true);
    try {
      const newVersionNumber = config.version_number + 1;

      // Save version history first
      const { error: versionError } = await supabase
        .from('webflow_configuration_versions')
        .insert([{
          configuration_id: config.id,
          version_number: config.version_number,
          config_data: JSON.parse(JSON.stringify(config.config_data)),
          change_notes: changeNotes || 'Configuration updated'
        }]);

      if (versionError) throw versionError;

      // Update main config
      const { data, error: updateError } = await supabase
        .from('webflow_configurations')
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
      } as unknown as WebflowConfiguration);

      toast({ title: 'Success', description: 'Configuration saved' });
      fetchVersions(config.id);
      return true;
    } catch (err: any) {
      console.error('Error saving config:', err);
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [config, fetchVersions]);

  // Restore from version
  const restoreVersion = useCallback(async (version: WebflowConfigVersion) => {
    if (!config) return false;

    const success = await saveConfig(version.config_data, `Restored from version ${version.version_number}`);
    if (success) {
      toast({ title: 'Success', description: `Restored to version ${version.version_number}` });
    }
    return success;
  }, [config, saveConfig]);

  // Export config as JSON file
  const exportConfig = useCallback(() => {
    if (!config) return;

    const exportData = {
      version: config.version_number,
      exportedAt: new Date().toISOString(),
      name: config.name,
      ...config.config_data
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webflow-config-v${config.version_number}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'Configuration exported' });
  }, [config]);

  // Import config from JSON file
  const importConfig = useCallback(async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate structure
      const newConfigData: WebflowConfigData = {
        countries: importedData.countries || [],
        jurisdictions: importedData.jurisdictions || [],
        activities: importedData.activities || [],
        documents: importedData.documents || [],
        pricing: importedData.pricing || [],
        rules: importedData.rules || []
      };

      const success = await saveConfig(newConfigData, `Imported from file: ${file.name}`);
      if (success) {
        toast({ title: 'Success', description: 'Configuration imported' });
      }
      return success;
    } catch (err: any) {
      console.error('Error importing config:', err);
      toast({ title: 'Error', description: 'Invalid configuration file', variant: 'destructive' });
      return false;
    }
  }, [saveConfig]);

  // CRUD operations for each entity type
  const updateCountries = useCallback(async (countries: WebflowCountryConfig[]) => {
    if (!config) return false;
    return saveConfig({ ...config.config_data, countries });
  }, [config, saveConfig]);

  const updateJurisdictions = useCallback(async (jurisdictions: WebflowJurisdictionConfig[]) => {
    if (!config) return false;
    return saveConfig({ ...config.config_data, jurisdictions });
  }, [config, saveConfig]);

  const updateActivities = useCallback(async (activities: WebflowActivityConfig[]) => {
    if (!config) return false;
    return saveConfig({ ...config.config_data, activities });
  }, [config, saveConfig]);

  const updateDocuments = useCallback(async (documents: WebflowDocumentConfig[]) => {
    if (!config) return false;
    return saveConfig({ ...config.config_data, documents });
  }, [config, saveConfig]);

  const updatePricing = useCallback(async (pricing: WebflowPricingConfig[]) => {
    if (!config) return false;
    return saveConfig({ ...config.config_data, pricing });
  }, [config, saveConfig]);

  const updateRules = useCallback(async (rules: WebflowRuleConfig[]) => {
    if (!config) return false;
    return saveConfig({ ...config.config_data, rules });
  }, [config, saveConfig]);

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Fetch versions when config loads
  useEffect(() => {
    if (config?.id) {
      fetchVersions(config.id);
    }
  }, [config?.id, fetchVersions]);

  return {
    config,
    configData: config?.config_data || DEFAULT_CONFIG,
    versions,
    loading,
    saving,
    error,
    refetch: fetchConfig,
    saveConfig,
    restoreVersion,
    exportConfig,
    importConfig,
    // Entity-specific updates
    updateCountries,
    updateJurisdictions,
    updateActivities,
    updateDocuments,
    updatePricing,
    updateRules
  };
};

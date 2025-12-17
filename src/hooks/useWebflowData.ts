import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Re-export types from useWebflowConfig for backward compatibility
export type {
  WebflowCountryConfig as WebflowCountry,
  WebflowJurisdictionConfig as WebflowJurisdiction,
  WebflowActivityConfig as WebflowActivity,
  WebflowDocumentConfig as WebflowDocument,
  WebflowRuleConfig as WebflowRule
} from './useWebflowConfig';

import type {
  WebflowCountryConfig,
  WebflowJurisdictionConfig,
  WebflowActivityConfig,
  WebflowDocumentConfig,
  WebflowRuleConfig,
  WebflowConfigData
} from './useWebflowConfig';

interface WebflowData {
  countries: WebflowCountryConfig[];
  jurisdictions: WebflowJurisdictionConfig[];
  activities: WebflowActivityConfig[];
  documents: WebflowDocumentConfig[];
  rules: WebflowRuleConfig[];
  loading: boolean;
  error: string | null;
}

const DEFAULT_CONFIG: WebflowConfigData = {
  countries: [],
  jurisdictions: [],
  activities: [],
  documents: [],
  pricing: [],
  rules: []
};

// Helper to get unique emirates from jurisdictions
export const getUniqueEmirates = (jurisdictions: WebflowJurisdictionConfig[]): string[] => {
  const emirates = [...new Set(jurisdictions.map(j => j.emirate).filter(Boolean))];
  return emirates.sort();
};

// Helper to get unique jurisdiction types
export const getJurisdictionTypes = (jurisdictions: WebflowJurisdictionConfig[]): string[] => {
  const types = [...new Set(jurisdictions.map(j => j.jurisdiction_type))];
  return types;
};

// Helper to get legal forms for a jurisdiction type
export const getLegalFormsForType = (
  jurisdictions: WebflowJurisdictionConfig[], 
  locationType: string
): string[] => {
  const formsSet = new Set<string>();
  jurisdictions
    .filter(j => j.jurisdiction_type === locationType)
    .forEach(j => (j.legal_forms || []).forEach(f => formsSet.add(f)));
  return [...formsSet];
};

// Helper to filter activities by jurisdiction
export const filterActivitiesByJurisdiction = (
  activities: WebflowActivityConfig[],
  locationType: string | null
): WebflowActivityConfig[] => {
  if (!locationType) return activities;
  
  return activities.filter(a => {
    // If no allowed_jurisdictions defined, activity is available everywhere
    if (!a.allowed_jurisdictions || a.allowed_jurisdictions.length === 0) {
      return true;
    }
    // Check if current location type is in allowed list
    return a.allowed_jurisdictions.includes(locationType);
  });
};

// Helper to get required documents based on context
export const getRequiredDocuments = (
  documents: WebflowDocumentConfig[],
  context: {
    nationality?: string;
    locationType?: string;
    activityCode?: string;
  }
): WebflowDocumentConfig[] => {
  return documents.filter(doc => {
    if (!doc.is_mandatory) return false;
    
    const hasNationalityFilter = (doc.applies_to_nationalities || []).length > 0;
    const hasJurisdictionFilter = (doc.applies_to_jurisdictions || []).length > 0;
    const hasActivityFilter = (doc.applies_to_activities || []).length > 0;
    
    // If no filters, document applies to all
    if (!hasNationalityFilter && !hasJurisdictionFilter && !hasActivityFilter) {
      return true;
    }
    
    // Check nationality filter
    if (hasNationalityFilter && context.nationality) {
      if (!doc.applies_to_nationalities.includes(context.nationality)) {
        return false;
      }
    }
    
    // Check jurisdiction filter
    if (hasJurisdictionFilter && context.locationType) {
      if (!doc.applies_to_jurisdictions.includes(context.locationType)) {
        return false;
      }
    }
    
    // Check activity filter
    if (hasActivityFilter && context.activityCode) {
      if (!doc.applies_to_activities.includes(context.activityCode)) {
        return false;
      }
    }
    
    return true;
  });
};

// Check if country is eligible
export const isCountryEligible = (country: WebflowCountryConfig | undefined): boolean => {
  if (!country) return false;
  return country.is_active && !country.is_blocked;
};

// Check if country requires EDD
export const countryRequiresEDD = (country: WebflowCountryConfig | undefined): boolean => {
  if (!country) return false;
  return country.requires_enhanced_due_diligence;
};

export const useWebflowData = (): WebflowData => {
  const [configData, setConfigData] = useState<WebflowConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch from unified JSON configuration table
        const { data, error: fetchError } = await supabase
          .from('webflow_configurations')
          .select('config_data')
          .eq('is_active', true)
          .eq('name', 'default')
          .single();

        if (fetchError) {
          // If no config exists, use default
          if (fetchError.code === 'PGRST116') {
            console.warn('No webflow configuration found, using defaults');
            setConfigData(DEFAULT_CONFIG);
          } else {
            throw fetchError;
          }
        } else if (data?.config_data) {
          // Parse config_data
          const parsed = typeof data.config_data === 'string' 
            ? JSON.parse(data.config_data) 
            : data.config_data;

          // Filter to active items only
          setConfigData({
            countries: (parsed.countries || []).filter((c: any) => c.is_active !== false),
            jurisdictions: (parsed.jurisdictions || []).filter((j: any) => j.is_active !== false),
            activities: (parsed.activities || []).filter((a: any) => a.is_active !== false),
            documents: (parsed.documents || []).filter((d: any) => d.is_active !== false),
            pricing: (parsed.pricing || []).filter((p: any) => p.is_active !== false),
            rules: (parsed.rules || []).filter((r: any) => r.is_active !== false)
          });
        }
      } catch (err: any) {
        console.error('Error fetching webflow config:', err);
        setError(err.message || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return {
    countries: configData.countries,
    jurisdictions: configData.jurisdictions,
    activities: configData.activities,
    documents: configData.documents,
    rules: configData.rules,
    loading,
    error
  };
};

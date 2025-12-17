import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WebflowCountry {
  id: string;
  country_code: string;
  country_name: string;
  is_blocked: boolean;
  block_reason: string | null;
  risk_level: string;
  requires_enhanced_due_diligence: boolean;
  is_active: boolean;
}

export interface WebflowJurisdiction {
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

export interface WebflowActivity {
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
}

export interface WebflowDocument {
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

export interface WebflowRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any[];
  actions: any[];
  priority: number;
  is_active: boolean;
  description: string | null;
}

interface WebflowData {
  countries: WebflowCountry[];
  jurisdictions: WebflowJurisdiction[];
  activities: WebflowActivity[];
  documents: WebflowDocument[];
  rules: WebflowRule[];
  loading: boolean;
  error: string | null;
}

// Helper to get unique emirates from jurisdictions
export const getUniqueEmirates = (jurisdictions: WebflowJurisdiction[]): string[] => {
  const emirates = [...new Set(jurisdictions.map(j => j.emirate))];
  return emirates.sort();
};

// Helper to get unique jurisdiction types
export const getJurisdictionTypes = (jurisdictions: WebflowJurisdiction[]): string[] => {
  const types = [...new Set(jurisdictions.map(j => j.jurisdiction_type))];
  return types;
};

// Helper to get legal forms for a jurisdiction type
export const getLegalFormsForType = (
  jurisdictions: WebflowJurisdiction[], 
  locationType: string
): string[] => {
  const formsSet = new Set<string>();
  jurisdictions
    .filter(j => j.jurisdiction_type === locationType)
    .forEach(j => j.legal_forms.forEach(f => formsSet.add(f)));
  return [...formsSet];
};

// Helper to filter activities by jurisdiction
export const filterActivitiesByJurisdiction = (
  activities: WebflowActivity[],
  locationType: string | null
): WebflowActivity[] => {
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
  documents: WebflowDocument[],
  context: {
    nationality?: string;
    locationType?: string;
    activityCode?: string;
  }
): WebflowDocument[] => {
  return documents.filter(doc => {
    if (!doc.is_mandatory) return false;
    
    const hasNationalityFilter = doc.applies_to_nationalities.length > 0;
    const hasJurisdictionFilter = doc.applies_to_jurisdictions.length > 0;
    const hasActivityFilter = doc.applies_to_activities.length > 0;
    
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
export const isCountryEligible = (country: WebflowCountry | undefined): boolean => {
  if (!country) return false;
  return country.is_active && !country.is_blocked;
};

// Check if country requires EDD
export const countryRequiresEDD = (country: WebflowCountry | undefined): boolean => {
  if (!country) return false;
  return country.requires_enhanced_due_diligence;
};

export const useWebflowData = (): WebflowData => {
  const [countries, setCountries] = useState<WebflowCountry[]>([]);
  const [jurisdictions, setJurisdictions] = useState<WebflowJurisdiction[]>([]);
  const [activities, setActivities] = useState<WebflowActivity[]>([]);
  const [documents, setDocuments] = useState<WebflowDocument[]>([]);
  const [rules, setRules] = useState<WebflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          countriesRes,
          jurisdictionsRes,
          activitiesRes,
          documentsRes,
          rulesRes
        ] = await Promise.all([
          supabase.from('webflow_countries').select('*').eq('is_active', true).order('country_name'),
          supabase.from('webflow_jurisdictions').select('*').eq('is_active', true).order('emirate, jurisdiction_name'),
          supabase.from('webflow_activities').select('*').eq('is_active', true).order('category, activity_name'),
          supabase.from('webflow_documents').select('*').eq('is_active', true).order('sort_order, document_name'),
          supabase.from('webflow_rules').select('*').eq('is_active', true).order('priority')
        ]);

        if (countriesRes.error) throw countriesRes.error;
        if (jurisdictionsRes.error) throw jurisdictionsRes.error;
        if (activitiesRes.error) throw activitiesRes.error;
        if (documentsRes.error) throw documentsRes.error;
        if (rulesRes.error) throw rulesRes.error;

        setCountries((countriesRes.data || []).map(c => ({
          ...c,
          is_blocked: c.is_blocked || false,
          requires_enhanced_due_diligence: c.requires_enhanced_due_diligence || false
        })));

        setJurisdictions((jurisdictionsRes.data || []).map(j => ({
          ...j,
          jurisdiction_type: j.jurisdiction_type as 'mainland' | 'freezone' | 'offshore',
          legal_forms: Array.isArray(j.legal_forms) ? j.legal_forms as string[] : [],
          base_price: Number(j.base_price) || 0,
          processing_days: j.processing_days || 7
        })));

        setActivities((activitiesRes.data || []).map(a => ({
          ...a,
          allowed_jurisdictions: Array.isArray(a.allowed_jurisdictions) ? a.allowed_jurisdictions as string[] : [],
          edd_requirements: Array.isArray(a.edd_requirements) ? a.edd_requirements as string[] : [],
          price_modifier: Number(a.price_modifier) || 0,
          enhanced_due_diligence: a.enhanced_due_diligence || false,
          is_restricted: a.is_restricted || false,
          requires_approval: a.requires_approval || false
        })));

        setDocuments((documentsRes.data || []).map(d => ({
          ...d,
          applies_to_nationalities: Array.isArray(d.applies_to_nationalities) ? d.applies_to_nationalities as string[] : [],
          applies_to_jurisdictions: Array.isArray(d.applies_to_jurisdictions) ? d.applies_to_jurisdictions as string[] : [],
          applies_to_activities: Array.isArray(d.applies_to_activities) ? d.applies_to_activities as string[] : [],
          accepted_formats: Array.isArray(d.accepted_formats) ? d.accepted_formats as string[] : ['pdf', 'jpg', 'png'],
          max_file_size_mb: d.max_file_size_mb || 10,
          sort_order: d.sort_order || 0
        })));

        setRules((rulesRes.data || []).map(r => ({
          ...r,
          conditions: Array.isArray(r.conditions) ? r.conditions : [],
          actions: Array.isArray(r.actions) ? r.actions : [],
          priority: r.priority || 0
        })));

      } catch (err: any) {
        console.error('Error fetching webflow data:', err);
        setError(err.message || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return {
    countries,
    jurisdictions,
    activities,
    documents,
    rules,
    loading,
    error
  };
};

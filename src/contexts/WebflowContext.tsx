import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WebflowState {
  // Step 1: Country
  nationality: string;
  isEligible: boolean;
  
  // Step 2: Business Intent
  businessIntent: 'new' | 'existing' | null;
  
  // Step 3: Jurisdiction
  emirate: string;
  locationType: 'mainland' | 'freezone' | 'offshore' | null;
  legalForm: 'llc' | 'sole_establishment' | 'branch' | null;
  
  // Step 4: Business Activity
  activityCode: string;
  activityName: string;
  
  // Step 5: Plan & Pricing
  selectedPlan: string;
  includesBanking: boolean;
  includesBookkeeping: boolean;
  includesVat: boolean;
  
  // Step 6: Payment
  paymentCompleted: boolean;
  paymentReference: string;
  
  // Step 7: Founder Details
  founderName: string;
  founderPhone: string;
  founderEmail: string;
  passportNumber: string;
  visaStatus: string;
  address: string;
  documentsUploaded: string[];
  pendingDocuments: string[];
  
  // Step 8: Bookkeeping & Tax
  accountingFrequency: 'monthly' | 'quarterly' | null;
  accountingSystem: string;
  taxRegistrationNumber: string;
  
  // Current step
  currentStep: number;
  completedSteps: number[];
}

const initialState: WebflowState = {
  nationality: '',
  isEligible: true,
  businessIntent: null,
  emirate: '',
  locationType: null,
  legalForm: null,
  activityCode: '',
  activityName: '',
  selectedPlan: '',
  includesBanking: false,
  includesBookkeeping: false,
  includesVat: false,
  paymentCompleted: false,
  paymentReference: '',
  founderName: '',
  founderPhone: '',
  founderEmail: '',
  passportNumber: '',
  visaStatus: '',
  address: '',
  documentsUploaded: [],
  pendingDocuments: [],
  accountingFrequency: null,
  accountingSystem: '',
  taxRegistrationNumber: '',
  currentStep: 1,
  completedSteps: [],
};

interface RequiredDocument {
  document_code: string;
  document_name: string;
  is_mandatory: boolean;
}

interface WebflowContextType {
  state: WebflowState;
  updateState: (updates: Partial<WebflowState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetFlow: () => void;
  canProceed: boolean;
  requiredDocuments: RequiredDocument[];
  loadingDocuments: boolean;
}

const WebflowContext = createContext<WebflowContextType | undefined>(undefined);

const STORAGE_KEY = 'webflow_state';

export const WebflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WebflowState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  });

  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Fetch required documents from DB based on current context
  useEffect(() => {
    const fetchRequiredDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const { data, error } = await supabase
          .from('webflow_documents')
          .select('document_code, document_name, is_mandatory, applies_to_nationalities, applies_to_jurisdictions, applies_to_activities')
          .eq('is_active', true)
          .eq('is_mandatory', true)
          .order('sort_order');

        if (error) throw error;

        // Filter documents based on current context
        const filteredDocs = (data || []).filter(doc => {
          const nationalities = Array.isArray(doc.applies_to_nationalities) ? doc.applies_to_nationalities : [];
          const jurisdictions = Array.isArray(doc.applies_to_jurisdictions) ? doc.applies_to_jurisdictions : [];
          const activities = Array.isArray(doc.applies_to_activities) ? doc.applies_to_activities : [];

          const hasNationalityFilter = nationalities.length > 0;
          const hasJurisdictionFilter = jurisdictions.length > 0;
          const hasActivityFilter = activities.length > 0;

          // If no filters, document applies to all
          if (!hasNationalityFilter && !hasJurisdictionFilter && !hasActivityFilter) {
            return true;
          }

          // Check nationality filter
          if (hasNationalityFilter && state.nationality) {
            if (!nationalities.includes(state.nationality)) {
              return false;
            }
          }

          // Check jurisdiction filter
          if (hasJurisdictionFilter && state.locationType) {
            if (!jurisdictions.includes(state.locationType)) {
              return false;
            }
          }

          // Check activity filter
          if (hasActivityFilter && state.activityCode) {
            if (!activities.includes(state.activityCode)) {
              return false;
            }
          }

          return true;
        });

        setRequiredDocuments(filteredDocs.map(d => ({
          document_code: d.document_code,
          document_name: d.document_name,
          is_mandatory: d.is_mandatory
        })));
      } catch (err) {
        console.error('Error fetching required documents:', err);
        // Fallback to default documents if DB fetch fails
        setRequiredDocuments([
          { document_code: 'passport', document_name: 'Passport Copy', is_mandatory: true },
          { document_code: 'photo', document_name: 'Passport Photo', is_mandatory: true },
          { document_code: 'address_proof', document_name: 'Address Proof', is_mandatory: true }
        ]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchRequiredDocuments();
  }, [state.nationality, state.locationType, state.activityCode]);

  const updateState = useCallback((updates: Partial<WebflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 9),
      completedSteps: prev.completedSteps.includes(prev.currentStep) 
        ? prev.completedSteps 
        : [...prev.completedSteps, prev.currentStep],
    }));
  }, []);

  const prevStep = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState(prev => {
      if (step <= Math.max(...prev.completedSteps, prev.currentStep)) {
        return { ...prev, currentStep: step };
      }
      return prev;
    });
  }, []);

  const resetFlow = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  // canProceed now uses DB-backed required documents
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case 1: return !!state.nationality && state.isEligible;
      case 2: return !!state.businessIntent;
      case 3: return !!state.emirate && !!state.locationType && !!state.legalForm;
      case 4: return !!state.activityCode;
      case 5: return !!state.selectedPlan;
      case 6: return state.paymentCompleted;
      case 7: {
        // Use required documents from DB instead of hardcoded list
        const requiredDocCodes = requiredDocuments.map(d => d.document_code);
        const allDocsHandled = requiredDocCodes.every(
          doc => state.documentsUploaded.includes(doc) || state.pendingDocuments.includes(doc)
        );
        return !!state.founderName && !!state.founderPhone && !!state.passportNumber && allDocsHandled;
      }
      case 8: return !state.includesBookkeeping || !!state.accountingFrequency;
      default: return true;
    }
  }, [state, requiredDocuments]);

  const contextValue = useMemo(() => ({
    state,
    updateState,
    nextStep,
    prevStep,
    goToStep,
    resetFlow,
    canProceed,
    requiredDocuments,
    loadingDocuments
  }), [state, updateState, nextStep, prevStep, goToStep, resetFlow, canProceed, requiredDocuments, loadingDocuments]);

  return (
    <WebflowContext.Provider value={contextValue}>
      {children}
    </WebflowContext.Provider>
  );
};

export const useWebflow = () => {
  const context = useContext(WebflowContext);
  if (!context) throw new Error('useWebflow must be used within WebflowProvider');
  return context;
};

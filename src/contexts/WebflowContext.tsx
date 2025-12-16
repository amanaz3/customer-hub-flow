import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface WebflowContextType {
  state: WebflowState;
  updateState: (updates: Partial<WebflowState>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetFlow: () => void;
  canProceed: boolean;
}

const WebflowContext = createContext<WebflowContextType | undefined>(undefined);

const STORAGE_KEY = 'webflow_state';

export const WebflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WebflowState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<WebflowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 9),
      completedSteps: prev.completedSteps.includes(prev.currentStep) 
        ? prev.completedSteps 
        : [...prev.completedSteps, prev.currentStep],
    }));
  };

  const prevStep = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
  };

  const goToStep = (step: number) => {
    if (step <= Math.max(...state.completedSteps, state.currentStep)) {
      setState(prev => ({ ...prev, currentStep: step }));
    }
  };

  const resetFlow = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  const canProceed = (() => {
    switch (state.currentStep) {
      case 1: return !!state.nationality && state.isEligible;
      case 2: return !!state.businessIntent;
      case 3: return !!state.emirate && !!state.locationType && !!state.legalForm;
      case 4: return !!state.activityCode;
      case 5: return !!state.selectedPlan;
      case 6: return state.paymentCompleted;
      case 7: {
        const requiredDocs = ['passport', 'photo', 'emirates_id', 'address_proof'];
        const allDocsHandled = requiredDocs.every(
          doc => state.documentsUploaded.includes(doc) || state.pendingDocuments.includes(doc)
        );
        return !!state.founderName && !!state.founderPhone && !!state.passportNumber && allDocsHandled;
      }
      case 8: return !state.includesBookkeeping || !!state.accountingFrequency;
      default: return true;
    }
  })();

  return (
    <WebflowContext.Provider value={{ state, updateState, nextStep, prevStep, goToStep, resetFlow, canProceed }}>
      {children}
    </WebflowContext.Provider>
  );
};

export const useWebflow = () => {
  const context = useContext(WebflowContext);
  if (!context) throw new Error('useWebflow must be used within WebflowProvider');
  return context;
};

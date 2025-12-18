import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BankReadinessCaseInput, RiskAssessmentResult } from '@/types/bankReadiness';

export interface BankReadinessCaseRecord {
  id: string;
  created_at: string;
  created_by: string | null;
  customer_id: string | null;
  application_id: string | null;
  
  // Input fields
  applicant_nationality: string;
  uae_residency: boolean;
  company_jurisdiction: string;
  license_activity: string;
  business_model: string;
  expected_monthly_inflow: string;
  source_of_funds: string;
  source_of_funds_notes: string | null;
  incoming_payment_countries: string[];
  previous_rejection: boolean;
  previous_rejection_notes: string | null;
  
  // Assessment
  risk_score: number | null;
  risk_category: string | null;
  risk_flags: string[];
  recommended_banks: any[];
  banks_to_avoid: any[];
  best_bank: string | null;
  required_documents: string[];
  
  // Outcome
  status: string;
  bank_applied_to: string | null;
  application_date: string | null;
  outcome: string | null;
  outcome_date: string | null;
  outcome_notes: string | null;
  rejection_reason: string | null;
}

export interface BankOutcomeRecord {
  id: string;
  case_id: string;
  bank_name: string;
  was_recommended: boolean;
  was_avoided: boolean;
  outcome: string | null;
  outcome_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
  prediction_correct: boolean | null;
}

export function useBankReadinessCases() {
  const [cases, setCases] = useState<BankReadinessCaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bank_readiness_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to load cases');
    } else {
      // Cast the data to our interface
      const mappedCases: BankReadinessCaseRecord[] = (data || []).map(d => ({
        ...d,
        recommended_banks: (d.recommended_banks as any[]) || [],
        banks_to_avoid: (d.banks_to_avoid as any[]) || [],
        risk_flags: (d.risk_flags as string[]) || [],
        incoming_payment_countries: (d.incoming_payment_countries as string[]) || [],
        required_documents: (d.required_documents as string[]) || [],
      }));
      setCases(mappedCases);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const saveCase = async (
    input: BankReadinessCaseInput,
    result: RiskAssessmentResult,
    customerId?: string,
    applicationId?: string
  ): Promise<string | null> => {
    const { data: userData } = await supabase.auth.getUser();
    
    const caseData = {
      created_by: userData?.user?.id || null,
      customer_id: customerId || null,
      application_id: applicationId || null,
      
      // Input
      applicant_nationality: input.applicant_nationality,
      uae_residency: input.uae_residency,
      company_jurisdiction: input.company_jurisdiction,
      license_activity: input.license_activity,
      business_model: input.business_model,
      expected_monthly_inflow: input.expected_monthly_inflow,
      source_of_funds: input.source_of_funds,
      source_of_funds_notes: input.source_of_funds_notes || null,
      incoming_payment_countries: input.incoming_payment_countries,
      previous_rejection: input.previous_rejection,
      previous_rejection_notes: input.previous_rejection_notes || null,
      
      // Assessment
      risk_score: result.score,
      risk_category: result.category,
      risk_flags: result.flags,
      recommended_banks: result.recommendedBanks,
      banks_to_avoid: result.banksToAvoid,
      best_bank: result.recommendedBanks[0]?.bank_name || null,
      required_documents: result.requiredDocuments || [],
      
      status: 'assessed'
    };

    const { data, error } = await supabase
      .from('bank_readiness_cases')
      .insert([caseData as any])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving case:', error);
      toast.error('Failed to save case');
      return null;
    }

    toast.success('Case saved for outcome tracking');
    fetchCases();
    return data.id;
  };

  const updateOutcome = async (
    caseId: string,
    bankAppliedTo: string,
    outcome: 'approved' | 'rejected' | 'pending' | 'withdrawn',
    outcomeDate?: string,
    outcomeNotes?: string,
    rejectionReason?: string
  ) => {
    const { error } = await supabase
      .from('bank_readiness_cases')
      .update({
        bank_applied_to: bankAppliedTo,
        outcome,
        outcome_date: outcomeDate || new Date().toISOString().split('T')[0],
        outcome_notes: outcomeNotes || null,
        rejection_reason: outcome === 'rejected' ? rejectionReason : null,
        status: outcome === 'approved' ? 'completed' : outcome === 'rejected' ? 'assessed' : 'assessed'
      })
      .eq('id', caseId);

    if (error) {
      console.error('Error updating outcome:', error);
      toast.error('Failed to update outcome');
      return false;
    }

    toast.success('Outcome recorded');
    fetchCases();
    return true;
  };

  const getAccuracyStats = () => {
    const casesWithOutcome = cases.filter(c => c.outcome);
    const approved = casesWithOutcome.filter(c => c.outcome === 'approved');
    const rejected = casesWithOutcome.filter(c => c.outcome === 'rejected');
    
    // Check prediction accuracy
    const correctPredictions = casesWithOutcome.filter(c => {
      if (c.outcome === 'approved' && c.bank_applied_to) {
        // Check if the approved bank was in recommended list
        const recommended = c.recommended_banks as any[];
        return recommended.some(b => b.bank_name === c.bank_applied_to);
      }
      if (c.outcome === 'rejected' && c.bank_applied_to) {
        // Check if rejected bank was in avoid list
        const avoided = c.banks_to_avoid as any[];
        return avoided.some(b => b.bank_name === c.bank_applied_to);
      }
      return false;
    });

    return {
      totalCases: cases.length,
      casesWithOutcome: casesWithOutcome.length,
      approved: approved.length,
      rejected: rejected.length,
      accuracyRate: casesWithOutcome.length > 0 
        ? Math.round((correctPredictions.length / casesWithOutcome.length) * 100) 
        : 0
    };
  };

  return {
    cases,
    loading,
    saveCase,
    updateOutcome,
    getAccuracyStats,
    refetch: fetchCases
  };
}

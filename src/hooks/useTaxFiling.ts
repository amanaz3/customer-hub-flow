import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type TaxFilingStatus = Database['public']['Enums']['tax_filing_status'];

export interface TaxFiling {
  id: string;
  tax_year: number;
  period_start: string;
  period_end: string;
  company_name: string;
  status: TaxFilingStatus;
  current_step: string;
  total_revenue: number;
  total_expenses: number;
  taxable_income: number;
  tax_liability: number;
  bookkeeping_complete: boolean;
}

export function useTaxFiling() {
  const [currentFiling, setCurrentFiling] = useState<TaxFiling | null>(null);
  const [isBookkeepingComplete, setIsBookkeepingComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkBookkeepingStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Check if there are reconciled transactions in the bookkeeper module
      const { data: reconciliations, error: reconcError } = await supabase
        .from('bookkeeper_reconciliations')
        .select('id')
        .eq('status', 'matched')
        .limit(1);

      // Check for invoices and bills
      const { data: invoices } = await supabase
        .from('bookkeeper_invoices')
        .select('id')
        .limit(1);

      const { data: bills } = await supabase
        .from('bookkeeper_bills')
        .select('id')
        .limit(1);

      // Consider bookkeeping complete if there are records
      const hasRecords = (invoices && invoices.length > 0) || (bills && bills.length > 0);
      const hasReconciliations = reconciliations && reconciliations.length > 0;
      
      // For demo purposes, consider it complete if there's any bookkeeper data
      // In production, this would check for proper reconciliation status
      setIsBookkeepingComplete(hasRecords || hasReconciliations);

      // Check for existing draft filing
      const { data: existingFiling } = await supabase
        .from('tax_filings')
        .select('*')
        .in('status', ['draft', 'in_progress', 'ready_for_review'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingFiling) {
        setCurrentFiling(existingFiling as unknown as TaxFiling);
      }
    } catch (error) {
      console.error('Error checking bookkeeping status:', error);
      // For demo, default to complete
      setIsBookkeepingComplete(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewFiling = useCallback(async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a tax filing.",
          variant: "destructive",
        });
        return null;
      }

      const currentYear = new Date().getFullYear();
      
      const { data: newFiling, error } = await supabase
        .from('tax_filings')
        .insert({
          tax_year: currentYear,
          period_start: `${currentYear}-01-01`,
          period_end: `${currentYear}-12-31`,
          company_name: 'My Company', // Would be fetched from company profile
          status: 'draft',
          current_step: 'verify_bookkeeping',
          created_by: userData.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentFiling(newFiling as unknown as TaxFiling);
      toast({
        title: "Tax Filing Created",
        description: `New filing for tax year ${currentYear} has been created.`,
      });

      return newFiling;
    } catch (error: any) {
      console.error('Error creating tax filing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create tax filing.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const updateFiling = useCallback(async (updates: Partial<Omit<TaxFiling, 'status'>> & { status?: TaxFilingStatus }) => {
    if (!currentFiling) return;

    try {
      const { error } = await supabase
        .from('tax_filings')
        .update(updates as any)
        .eq('id', currentFiling.id);

      if (error) throw error;

      setCurrentFiling(prev => prev ? { ...prev, ...updates } : null);
    } catch (error: any) {
      console.error('Error updating tax filing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update tax filing.",
        variant: "destructive",
      });
    }
  }, [currentFiling, toast]);

  return {
    currentFiling,
    isBookkeepingComplete,
    loading,
    checkBookkeepingStatus,
    createNewFiling,
    updateFiling,
    setIsBookkeepingComplete,
  };
}

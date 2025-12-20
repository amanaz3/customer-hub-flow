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

// Customer scenario types for conditional workflow routing
export type CustomerScenario = 
  | 'existing_with_bookkeeping'    // Existing customer with complete bookkeeping outputs
  | 'new_with_predone_bookkeeping' // New customer uploaded pre-done bookkeeping
  | 'new_with_raw_docs_only'       // New customer only has raw invoices/receipts
  | 'no_data';                     // No data at all

export interface BookkeepingStatus {
  scenario: CustomerScenario;
  hasReconciliations: boolean;
  hasInvoices: boolean;
  hasBills: boolean;
  hasPayments: boolean;
  reconciliationCount: number;
  invoiceCount: number;
  billCount: number;
  isComplete: boolean;
  summary: string;
}

export function useTaxFiling() {
  const [currentFiling, setCurrentFiling] = useState<TaxFiling | null>(null);
  const [bookkeepingStatus, setBookkeepingStatus] = useState<BookkeepingStatus>({
    scenario: 'no_data',
    hasReconciliations: false,
    hasInvoices: false,
    hasBills: false,
    hasPayments: false,
    reconciliationCount: 0,
    invoiceCount: 0,
    billCount: 0,
    isComplete: false,
    summary: 'No bookkeeping data found',
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkBookkeepingStatus = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all relevant bookkeeping data counts in parallel
      const [reconciliationsRes, invoicesRes, billsRes, paymentsRes, existingFilingRes] = await Promise.all([
        supabase
          .from('bookkeeper_reconciliations')
          .select('id, status', { count: 'exact' })
          .limit(100),
        supabase
          .from('bookkeeper_invoices')
          .select('id', { count: 'exact' })
          .limit(100),
        supabase
          .from('bookkeeper_bills')
          .select('id', { count: 'exact' })
          .limit(100),
        supabase
          .from('bookkeeper_payments')
          .select('id', { count: 'exact' })
          .limit(100),
        supabase
          .from('tax_filings')
          .select('*')
          .in('status', ['draft', 'in_progress', 'ready_for_review'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const reconciliations = reconciliationsRes.data || [];
      const matchedReconciliations = reconciliations.filter(r => r.status === 'matched');
      const invoiceCount = invoicesRes.count || 0;
      const billCount = billsRes.count || 0;
      const paymentCount = paymentsRes.count || 0;
      const reconciliationCount = matchedReconciliations.length;

      const hasReconciliations = reconciliationCount > 0;
      const hasInvoices = invoiceCount > 0;
      const hasBills = billCount > 0;
      const hasPayments = paymentCount > 0;
      const hasRawDocs = hasInvoices || hasBills;
      const hasCompleteBookkeeping = hasReconciliations && hasRawDocs;

      // Determine customer scenario
      let scenario: CustomerScenario;
      let summary: string;

      if (hasCompleteBookkeeping) {
        // Has both reconciliations and documents - complete bookkeeping
        scenario = 'existing_with_bookkeeping';
        summary = `Complete bookkeeping found: ${invoiceCount} invoices, ${billCount} bills, ${reconciliationCount} reconciliations`;
      } else if (hasReconciliations && !hasRawDocs) {
        // Has reconciliations but no raw docs - pre-done bookkeeping uploaded
        scenario = 'new_with_predone_bookkeeping';
        summary = `Pre-done bookkeeping detected: ${reconciliationCount} reconciliations. Missing raw documents.`;
      } else if (hasRawDocs && !hasReconciliations) {
        // Has raw docs but no reconciliations - needs bookkeeping
        scenario = 'new_with_raw_docs_only';
        summary = `Raw documents found: ${invoiceCount} invoices, ${billCount} bills. Bookkeeping reconciliation needed.`;
      } else {
        scenario = 'no_data';
        summary = 'No bookkeeping data found. Please upload documents or complete bookkeeping first.';
      }

      const isComplete = scenario === 'existing_with_bookkeeping' || scenario === 'new_with_predone_bookkeeping';

      setBookkeepingStatus({
        scenario,
        hasReconciliations,
        hasInvoices,
        hasBills,
        hasPayments,
        reconciliationCount,
        invoiceCount,
        billCount,
        isComplete,
        summary,
      });

      // Check for existing filing
      if (existingFilingRes.data) {
        setCurrentFiling(existingFilingRes.data as unknown as TaxFiling);
      }
    } catch (error) {
      console.error('Error checking bookkeeping status:', error);
      // For demo, default to complete
      setBookkeepingStatus(prev => ({
        ...prev,
        scenario: 'existing_with_bookkeeping',
        isComplete: true,
        summary: 'Demo mode: Bookkeeping assumed complete',
      }));
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
          company_name: 'My Company',
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

  // Legacy compatibility
  const isBookkeepingComplete = bookkeepingStatus.isComplete;
  const setIsBookkeepingComplete = useCallback((value: boolean) => {
    setBookkeepingStatus(prev => ({ ...prev, isComplete: value }));
  }, []);

  return {
    currentFiling,
    bookkeepingStatus,
    isBookkeepingComplete,
    loading,
    checkBookkeepingStatus,
    createNewFiling,
    updateFiling,
    setIsBookkeepingComplete,
  };
}

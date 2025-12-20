import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EntityDetails {
  id: string;
  reference_number?: string;
  amount?: number;
  date?: string;
  name?: string;  // vendor_name or customer_name
  status?: string;
}

export interface AISuggestion {
  id: string;
  suggestion_type: 'bill_payment' | 'invoice_receipt';
  source_type: 'bill' | 'invoice';
  source_id: string;
  target_type: 'payment' | 'receipt';
  target_id: string;
  confidence_score: number;
  match_reasons: Array<{ rule: string; score: number; reason: string }>;
  status: 'pending' | 'approved' | 'rejected' | 'auto_matched';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  // Enhanced entity details
  source_details?: EntityDetails;
  target_details?: EntityDetails;
}

export interface RiskFlag {
  id: string;
  flag_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type: string;
  entity_id: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  description: string;
  details: Record<string, any>;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface CashFlowForecast {
  id: string;
  forecast_date: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  projected_inflow: number;
  projected_outflow: number;
  net_position: number;
  confidence_level: number;
  data_completeness_score: number;
  risk_factors: Array<{ factor: string; impact: number }>;
}

export interface WorkflowStats {
  totalBills: number;
  totalInvoices: number;
  totalPayments: number;
  reconciledCount: number;
  pendingSuggestions: number;
  openRiskFlags: number;
  dataCompleteness: number;
  riskScore: number;
}

export function useAIReconciliation() {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [riskFlags, setRiskFlags] = useState<RiskFlag[]>([]);
  const [forecasts, setForecasts] = useState<CashFlowForecast[]>([]);
  const [stats, setStats] = useState<WorkflowStats>({
    totalBills: 0,
    totalInvoices: 0,
    totalPayments: 0,
    reconciledCount: 0,
    pendingSuggestions: 0,
    openRiskFlags: 0,
    dataCompleteness: 1,
    riskScore: 100,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  // Helper to enrich suggestions with entity details
  const enrichSuggestionsWithDetails = async (rawSuggestions: any[]): Promise<AISuggestion[]> => {
    if (rawSuggestions.length === 0) return [];

    // Collect unique IDs by type
    const billIds = new Set<string>();
    const invoiceIds = new Set<string>();
    const paymentIds = new Set<string>();

    rawSuggestions.forEach(s => {
      if (s.source_type === 'bill') billIds.add(s.source_id);
      if (s.source_type === 'invoice') invoiceIds.add(s.source_id);
      paymentIds.add(s.target_id);
    });

    // Fetch all entities in parallel
    const [billsResult, invoicesResult, paymentsResult] = await Promise.all([
      billIds.size > 0 
        ? supabase.from('bookkeeper_bills')
            .select('id, reference_number, total_amount, bill_date, vendor_name, status')
            .in('id', Array.from(billIds))
        : { data: [] },
      invoiceIds.size > 0
        ? supabase.from('bookkeeper_invoices')
            .select('id, reference_number, total_amount, invoice_date, customer_name, status')
            .in('id', Array.from(invoiceIds))
        : { data: [] },
      paymentIds.size > 0
        ? supabase.from('bookkeeper_payments')
            .select('id, reference_number, amount, payment_date, payment_type')
            .in('id', Array.from(paymentIds))
        : { data: [] },
    ]);

    // Create lookup maps
    const billsMap = new Map((billsResult.data || []).map(b => [b.id, {
      id: b.id,
      reference_number: b.reference_number,
      amount: b.total_amount,
      date: b.bill_date,
      name: b.vendor_name,
      status: b.status,
    }]));

    const invoicesMap = new Map((invoicesResult.data || []).map(i => [i.id, {
      id: i.id,
      reference_number: i.reference_number,
      amount: i.total_amount,
      date: i.invoice_date,
      name: i.customer_name,
      status: i.status,
    }]));

    const paymentsMap = new Map((paymentsResult.data || []).map(p => [p.id, {
      id: p.id,
      reference_number: p.reference_number,
      amount: p.amount,
      date: p.payment_date,
      name: p.payment_type,
    }]));

    // Enrich suggestions
    return rawSuggestions.map(s => ({
      ...s,
      match_reasons: s.match_reasons || [],
      source_details: s.source_type === 'bill' 
        ? billsMap.get(s.source_id) 
        : invoicesMap.get(s.source_id),
      target_details: paymentsMap.get(s.target_id),
    })) as AISuggestion[];
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch suggestions
      const { data: suggestionsData, error: sugError } = await supabase
        .from('bookkeeper_ai_suggestions')
        .select('*')
        .order('confidence_score', { ascending: false });

      if (sugError) throw sugError;

      // Fetch entity details for suggestions
      const enrichedSuggestions = await enrichSuggestionsWithDetails(suggestionsData || []);

      // Fetch risk flags
      const { data: flagsData, error: flagError } = await supabase
        .from('bookkeeper_risk_flags')
        .select('*')
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (flagError) throw flagError;

      // Fetch forecasts
      const { data: forecastData, error: forecastError } = await supabase
        .from('bookkeeper_cash_flow_forecasts')
        .select('*')
        .gte('forecast_date', new Date().toISOString().split('T')[0])
        .order('forecast_date', { ascending: true })
        .limit(30);

      if (forecastError) throw forecastError;

      // Fetch stats
      const [billsRes, invoicesRes, paymentsRes] = await Promise.all([
        supabase.from('bookkeeper_bills').select('id, is_paid', { count: 'exact' }),
        supabase.from('bookkeeper_invoices').select('id, is_paid', { count: 'exact' }),
        supabase.from('bookkeeper_payments').select('id, bill_id, invoice_id', { count: 'exact' }),
      ]);

      const bills = billsRes.data || [];
      const invoices = invoicesRes.data || [];
      const payments = paymentsRes.data || [];

      const reconciledCount = 
        bills.filter(b => b.is_paid).length + 
        invoices.filter(i => i.is_paid).length;

      const totalRecords = bills.length + invoices.length + payments.length;
      const reconciledPayments = payments.filter(p => p.bill_id || p.invoice_id).length;
      const dataCompleteness = totalRecords > 0 
        ? (reconciledCount + reconciledPayments) / totalRecords 
        : 1;

      const openFlags = (flagsData || []).filter(f => f.status === 'open');
      const riskScore = Math.max(0, 100 - openFlags.length * 10);

      setSuggestions(enrichedSuggestions);
      setRiskFlags((flagsData || []) as unknown as RiskFlag[]);
      setForecasts((forecastData || []) as unknown as CashFlowForecast[]);
      setStats({
        totalBills: bills.length,
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        reconciledCount,
        pendingSuggestions: (suggestionsData || []).filter(s => s.status === 'pending').length,
        openRiskFlags: openFlags.length,
        dataCompleteness,
        riskScore,
      });

    } catch (error: any) {
      console.error('Error fetching AI reconciliation data:', error);
      toast({ title: 'Error loading data', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runAIReconciliation = async (type: 'all' | 'payable' | 'receivable' = 'all') => {
    try {
      setProcessing(true);
      toast({ title: 'Running AI reconciliation...', description: 'This may take a moment' });

      const { data, error } = await supabase.functions.invoke('bookkeeper-ai-reconcile', {
        body: { type, autoApproveThreshold: 0.95 },
      });

      if (error) throw error;

      toast({
        title: 'AI Reconciliation Complete',
        description: `${data.results.autoMatched} auto-matched, ${data.results.needsReview} needs review`,
      });

      await fetchData();
      return data.results;

    } catch (error: any) {
      console.error('AI reconciliation error:', error);
      toast({ title: 'Error running AI reconciliation', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const detectGaps = async (startDate?: string, endDate?: string) => {
    try {
      setProcessing(true);
      toast({ title: 'Detecting data gaps...', description: 'Analyzing transactions' });

      const { data, error } = await supabase.functions.invoke('bookkeeper-detect-gaps', {
        body: { 
          startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0],
        },
      });

      if (error) throw error;

      toast({
        title: 'Gap Detection Complete',
        description: `Risk Score: ${data.results.riskScore}%, ${data.results.missingBills.length + data.results.missingInvoices.length} issues found`,
      });

      await fetchData();
      return data.results;

    } catch (error: any) {
      console.error('Gap detection error:', error);
      toast({ title: 'Error detecting gaps', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Run smart AI matching with Lovable AI
  const runSmartAIMatch = async () => {
    try {
      setProcessing(true);
      toast({ title: 'Running Smart AI Match...', description: 'Using AI to find optimal matches' });

      // Fetch unmatched records and user feedback
      const [billsRes, invoicesRes, paymentsRes, feedbackRes] = await Promise.all([
        supabase.from('bookkeeper_bills').select('*').eq('is_paid', false),
        supabase.from('bookkeeper_invoices').select('*').eq('is_paid', false),
        supabase.from('bookkeeper_payments').select('*').is('bill_id', null).is('invoice_id', null),
        supabase.from('bookkeeper_ai_feedback').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      const { data, error } = await supabase.functions.invoke('bookkeeper-ai-smart-match', {
        body: {
          unmatchedBills: billsRes.data || [],
          unmatchedInvoices: invoicesRes.data || [],
          payments: paymentsRes.data || [],
          userFeedback: feedbackRes.data || [],
        },
      });

      if (error) throw error;

      toast({
        title: 'Smart AI Match Complete',
        description: `${data.results.autoMatched} auto-matched, ${data.results.needsReview} needs review. ${data.results.insights || ''}`,
      });

      if (data.results.warnings?.length > 0) {
        toast({
          title: 'AI Warnings',
          description: data.results.warnings.join(', '),
          variant: 'destructive',
        });
      }

      await fetchData();
      return data.results;

    } catch (error: any) {
      console.error('Smart AI match error:', error);
      toast({ title: 'Error running Smart AI Match', description: error.message, variant: 'destructive' });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const approveSuggestion = async (suggestionId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('bookkeeper_ai_suggestions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          review_notes: notes,
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Get suggestion details to apply the match
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        if (suggestion.source_type === 'bill') {
          await supabase
            .from('bookkeeper_payments')
            .update({ bill_id: suggestion.source_id })
            .eq('id', suggestion.target_id);

          await supabase
            .from('bookkeeper_bills')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('id', suggestion.source_id);
        } else {
          await supabase
            .from('bookkeeper_payments')
            .update({ invoice_id: suggestion.source_id })
            .eq('id', suggestion.target_id);

          await supabase
            .from('bookkeeper_invoices')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('id', suggestion.source_id);
        }

        // Record feedback for AI learning
        await supabase.from('bookkeeper_ai_feedback').insert({
          suggestion_id: suggestionId,
          feedback_type: 'approve',
          original_match: {
            source_id: suggestion.source_id,
            target_id: suggestion.target_id,
            confidence: suggestion.confidence_score,
          },
        });
      }

      toast({ title: 'Match approved and applied' });
      await fetchData();

    } catch (error: any) {
      toast({ title: 'Error approving suggestion', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const rejectSuggestion = async (suggestionId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('bookkeeper_ai_suggestions')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          review_notes: reason,
        })
        .eq('id', suggestionId);

      if (error) throw error;

      // Record feedback for AI learning
      const suggestion = suggestions.find(s => s.id === suggestionId);
      if (suggestion) {
        await supabase.from('bookkeeper_ai_feedback').insert({
          suggestion_id: suggestionId,
          feedback_type: 'reject',
          feedback_reason: reason,
          original_match: {
            source_id: suggestion.source_id,
            target_id: suggestion.target_id,
            confidence: suggestion.confidence_score,
          },
        });
      }

      toast({ title: 'Suggestion rejected' });
      await fetchData();

    } catch (error: any) {
      toast({ title: 'Error rejecting suggestion', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const resolveRiskFlag = async (flagId: string, resolution: 'resolved' | 'dismissed', notes?: string) => {
    try {
      const { error } = await supabase
        .from('bookkeeper_risk_flags')
        .update({
          status: resolution,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', flagId);

      if (error) throw error;

      toast({ title: `Risk flag ${resolution}` });
      await fetchData();

    } catch (error: any) {
      toast({ title: 'Error updating risk flag', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  return {
    suggestions,
    riskFlags,
    forecasts,
    stats,
    loading,
    processing,
    fetchData,
    runAIReconciliation,
    runSmartAIMatch,
    detectGaps,
    approveSuggestion,
    rejectSuggestion,
    resolveRiskFlag,
  };
}

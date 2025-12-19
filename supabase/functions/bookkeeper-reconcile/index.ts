import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconcileRequest {
  type: 'payable' | 'receivable' | 'all';
  autoMatch?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type = 'all', autoMatch = true }: ReconcileRequest = await req.json();
    
    const results = {
      matched: 0,
      partial: 0,
      unmatched: 0,
      discrepancies: [] as Array<{
        type: 'payable' | 'receivable';
        id: string;
        reference: string;
        expectedAmount: number;
        actualAmount: number;
        discrepancy: number;
        reason: string;
      }>
    };
    
    // Reconcile Accounts Payable (Bills vs Payments)
    if (type === 'payable' || type === 'all') {
      const { data: bills, error: billsError } = await supabase
        .from('bookkeeper_bills')
        .select('*, payments:bookkeeper_payments(*)');
      
      if (billsError) throw billsError;
      
      for (const bill of bills || []) {
        const payments = bill.payments || [];
        const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const expectedAmount = Number(bill.total_amount);
        
        let status: 'matched' | 'partial' | 'unmatched' = 'unmatched';
        let discrepancyAmount = 0;
        let discrepancyReason = '';
        
        if (totalPaid === 0) {
          status = 'unmatched';
          discrepancyAmount = expectedAmount;
          discrepancyReason = 'No payments recorded';
        } else if (Math.abs(totalPaid - expectedAmount) < 0.01) {
          status = 'matched';
          discrepancyAmount = 0;
        } else if (totalPaid < expectedAmount) {
          status = 'partial';
          discrepancyAmount = expectedAmount - totalPaid;
          discrepancyReason = 'Partial payment received';
        } else {
          status = 'matched'; // Overpayment, but still matched
          discrepancyAmount = totalPaid - expectedAmount;
          discrepancyReason = 'Overpayment';
        }
        
        results[status]++;
        
        if (status !== 'matched') {
          results.discrepancies.push({
            type: 'payable',
            id: bill.id,
            reference: bill.reference_number,
            expectedAmount,
            actualAmount: totalPaid,
            discrepancy: discrepancyAmount,
            reason: discrepancyReason
          });
        }
        
        // Update or create reconciliation record
        if (autoMatch) {
          const { error: reconcileError } = await supabase
            .from('bookkeeper_reconciliations')
            .upsert({
              bill_id: bill.id,
              status,
              matched_amount: totalPaid,
              discrepancy_amount: discrepancyAmount,
              discrepancy_reason: discrepancyReason || null,
              reconciled_at: status === 'matched' ? new Date().toISOString() : null
            }, {
              onConflict: 'bill_id'
            });
          
          if (reconcileError) {
            console.error('Error updating reconciliation:', reconcileError);
          }
          
          // Update bill paid status
          await supabase
            .from('bookkeeper_bills')
            .update({
              is_paid: status === 'matched',
              paid_amount: totalPaid,
              paid_at: status === 'matched' ? new Date().toISOString() : null
            })
            .eq('id', bill.id);
        }
      }
    }
    
    // Reconcile Accounts Receivable (Invoices vs Receipts)
    if (type === 'receivable' || type === 'all') {
      const { data: invoices, error: invoicesError } = await supabase
        .from('bookkeeper_invoices')
        .select('*, payments:bookkeeper_payments(*)');
      
      if (invoicesError) throw invoicesError;
      
      for (const invoice of invoices || []) {
        const payments = invoice.payments || [];
        const totalReceived = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
        const expectedAmount = Number(invoice.total_amount);
        
        let status: 'matched' | 'partial' | 'unmatched' = 'unmatched';
        let discrepancyAmount = 0;
        let discrepancyReason = '';
        
        if (totalReceived === 0) {
          status = 'unmatched';
          discrepancyAmount = expectedAmount;
          discrepancyReason = 'No receipts recorded';
        } else if (Math.abs(totalReceived - expectedAmount) < 0.01) {
          status = 'matched';
          discrepancyAmount = 0;
        } else if (totalReceived < expectedAmount) {
          status = 'partial';
          discrepancyAmount = expectedAmount - totalReceived;
          discrepancyReason = 'Partial payment received';
        } else {
          status = 'matched';
          discrepancyAmount = totalReceived - expectedAmount;
          discrepancyReason = 'Overpayment';
        }
        
        results[status]++;
        
        if (status !== 'matched') {
          results.discrepancies.push({
            type: 'receivable',
            id: invoice.id,
            reference: invoice.reference_number,
            expectedAmount,
            actualAmount: totalReceived,
            discrepancy: discrepancyAmount,
            reason: discrepancyReason
          });
        }
        
        // Update or create reconciliation record
        if (autoMatch) {
          const { error: reconcileError } = await supabase
            .from('bookkeeper_reconciliations')
            .upsert({
              invoice_id: invoice.id,
              status,
              matched_amount: totalReceived,
              discrepancy_amount: discrepancyAmount,
              discrepancy_reason: discrepancyReason || null,
              reconciled_at: status === 'matched' ? new Date().toISOString() : null
            }, {
              onConflict: 'invoice_id'
            });
          
          if (reconcileError) {
            console.error('Error updating reconciliation:', reconcileError);
          }
          
          // Update invoice paid status
          await supabase
            .from('bookkeeper_invoices')
            .update({
              is_paid: status === 'matched',
              paid_amount: totalReceived,
              paid_at: status === 'matched' ? new Date().toISOString() : null
            })
            .eq('id', invoice.id);
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Reconciliation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Reconciliation failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

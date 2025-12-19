import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { startDate, endDate } = await req.json();

    console.log(`Detecting gaps from ${startDate} to ${endDate}`);

    const results = {
      missingInvoices: [] as any[],
      missingBills: [] as any[],
      dateGaps: [] as any[],
      amountDiscrepancies: [] as any[],
      riskScore: 100,
      dataCompleteness: 1.0,
    };

    // Fetch all data for the period
    const dateFilter = startDate && endDate 
      ? { gte: startDate, lte: endDate }
      : undefined;

    const [billsRes, invoicesRes, paymentsRes] = await Promise.all([
      supabase.from('bookkeeper_bills').select('*')
        .gte('bill_date', startDate || '1900-01-01')
        .lte('bill_date', endDate || '2100-12-31'),
      supabase.from('bookkeeper_invoices').select('*')
        .gte('invoice_date', startDate || '1900-01-01')
        .lte('invoice_date', endDate || '2100-12-31'),
      supabase.from('bookkeeper_payments').select('*')
        .gte('payment_date', startDate || '1900-01-01')
        .lte('payment_date', endDate || '2100-12-31'),
    ]);

    const bills = billsRes.data || [];
    const invoices = invoicesRes.data || [];
    const payments = paymentsRes.data || [];

    // Check for payments without corresponding bills/invoices
    const outgoingPayments = payments.filter(p => p.payment_type === 'outgoing');
    const incomingPayments = payments.filter(p => p.payment_type === 'incoming');

    for (const payment of outgoingPayments) {
      if (!payment.bill_id) {
        // Check if there's a similar bill
        const matchingBill = bills.find(b => 
          Math.abs(b.total_amount - payment.amount) < 1 &&
          !b.is_paid
        );

        if (!matchingBill) {
          results.missingBills.push({
            payment_id: payment.id,
            amount: payment.amount,
            date: payment.payment_date,
            reference: payment.reference_number,
            description: 'Outgoing payment without corresponding bill',
          });

          // Create risk flag
          await supabase.from('bookkeeper_risk_flags').upsert({
            flag_type: 'missing_invoice',
            severity: payment.amount > 10000 ? 'high' : 'medium',
            entity_type: 'payment',
            entity_id: payment.id,
            description: `Outgoing payment of ${payment.amount} has no matching bill`,
            details: {
              amount: payment.amount,
              date: payment.payment_date,
              reference: payment.reference_number,
            },
          }, { onConflict: 'entity_type,entity_id' });
        }
      }
    }

    for (const payment of incomingPayments) {
      if (!payment.invoice_id) {
        const matchingInvoice = invoices.find(i => 
          Math.abs(i.total_amount - payment.amount) < 1 &&
          !i.is_paid
        );

        if (!matchingInvoice) {
          results.missingInvoices.push({
            payment_id: payment.id,
            amount: payment.amount,
            date: payment.payment_date,
            reference: payment.reference_number,
            description: 'Incoming payment without corresponding invoice',
          });

          await supabase.from('bookkeeper_risk_flags').upsert({
            flag_type: 'missing_invoice',
            severity: payment.amount > 10000 ? 'high' : 'medium',
            entity_type: 'payment',
            entity_id: payment.id,
            description: `Incoming payment of ${payment.amount} has no matching invoice`,
            details: {
              amount: payment.amount,
              date: payment.payment_date,
            },
          }, { onConflict: 'entity_type,entity_id' });
        }
      }
    }

    // Check for date gaps in transaction sequence
    const allDates = [
      ...bills.map(b => new Date(b.bill_date)),
      ...invoices.map(i => new Date(i.invoice_date)),
      ...payments.map(p => new Date(p.payment_date)),
    ].sort((a, b) => a.getTime() - b.getTime());

    if (allDates.length > 1) {
      for (let i = 1; i < allDates.length; i++) {
        const daysDiff = (allDates[i].getTime() - allDates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) { // Gap of more than 30 days
          results.dateGaps.push({
            from: allDates[i - 1].toISOString().split('T')[0],
            to: allDates[i].toISOString().split('T')[0],
            days: Math.round(daysDiff),
            description: `${Math.round(daysDiff)} day gap in transaction records`,
          });

          await supabase.from('bookkeeper_risk_flags').insert({
            flag_type: 'date_gap',
            severity: daysDiff > 60 ? 'high' : 'medium',
            entity_type: 'transaction',
            entity_id: crypto.randomUUID(),
            description: `${Math.round(daysDiff)} day gap in transaction records`,
            details: {
              from: allDates[i - 1].toISOString(),
              to: allDates[i].toISOString(),
            },
          });
        }
      }
    }

    // Check for amount discrepancies in reconciled items
    const { data: reconciliations } = await supabase
      .from('bookkeeper_reconciliations')
      .select('*, bookkeeper_bills(*), bookkeeper_invoices(*), bookkeeper_payments(*)');

    if (reconciliations) {
      for (const rec of reconciliations) {
        if (rec.discrepancy_amount && Math.abs(rec.discrepancy_amount) > 1) {
          results.amountDiscrepancies.push({
            reconciliation_id: rec.id,
            discrepancy: rec.discrepancy_amount,
            reason: rec.discrepancy_reason || 'Unexplained amount difference',
          });
        }
      }
    }

    // Calculate risk score
    const totalIssues = 
      results.missingInvoices.length * 10 +
      results.missingBills.length * 10 +
      results.dateGaps.length * 5 +
      results.amountDiscrepancies.length * 15;

    results.riskScore = Math.max(0, 100 - totalIssues);

    // Calculate data completeness
    const totalRecords = bills.length + invoices.length + payments.length;
    const reconciledRecords = 
      bills.filter(b => b.is_paid).length +
      invoices.filter(i => i.is_paid).length +
      payments.filter(p => p.bill_id || p.invoice_id).length;

    results.dataCompleteness = totalRecords > 0 
      ? reconciledRecords / totalRecords 
      : 1.0;

    // Generate cash flow forecast
    const today = new Date();
    const forecastDays = 30;

    for (let i = 0; i < forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);
      const dateStr = forecastDate.toISOString().split('T')[0];

      // Calculate expected inflows (unpaid invoices due around this date)
      const expectedInflow = invoices
        .filter(inv => {
          const dueDate = new Date(inv.due_date);
          return !inv.is_paid && 
            Math.abs((dueDate.getTime() - forecastDate.getTime()) / (1000 * 60 * 60 * 24)) < 3;
        })
        .reduce((sum, inv) => sum + Number(inv.total_amount), 0);

      // Calculate expected outflows (unpaid bills due around this date)
      const expectedOutflow = bills
        .filter(bill => {
          const dueDate = new Date(bill.due_date);
          return !bill.is_paid && 
            Math.abs((dueDate.getTime() - forecastDate.getTime()) / (1000 * 60 * 60 * 24)) < 3;
        })
        .reduce((sum, bill) => sum + Number(bill.total_amount), 0);

      if (expectedInflow > 0 || expectedOutflow > 0) {
        await supabase.from('bookkeeper_cash_flow_forecasts').upsert({
          forecast_date: dateStr,
          period_type: 'daily',
          projected_inflow: expectedInflow,
          projected_outflow: expectedOutflow,
          net_position: expectedInflow - expectedOutflow,
          confidence_level: results.dataCompleteness,
          data_completeness_score: results.dataCompleteness,
          risk_factors: results.missingInvoices.length > 0 
            ? [{ factor: 'missing_data', impact: -results.missingInvoices.length * 1000 }]
            : [],
        }, { onConflict: 'forecast_date,period_type' });
      }
    }

    console.log(`Gap detection complete: ${results.missingBills.length} missing bills, ${results.missingInvoices.length} missing invoices, risk score: ${results.riskScore}`);

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Gap detection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

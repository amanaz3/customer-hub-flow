import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ForecastRequest {
  forecastDays?: number;
  accountingMethod?: 'cash' | 'accrual';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { forecastDays = 30, accountingMethod = 'accrual' }: ForecastRequest = await req.json();
    
    const today = new Date();
    const forecastEndDate = new Date(today.getTime() + forecastDays * 24 * 60 * 60 * 1000);
    
    // Get all unpaid bills (Accounts Payable)
    const { data: unpaidBills, error: billsError } = await supabase
      .from('bookkeeper_bills')
      .select('*')
      .eq('is_paid', false)
      .lte('due_date', forecastEndDate.toISOString().split('T')[0]);
    
    if (billsError) throw billsError;
    
    // Get all unpaid invoices (Accounts Receivable)
    const { data: unpaidInvoices, error: invoicesError } = await supabase
      .from('bookkeeper_invoices')
      .select('*')
      .eq('is_paid', false)
      .lte('due_date', forecastEndDate.toISOString().split('T')[0]);
    
    if (invoicesError) throw invoicesError;
    
    // Calculate overdue amounts
    const todayStr = today.toISOString().split('T')[0];
    
    const overduePayables = (unpaidBills || [])
      .filter(bill => bill.due_date && bill.due_date < todayStr)
      .reduce((sum, bill) => sum + (Number(bill.total_amount) - Number(bill.paid_amount || 0)), 0);
    
    const overdueReceivables = (unpaidInvoices || [])
      .filter(inv => inv.due_date && inv.due_date < todayStr)
      .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)), 0);
    
    // Calculate expected cash flows by week
    const weeklyForecasts: Array<{
      weekStart: string;
      weekEnd: string;
      expectedInflow: number;
      expectedOutflow: number;
      netCashFlow: number;
    }> = [];
    
    for (let i = 0; i < Math.ceil(forecastDays / 7); i++) {
      const weekStart = new Date(today.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      
      const weekStartStr = weekStart.toISOString().split('T')[0];
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      
      // Expected outflows (bills due this week)
      const expectedOutflow = (unpaidBills || [])
        .filter(bill => bill.due_date >= weekStartStr && bill.due_date <= weekEndStr)
        .reduce((sum, bill) => sum + (Number(bill.total_amount) - Number(bill.paid_amount || 0)), 0);
      
      // Expected inflows (invoices due this week)
      const expectedInflow = (unpaidInvoices || [])
        .filter(inv => inv.due_date >= weekStartStr && inv.due_date <= weekEndStr)
        .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)), 0);
      
      weeklyForecasts.push({
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        expectedInflow,
        expectedOutflow,
        netCashFlow: expectedInflow - expectedOutflow
      });
    }
    
    // Calculate totals
    const totalExpectedInflow = (unpaidInvoices || [])
      .reduce((sum, inv) => sum + (Number(inv.total_amount) - Number(inv.paid_amount || 0)), 0);
    
    const totalExpectedOutflow = (unpaidBills || [])
      .reduce((sum, bill) => sum + (Number(bill.total_amount) - Number(bill.paid_amount || 0)), 0);
    
    // Get aging buckets
    const agingBuckets = {
      current: { payables: 0, receivables: 0 },
      '1-30': { payables: 0, receivables: 0 },
      '31-60': { payables: 0, receivables: 0 },
      '61-90': { payables: 0, receivables: 0 },
      '90+': { payables: 0, receivables: 0 }
    };
    
    const getDaysOverdue = (dueDate: string) => {
      const due = new Date(dueDate);
      const diffTime = today.getTime() - due.getTime();
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };
    
    (unpaidBills || []).forEach(bill => {
      const amount = Number(bill.total_amount) - Number(bill.paid_amount || 0);
      const daysOverdue = bill.due_date ? getDaysOverdue(bill.due_date) : 0;
      
      if (daysOverdue <= 0) agingBuckets.current.payables += amount;
      else if (daysOverdue <= 30) agingBuckets['1-30'].payables += amount;
      else if (daysOverdue <= 60) agingBuckets['31-60'].payables += amount;
      else if (daysOverdue <= 90) agingBuckets['61-90'].payables += amount;
      else agingBuckets['90+'].payables += amount;
    });
    
    (unpaidInvoices || []).forEach(inv => {
      const amount = Number(inv.total_amount) - Number(inv.paid_amount || 0);
      const daysOverdue = inv.due_date ? getDaysOverdue(inv.due_date) : 0;
      
      if (daysOverdue <= 0) agingBuckets.current.receivables += amount;
      else if (daysOverdue <= 30) agingBuckets['1-30'].receivables += amount;
      else if (daysOverdue <= 60) agingBuckets['31-60'].receivables += amount;
      else if (daysOverdue <= 90) agingBuckets['61-90'].receivables += amount;
      else agingBuckets['90+'].receivables += amount;
    });
    
    // Store forecast in database
    const { error: forecastError } = await supabase
      .from('bookkeeper_forecasts')
      .insert({
        forecast_date: todayStr,
        forecast_type: `${forecastDays}-day`,
        expected_inflow: totalExpectedInflow,
        expected_outflow: totalExpectedOutflow,
        net_cash_flow: totalExpectedInflow - totalExpectedOutflow,
        overdue_receivables: overdueReceivables,
        overdue_payables: overduePayables,
        forecast_data: {
          weeklyForecasts,
          agingBuckets,
          accountingMethod
        }
      });
    
    if (forecastError) {
      console.error('Error saving forecast:', forecastError);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          summary: {
            totalExpectedInflow,
            totalExpectedOutflow,
            netCashFlow: totalExpectedInflow - totalExpectedOutflow,
            overdueReceivables,
            overduePayables,
            accountingMethod
          },
          weeklyForecasts,
          agingBuckets,
          billsCount: (unpaidBills || []).length,
          invoicesCount: (unpaidInvoices || []).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Analytics calculation failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

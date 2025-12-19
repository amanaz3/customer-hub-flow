import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReconciliationRule {
  id: string;
  rule_name: string;
  condition_type: string;
  params: Record<string, any>;
  priority: number;
  jurisdiction: string;
}

interface MatchResult {
  sourceId: string;
  sourceType: 'bill' | 'invoice';
  targetId: string;
  targetType: 'payment' | 'receipt';
  confidenceScore: number;
  matchReasons: Array<{ rule: string; score: number; reason: string }>;
  isAutoMatch: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type = 'all', autoApproveThreshold = 0.95 } = await req.json();

    console.log(`Running AI reconciliation for type: ${type}`);

    // Fetch active reconciliation rules
    const { data: rules, error: rulesError } = await supabase
      .from('bookkeeper_reconciliation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (rulesError) throw rulesError;

    // Fetch global settings
    const { data: settingsData } = await supabase
      .from('bookkeeper_settings')
      .select('setting_key, setting_value');

    const settings: Record<string, any> = {};
    settingsData?.forEach(s => {
      settings[s.setting_key] = (s.setting_value as any)?.value;
    });

    const minConfidence = settings.min_confidence_score ?? 0.85;
    const autoMatchEnabled = settings.auto_match_enabled ?? true;

    const results = {
      suggestions: [] as any[],
      autoMatched: 0,
      needsReview: 0,
      riskFlags: [] as any[],
    };

    // Process Bills -> Payments matching
    if (type === 'all' || type === 'payable') {
      const { data: bills } = await supabase
        .from('bookkeeper_bills')
        .select('*, bookkeeper_payments(id, amount, payment_date, reference_number)')
        .eq('is_paid', false);

      const { data: unmatchedPayments } = await supabase
        .from('bookkeeper_payments')
        .select('*')
        .eq('payment_type', 'outgoing')
        .is('bill_id', null);

      if (bills && unmatchedPayments) {
        for (const bill of bills) {
          for (const payment of unmatchedPayments) {
            const matchResult = evaluateMatch(bill, payment, rules || [], 'bill', 'payment');
            
            if (matchResult.confidenceScore >= minConfidence) {
              const isAutoMatch = autoMatchEnabled && matchResult.confidenceScore >= autoApproveThreshold;
              
              // Create suggestion
              const { data: suggestion } = await supabase
                .from('bookkeeper_ai_suggestions')
                .insert({
                  suggestion_type: 'bill_payment',
                  source_type: 'bill',
                  source_id: bill.id,
                  target_type: 'payment',
                  target_id: payment.id,
                  confidence_score: matchResult.confidenceScore,
                  match_reasons: matchResult.matchReasons,
                  status: isAutoMatch ? 'auto_matched' : 'pending',
                })
                .select()
                .single();

              if (isAutoMatch && suggestion) {
                // Auto-apply match
                await supabase
                  .from('bookkeeper_payments')
                  .update({ bill_id: bill.id })
                  .eq('id', payment.id);

                await supabase
                  .from('bookkeeper_bills')
                  .update({ is_paid: true, paid_at: new Date().toISOString() })
                  .eq('id', bill.id);

                results.autoMatched++;
              } else {
                results.needsReview++;
              }

              results.suggestions.push(suggestion);
            }
          }
        }

        // Flag unmatched bills as potential issues
        for (const bill of bills) {
          const hasSuggestion = results.suggestions.some(
            s => s?.source_id === bill.id
          );
          
          if (!hasSuggestion) {
            const dueDate = new Date(bill.due_date);
            const today = new Date();
            const isOverdue = dueDate < today;
            
            await supabase.from('bookkeeper_risk_flags').insert({
              flag_type: 'unreconciled',
              severity: isOverdue ? 'high' : 'medium',
              entity_type: 'bill',
              entity_id: bill.id,
              description: isOverdue 
                ? `Overdue bill with no matching payment found`
                : `Bill pending with no matching payment found`,
              details: {
                vendor: bill.vendor_name,
                amount: bill.total_amount,
                due_date: bill.due_date,
              },
            });

            results.riskFlags.push({
              type: 'unreconciled',
              entity: 'bill',
              id: bill.id,
            });
          }
        }
      }
    }

    // Process Invoices -> Receipts matching
    if (type === 'all' || type === 'receivable') {
      const { data: invoices } = await supabase
        .from('bookkeeper_invoices')
        .select('*')
        .eq('is_paid', false);

      const { data: unmatchedReceipts } = await supabase
        .from('bookkeeper_payments')
        .select('*')
        .eq('payment_type', 'incoming')
        .is('invoice_id', null);

      if (invoices && unmatchedReceipts) {
        for (const invoice of invoices) {
          for (const receipt of unmatchedReceipts) {
            const matchResult = evaluateMatch(invoice, receipt, rules || [], 'invoice', 'receipt');
            
            if (matchResult.confidenceScore >= minConfidence) {
              const isAutoMatch = autoMatchEnabled && matchResult.confidenceScore >= autoApproveThreshold;
              
              const { data: suggestion } = await supabase
                .from('bookkeeper_ai_suggestions')
                .insert({
                  suggestion_type: 'invoice_receipt',
                  source_type: 'invoice',
                  source_id: invoice.id,
                  target_type: 'receipt',
                  target_id: receipt.id,
                  confidence_score: matchResult.confidenceScore,
                  match_reasons: matchResult.matchReasons,
                  status: isAutoMatch ? 'auto_matched' : 'pending',
                })
                .select()
                .single();

              if (isAutoMatch && suggestion) {
                await supabase
                  .from('bookkeeper_payments')
                  .update({ invoice_id: invoice.id })
                  .eq('id', receipt.id);

                await supabase
                  .from('bookkeeper_invoices')
                  .update({ is_paid: true, paid_at: new Date().toISOString() })
                  .eq('id', invoice.id);

                results.autoMatched++;
              } else {
                results.needsReview++;
              }

              results.suggestions.push(suggestion);
            }
          }
        }

        // Flag overdue invoices
        for (const invoice of invoices) {
          const hasSuggestion = results.suggestions.some(
            s => s?.source_id === invoice.id
          );
          
          if (!hasSuggestion) {
            const dueDate = new Date(invoice.due_date);
            const today = new Date();
            const isOverdue = dueDate < today;
            
            if (isOverdue) {
              await supabase.from('bookkeeper_risk_flags').insert({
                flag_type: 'unreconciled',
                severity: 'high',
                entity_type: 'invoice',
                entity_id: invoice.id,
                description: `Overdue invoice with no matching receipt`,
                details: {
                  customer: invoice.customer_name,
                  amount: invoice.total_amount,
                  due_date: invoice.due_date,
                },
              });

              results.riskFlags.push({
                type: 'overdue',
                entity: 'invoice',
                id: invoice.id,
              });
            }
          }
        }
      }
    }

    // Check for duplicates
    const { data: allPayments } = await supabase
      .from('bookkeeper_payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (allPayments) {
      const seen = new Map<string, any>();
      for (const payment of allPayments) {
        const key = `${payment.amount}-${payment.payment_date}-${payment.reference_number}`;
        if (seen.has(key)) {
          const existing = seen.get(key);
          
          // Check if already flagged
          const { data: existingFlag } = await supabase
            .from('bookkeeper_risk_flags')
            .select('id')
            .eq('entity_id', payment.id)
            .eq('flag_type', 'duplicate_payment')
            .single();

          if (!existingFlag) {
            await supabase.from('bookkeeper_risk_flags').insert({
              flag_type: 'duplicate_payment',
              severity: 'high',
              entity_type: 'payment',
              entity_id: payment.id,
              related_entity_type: 'payment',
              related_entity_id: existing.id,
              description: `Potential duplicate payment detected`,
              details: {
                amount: payment.amount,
                date: payment.payment_date,
                reference: payment.reference_number,
              },
            });

            results.riskFlags.push({
              type: 'duplicate',
              entity: 'payment',
              id: payment.id,
            });
          }
        } else {
          seen.set(key, payment);
        }
      }
    }

    console.log(`AI Reconciliation complete: ${results.autoMatched} auto-matched, ${results.needsReview} needs review, ${results.riskFlags.length} risk flags`);

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Reconciliation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function evaluateMatch(
  source: any,
  target: any,
  rules: ReconciliationRule[],
  sourceType: 'bill' | 'invoice',
  targetType: 'payment' | 'receipt'
): { confidenceScore: number; matchReasons: Array<{ rule: string; score: number; reason: string }> } {
  const matchReasons: Array<{ rule: string; score: number; reason: string }> = [];
  let totalWeight = 0;
  let weightedScore = 0;

  for (const rule of rules) {
    const weight = 100 - rule.priority; // Lower priority = higher weight
    let score = 0;
    let reason = '';

    switch (rule.condition_type) {
      case 'amount_exact': {
        const sourceAmount = source.total_amount || source.amount;
        const targetAmount = target.amount;
        if (Math.abs(sourceAmount - targetAmount) < 0.01) {
          score = 1.0;
          reason = 'Exact amount match';
        }
        break;
      }

      case 'amount_tolerance': {
        const sourceAmount = source.total_amount || source.amount;
        const targetAmount = target.amount;
        const tolerance = (rule.params.tolerance_percent || 2) / 100;
        const diff = Math.abs(sourceAmount - targetAmount);
        const maxDiff = sourceAmount * tolerance;
        if (diff <= maxDiff) {
          score = 1 - (diff / maxDiff);
          reason = `Within ${rule.params.tolerance_percent}% tolerance`;
        }
        break;
      }

      case 'date_range': {
        const sourceDate = new Date(source.bill_date || source.invoice_date);
        const targetDate = new Date(target.payment_date);
        const diffDays = Math.abs(
          (targetDate.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const maxDays = Math.max(rule.params.days_before || 7, rule.params.days_after || 3);
        if (diffDays <= maxDays) {
          score = 1 - (diffDays / maxDays);
          reason = `Date within ${diffDays.toFixed(0)} days`;
        }
        break;
      }

      case 'reference_match': {
        const sourceRef = (source.reference_number || '').toLowerCase();
        const targetRef = (target.reference_number || '').toLowerCase();
        if (sourceRef && targetRef) {
          if (sourceRef === targetRef) {
            score = 1.0;
            reason = 'Exact reference match';
          } else if (rule.params.partial_match && (sourceRef.includes(targetRef) || targetRef.includes(sourceRef))) {
            score = 0.8;
            reason = 'Partial reference match';
          }
        }
        break;
      }

      case 'currency_match': {
        const sourceCurrency = source.currency || 'AED';
        const targetCurrency = target.currency || 'AED';
        if (sourceCurrency === targetCurrency) {
          score = 1.0;
          reason = `Currency match (${sourceCurrency})`;
        }
        break;
      }
    }

    if (score > 0) {
      matchReasons.push({ rule: rule.rule_name, score, reason });
      totalWeight += weight;
      weightedScore += score * weight;
    }
  }

  const confidenceScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  return { confidenceScore, matchReasons };
}

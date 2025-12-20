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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { unmatchedBills, unmatchedInvoices, payments, userFeedback } = await req.json();

    console.log('Smart Match Request:', {
      bills: unmatchedBills?.length || 0,
      invoices: unmatchedInvoices?.length || 0,
      payments: payments?.length || 0,
      feedback: userFeedback?.length || 0
    });

    // Build context from user feedback for AI learning
    const feedbackContext = (userFeedback || []).slice(-20).map((f: any) => {
      return `- ${f.feedback_type}: ${f.feedback_reason || 'No reason'} (confidence was ${(f.original_match?.confidence * 100 || 0).toFixed(0)}%)`;
    }).join('\n');

    // Prepare data summary for AI
    const billsSummary = (unmatchedBills || []).slice(0, 20).map((b: any) => ({
      id: b.id,
      vendor: b.vendor_name,
      amount: b.total_amount,
      date: b.bill_date,
      reference: b.reference_number,
    }));

    const invoicesSummary = (unmatchedInvoices || []).slice(0, 20).map((i: any) => ({
      id: i.id,
      customer: i.customer_name,
      amount: i.total_amount,
      date: i.invoice_date,
      reference: i.reference_number,
    }));

    const paymentsSummary = (payments || []).slice(0, 30).map((p: any) => ({
      id: p.id,
      type: p.payment_type,
      amount: p.amount,
      date: p.payment_date,
      reference: p.reference_number,
      bankRef: p.bank_reference,
      linkedBill: p.bill_id,
      linkedInvoice: p.invoice_id,
    }));

    // Call Lovable AI for smart matching
    const systemPrompt = `You are a financial reconciliation AI assistant. Your task is to analyze unmatched bills, invoices, and payments to suggest the best matches.

Consider these factors when matching:
1. Amount similarity (exact match is ideal, small differences may be valid)
2. Date proximity (payments typically occur within 30 days of bill/invoice)
3. Reference numbers (partial or full matches)
4. Vendor/customer name patterns
5. Payment descriptions or bank references

${feedbackContext ? `Learn from this user feedback on previous suggestions:\n${feedbackContext}\n` : ''}

Return a JSON object with this exact structure:
{
  "matches": [
    {
      "source_type": "bill" | "invoice",
      "source_id": "uuid",
      "target_id": "payment uuid",
      "confidence": 0.0-1.0,
      "reasons": [
        { "rule": "rule name", "score": 0.0-1.0, "reason": "explanation" }
      ]
    }
  ],
  "insights": "Brief summary of matching patterns found",
  "warnings": ["any data quality issues noticed"]
}`;

    const userPrompt = `Analyze these financial records and suggest matches:

UNMATCHED BILLS:
${JSON.stringify(billsSummary, null, 2)}

UNMATCHED INVOICES:
${JSON.stringify(invoicesSummary, null, 2)}

AVAILABLE PAYMENTS (unlinked):
${JSON.stringify(paymentsSummary.filter((p: any) => !p.linkedBill && !p.linkedInvoice), null, 2)}

Find the best matches and return your analysis in the specified JSON format.`;

    console.log('Calling Lovable AI...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_matches',
              description: 'Suggest financial record matches based on analysis',
              parameters: {
                type: 'object',
                properties: {
                  matches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        source_type: { type: 'string', enum: ['bill', 'invoice'] },
                        source_id: { type: 'string' },
                        target_id: { type: 'string' },
                        confidence: { type: 'number', minimum: 0, maximum: 1 },
                        reasons: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              rule: { type: 'string' },
                              score: { type: 'number' },
                              reason: { type: 'string' }
                            },
                            required: ['rule', 'score', 'reason']
                          }
                        }
                      },
                      required: ['source_type', 'source_id', 'target_id', 'confidence', 'reasons']
                    }
                  },
                  insights: { type: 'string' },
                  warnings: { type: 'array', items: { type: 'string' } }
                },
                required: ['matches', 'insights', 'warnings']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_matches' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI response error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted, please add funds' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response received');

    // Extract function call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { matches: [], insights: '', warnings: [] as string[] };
    
    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }

    console.log(`AI suggested ${result.matches.length} matches`);

    // Save AI suggestions to database
    const suggestionsToInsert = result.matches.map((match: any) => ({
      suggestion_type: match.source_type === 'bill' ? 'bill_payment' : 'invoice_receipt',
      source_type: match.source_type,
      source_id: match.source_id,
      target_type: 'payment',
      target_id: match.target_id,
      confidence_score: match.confidence,
      match_reasons: match.reasons,
      status: match.confidence >= 0.95 ? 'auto_matched' : 'pending',
    }));

    if (suggestionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('bookkeeper_ai_suggestions')
        .insert(suggestionsToInsert);

      if (insertError) {
        console.error('Error inserting suggestions:', insertError);
      }

      // Auto-apply high confidence matches
      const autoMatches = suggestionsToInsert.filter((s: any) => s.status === 'auto_matched');
      for (const match of autoMatches) {
        if (match.source_type === 'bill') {
          await supabase
            .from('bookkeeper_payments')
            .update({ bill_id: match.source_id })
            .eq('id', match.target_id);
          
          await supabase
            .from('bookkeeper_bills')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('id', match.source_id);
        } else {
          await supabase
            .from('bookkeeper_payments')
            .update({ invoice_id: match.source_id })
            .eq('id', match.target_id);
          
          await supabase
            .from('bookkeeper_invoices')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('id', match.source_id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          totalMatches: result.matches.length,
          autoMatched: result.matches.filter((m: any) => m.confidence >= 0.95).length,
          needsReview: result.matches.filter((m: any) => m.confidence < 0.95).length,
          insights: result.insights,
          warnings: result.warnings,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Smart match error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicationId, method } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Fetch application data
    const { data: application, error: appError } = await supabaseClient
      .from('account_applications')
      .select('*, customer:customers(*)')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    let riskScore = 0;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let calculationDetails = '';

    if (method === 'rule') {
      // Rule-based calculation
      const appData = application.application_data;
      const factors: string[] = [];
      let score = 0;

      // Mainland/Freezone (0-20 points)
      if (appData.mainland_or_freezone === 'freezone') {
        score += 5;
        factors.push('Freezone: +5');
      } else {
        score += 15;
        factors.push('Mainland: +15');
      }

      // Number of shareholders (0-25 points)
      const shareholders = appData.number_of_shareholders || 1;
      if (shareholders === 1) {
        score += 5;
        factors.push('1 Shareholder: +5');
      } else if (shareholders === 2) {
        score += 10;
        factors.push('2 Shareholders: +10');
      } else if (shareholders <= 5) {
        score += 15;
        factors.push('3-5 Shareholders: +15');
      } else {
        score += 25;
        factors.push('6+ Shareholders: +25');
      }

      // Signatory type (0-15 points)
      if (appData.signatory_type === 'single') {
        score += 5;
        factors.push('Single Signatory: +5');
      } else {
        score += 15;
        factors.push('Joint Signatory: +15');
      }

      // Annual turnover (0-20 points)
      const turnover = application.customer?.annual_turnover || 0;
      if (turnover < 500000) {
        score += 5;
        factors.push('Turnover <500K: +5');
      } else if (turnover < 2000000) {
        score += 10;
        factors.push('Turnover 500K-2M: +10');
      } else if (turnover < 5000000) {
        score += 15;
        factors.push('Turnover 2M-5M: +15');
      } else {
        score += 20;
        factors.push('Turnover >5M: +20');
      }

      // Minimum balance (0-20 points)
      const balanceRange = appData.minimum_balance_range;
      if (balanceRange === '0-10k') {
        score += 5;
        factors.push('Min Balance 0-10K: +5');
      } else if (balanceRange === '10k-100k') {
        score += 10;
        factors.push('Min Balance 10K-100K: +10');
      } else if (balanceRange === '100k-150k') {
        score += 15;
        factors.push('Min Balance 100K-150K: +15');
      } else {
        score += 20;
        factors.push('Min Balance >150K: +20');
      }

      riskScore = score;
      calculationDetails = factors.join('\n');

      // Classify
      if (score < 34) {
        riskLevel = 'low';
      } else if (score < 67) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'high';
      }

    } else if (method === 'ai') {
      // AI-powered calculation
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

      const appData = application.application_data;
      const customer = application.customer;

      const prompt = `Analyze this bank account application and provide a risk score from 0-100 and classification (low/medium/high).

Application Details:
- Type: ${appData.mainland_or_freezone || 'N/A'}
- Shareholders: ${appData.number_of_shareholders || 1}
- Signatory: ${appData.signatory_type || 'N/A'}
- Annual Turnover: ${customer?.annual_turnover || 0} AED
- Minimum Balance: ${appData.minimum_balance_range || 'N/A'}
- Business Activity: ${appData.business_activity_details || 'N/A'}
- Company: ${customer?.company || 'N/A'}

Consider compliance complexity, documentation requirements, and approval difficulty.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a banking compliance risk analyst. Analyze applications and return risk scores with reasoning.' },
            { role: 'user', content: prompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'assess_risk',
              description: 'Return risk assessment for bank account application',
              parameters: {
                type: 'object',
                properties: {
                  score: { type: 'number', minimum: 0, maximum: 100 },
                  classification: { type: 'string', enum: ['low', 'medium', 'high'] },
                  reasoning: { type: 'string' }
                },
                required: ['score', 'classification', 'reasoning'],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'assess_risk' } }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error('No tool call in AI response');

      const result = JSON.parse(toolCall.function.arguments);
      riskScore = result.score;
      riskLevel = result.classification;
      calculationDetails = result.reasoning;

    } else if (method === 'manual' || method === 'hybrid') {
      // For manual and hybrid, return placeholder - will be handled by frontend
      return new Response(JSON.stringify({
        requiresManualInput: true,
        message: method === 'manual' 
          ? 'Manual assessment requires user input for risk factors'
          : 'Hybrid assessment combines AI analysis with manual override'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      riskScore,
      riskLevel,
      calculationDetails,
      method
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calculating risk:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

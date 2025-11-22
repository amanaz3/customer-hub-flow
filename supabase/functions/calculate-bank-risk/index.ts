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
      const calculationBreakdown: Array<{factor: string, points: number}> = [];
      let score = 0;

      // Mainland/Freezone (0-20 points)
      if (appData.mainland_or_freezone === 'freezone') {
        score += 5;
        calculationBreakdown.push({factor: 'Freezone jurisdiction', points: 5});
      } else {
        score += 15;
        calculationBreakdown.push({factor: 'Mainland jurisdiction', points: 15});
      }

      // Number of shareholders (0-25 points)
      const shareholders = appData.number_of_shareholders || 1;
      if (shareholders === 1) {
        score += 5;
        calculationBreakdown.push({factor: '1 Shareholder', points: 5});
      } else if (shareholders === 2) {
        score += 10;
        calculationBreakdown.push({factor: '2 Shareholders', points: 10});
      } else if (shareholders <= 5) {
        score += 15;
        calculationBreakdown.push({factor: `${shareholders} Shareholders`, points: 15});
      } else {
        score += 25;
        calculationBreakdown.push({factor: `${shareholders} Shareholders (high complexity)`, points: 25});
      }

      // Signatory type (0-15 points)
      if (appData.signatory_type === 'single') {
        score += 5;
        calculationBreakdown.push({factor: 'Single Signatory', points: 5});
      } else {
        score += 15;
        calculationBreakdown.push({factor: 'Joint Signatory', points: 15});
      }

      // Annual turnover (0-20 points)
      const turnover = application.customer?.annual_turnover || 0;
      if (turnover < 500000) {
        score += 5;
        calculationBreakdown.push({factor: 'Turnover <500K', points: 5});
      } else if (turnover < 2000000) {
        score += 10;
        calculationBreakdown.push({factor: 'Turnover 500K-2M', points: 10});
      } else if (turnover < 5000000) {
        score += 15;
        calculationBreakdown.push({factor: 'Turnover 2M-5M', points: 15});
      } else {
        score += 20;
        calculationBreakdown.push({factor: 'Turnover >5M', points: 20});
      }

      // Minimum balance (0-20 points)
      const balanceRange = appData.minimum_balance_range;
      if (balanceRange === '0-10k') {
        score += 5;
        calculationBreakdown.push({factor: 'Min Balance 0-10K', points: 5});
      } else if (balanceRange === '10k-100k') {
        score += 10;
        calculationBreakdown.push({factor: 'Min Balance 10K-100K', points: 10});
      } else if (balanceRange === '100k-150k') {
        score += 15;
        calculationBreakdown.push({factor: 'Min Balance 100K-150K', points: 15});
      } else {
        score += 20;
        calculationBreakdown.push({factor: 'Min Balance >150K', points: 20});
      }

      riskScore = score;
      
      // Generate rule-based recommendations
      const recommendations: string[] = [];
      if (score >= 67) {
        recommendations.push('Consider simplifying the shareholder structure if possible');
        recommendations.push('Review and potentially adjust signatory requirements');
        recommendations.push('Ensure all compliance documentation is comprehensive and up-to-date');
        if (turnover >= 5000000) {
          recommendations.push('Implement enhanced due diligence procedures for high-turnover accounts');
        }
        if (balanceRange === '>150k') {
          recommendations.push('Ensure adequate financial controls are in place for high-balance requirements');
        }
      } else if (score >= 34) {
        recommendations.push('Maintain detailed records of all business activities');
        recommendations.push('Ensure shareholder documentation is complete and verified');
        if (appData.signatory_type === 'joint') {
          recommendations.push('Document clear authorization protocols for joint signatories');
        }
      } else {
        recommendations.push('Continue maintaining good compliance practices');
        recommendations.push('Keep business documentation updated regularly');
      }
      
      calculationDetails = JSON.stringify({
        breakdown: calculationBreakdown,
        recommendations: recommendations
      });

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

      const systemPrompt = `You are a banking compliance risk analyst specializing in UAE bank account opening.

Analyze the application and provide:
1. A risk score (0-100) where:
   - 0-33 = Low Risk
   - 34-66 = Medium Risk  
   - 67-100 = High Risk

2. For each risk factor you identify, calculate specific point contributions that sum to your total score.

3. Explain how each factor contributes points to the final score with clear justification.

4. Provide actionable recommendations to reduce the identified risks.

Be specific about point allocation - the factors must add up to your total score.`;

      const prompt = `Analyze this bank account application for risk assessment:

Application Details:
- Jurisdiction: ${appData.mainland_or_freezone || 'N/A'}
- Number of Shareholders: ${appData.number_of_shareholders || 1}
- Signatory Type: ${appData.signatory_type || 'N/A'}
- Annual Turnover: ${customer?.annual_turnover || 0} AED
- Minimum Balance Range: ${appData.minimum_balance_range || 'N/A'}
- Business Activity: ${appData.business_activity_details || 'N/A'}
- Company Name: ${customer?.company || 'N/A'}

Provide a detailed risk assessment with specific point allocations for each factor.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'assess_risk',
              description: 'Return detailed risk assessment with point breakdown',
              parameters: {
                type: 'object',
                properties: {
                  total_score: { 
                    type: 'number', 
                    minimum: 0, 
                    maximum: 100,
                    description: 'Total risk score from 0-100'
                  },
                  classification: { 
                    type: 'string', 
                    enum: ['low', 'medium', 'high'],
                    description: 'Risk level classification'
                  },
                  reasoning: { 
                    type: 'string',
                    description: 'Overall reasoning for the risk assessment'
                  },
                  score_breakdown: {
                    type: 'array',
                    description: 'Detailed breakdown of how points were calculated for each factor',
                    items: {
                      type: 'object',
                      properties: {
                        factor: { 
                          type: 'string',
                          description: 'The risk factor being evaluated (e.g., "Jurisdiction Type", "Shareholder Complexity")'
                        },
                        points_contribution: { 
                          type: 'number',
                          description: 'How many points this factor contributes to total score'
                        },
                        justification: { 
                          type: 'string',
                          description: 'Detailed explanation of why this factor contributes these points'
                        },
                        impact_level: { 
                          type: 'string', 
                          enum: ['low', 'medium', 'high'],
                          description: 'The impact level of this factor on overall risk'
                        }
                      },
                      required: ['factor', 'points_contribution', 'justification', 'impact_level']
                    }
                  },
                  key_concerns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of key concerns or red flags identified'
                  },
                  mitigating_factors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Positive factors that reduce risk'
                  },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Actionable recommendations to reduce the identified risks'
                  }
                },
                required: ['total_score', 'classification', 'reasoning', 'score_breakdown', 'recommendations'],
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
      riskScore = result.total_score;
      riskLevel = result.classification;
      
      // Format the detailed AI analysis with scoreBreakdown for calculation details
      const aiAnalysis = {
        reasoning: result.reasoning,
        scoreBreakdown: result.score_breakdown || [],
        keyConcerns: result.key_concerns || [],
        mitigatingFactors: result.mitigating_factors || [],
        recommendations: result.recommendations || [],
        // Keep legacy factors format for compatibility
        factors: (result.score_breakdown || []).map((item: any) => ({
          factor: item.factor,
          impact: item.impact_level,
          description: `${item.points_contribution} points - ${item.justification}`
        }))
      };
      
      calculationDetails = JSON.stringify(aiAnalysis);

    } else if (method === 'manual') {
      // For manual, return placeholder - will be handled by frontend
      return new Response(JSON.stringify({
        requiresManualInput: true,
        message: 'Manual assessment requires user input for risk factors'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else if (method === 'hybrid') {
      // Hybrid: Run both rule-based and AI calculations, then combine
      
      // 1. Rule-based calculation
      const appData = application.application_data;
      const calculationBreakdown: Array<{factor: string, points: number}> = [];
      let ruleScore = 0;

      // Mainland/Freezone (0-20 points)
      if (appData.mainland_or_freezone === 'freezone') {
        ruleScore += 5;
        calculationBreakdown.push({factor: 'Freezone jurisdiction', points: 5});
      } else {
        ruleScore += 15;
        calculationBreakdown.push({factor: 'Mainland jurisdiction', points: 15});
      }

      // Number of shareholders (0-25 points)
      const shareholders = appData.number_of_shareholders || 1;
      if (shareholders === 1) {
        ruleScore += 5;
        calculationBreakdown.push({factor: '1 Shareholder', points: 5});
      } else if (shareholders === 2) {
        ruleScore += 10;
        calculationBreakdown.push({factor: '2 Shareholders', points: 10});
      } else if (shareholders <= 5) {
        ruleScore += 15;
        calculationBreakdown.push({factor: `${shareholders} Shareholders`, points: 15});
      } else {
        ruleScore += 25;
        calculationBreakdown.push({factor: `${shareholders} Shareholders (high complexity)`, points: 25});
      }

      // Signatory type (0-15 points)
      if (appData.signatory_type === 'single') {
        ruleScore += 5;
        calculationBreakdown.push({factor: 'Single Signatory', points: 5});
      } else {
        ruleScore += 15;
        calculationBreakdown.push({factor: 'Joint Signatory', points: 15});
      }

      // Annual turnover (0-20 points)
      const turnover = application.customer?.annual_turnover || 0;
      if (turnover < 500000) {
        ruleScore += 5;
        calculationBreakdown.push({factor: 'Turnover <500K', points: 5});
      } else if (turnover < 2000000) {
        ruleScore += 10;
        calculationBreakdown.push({factor: 'Turnover 500K-2M', points: 10});
      } else if (turnover < 5000000) {
        ruleScore += 15;
        calculationBreakdown.push({factor: 'Turnover 2M-5M', points: 15});
      } else {
        ruleScore += 20;
        calculationBreakdown.push({factor: 'Turnover >5M', points: 20});
      }

      // Minimum balance (0-20 points)
      const balanceRange = appData.minimum_balance_range;
      if (balanceRange === '0-10k') {
        ruleScore += 5;
        calculationBreakdown.push({factor: 'Min Balance 0-10K', points: 5});
      } else if (balanceRange === '10k-100k') {
        ruleScore += 10;
        calculationBreakdown.push({factor: 'Min Balance 10K-100K', points: 10});
      } else if (balanceRange === '100k-150k') {
        ruleScore += 15;
        calculationBreakdown.push({factor: 'Min Balance 100K-150K', points: 15});
      } else {
        ruleScore += 20;
        calculationBreakdown.push({factor: 'Min Balance >150K', points: 20});
      }

      // 2. AI calculation
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

      const customer = application.customer;
      const systemPrompt = `You are a banking compliance risk analyst specializing in UAE bank account opening.

Analyze the application and provide:
1. A risk score (0-100) where:
   - 0-33 = Low Risk
   - 34-66 = Medium Risk  
   - 67-100 = High Risk

2. For each risk factor you identify, calculate specific point contributions that sum to your total score.

3. Explain how each factor contributes points to the final score with clear justification.

4. Provide actionable recommendations to reduce the identified risks.

Be specific about point allocation - the factors must add up to your total score.`;

      const prompt = `Analyze this bank account application for risk assessment:

Application Details:
- Jurisdiction: ${appData.mainland_or_freezone || 'N/A'}
- Number of Shareholders: ${appData.number_of_shareholders || 1}
- Signatory Type: ${appData.signatory_type || 'N/A'}
- Annual Turnover: ${customer?.annual_turnover || 0} AED
- Minimum Balance Range: ${appData.minimum_balance_range || 'N/A'}
- Business Activity: ${appData.business_activity_details || 'N/A'}
- Company Name: ${customer?.company || 'N/A'}

Provide a detailed risk assessment with specific point allocations for each factor.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'assess_risk',
              description: 'Return detailed risk assessment with point breakdown',
              parameters: {
                type: 'object',
                properties: {
                  total_score: { 
                    type: 'number', 
                    minimum: 0, 
                    maximum: 100,
                    description: 'Total risk score from 0-100'
                  },
                  classification: { 
                    type: 'string', 
                    enum: ['low', 'medium', 'high'],
                    description: 'Risk level classification'
                  },
                  reasoning: { 
                    type: 'string',
                    description: 'Overall reasoning for the risk assessment'
                  },
                  score_breakdown: {
                    type: 'array',
                    description: 'Detailed breakdown of how points were calculated for each factor',
                    items: {
                      type: 'object',
                      properties: {
                        factor: { 
                          type: 'string',
                          description: 'The risk factor being evaluated (e.g., "Jurisdiction Type", "Shareholder Complexity")'
                        },
                        points_contribution: { 
                          type: 'number',
                          description: 'How many points this factor contributes to total score'
                        },
                        justification: { 
                          type: 'string',
                          description: 'Detailed explanation of why this factor contributes these points'
                        },
                        impact_level: { 
                          type: 'string', 
                          enum: ['low', 'medium', 'high'],
                          description: 'The impact level of this factor on overall risk'
                        }
                      },
                      required: ['factor', 'points_contribution', 'justification', 'impact_level']
                    }
                  },
                  key_concerns: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of key concerns or red flags identified'
                  },
                  mitigating_factors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Positive factors that reduce risk'
                  },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Actionable recommendations to reduce the identified risks'
                  }
                },
                required: ['total_score', 'classification', 'reasoning', 'score_breakdown', 'recommendations'],
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

      const aiResult = JSON.parse(toolCall.function.arguments);
      
      // 3. Combine scores (50% each)
      const hybridScore = Math.round((ruleScore * 0.5) + (aiResult.total_score * 0.5));
      
      // Classify based on hybrid score
      if (hybridScore < 34) {
        riskLevel = 'low';
      } else if (hybridScore < 67) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'high';
      }
      
      riskScore = hybridScore;
      
      // Generate rule-based recommendations
      const ruleRecommendations: string[] = [];
      if (ruleScore >= 67) {
        ruleRecommendations.push('Consider simplifying the shareholder structure if possible');
        ruleRecommendations.push('Review and potentially adjust signatory requirements');
      } else if (ruleScore >= 34) {
        ruleRecommendations.push('Maintain detailed records of all business activities');
        ruleRecommendations.push('Ensure shareholder documentation is complete and verified');
      }
      
      // Combine recommendations from both methods
      const allRecommendations = [...new Set([...ruleRecommendations, ...(aiResult.recommendations || [])])];
      
      // Format hybrid calculation details
      const hybridDetails = {
        ruleBasedScore: ruleScore,
        aiScore: aiResult.total_score,
        calculationBreakdown: calculationBreakdown,
        aiAnalysis: {
          reasoning: aiResult.reasoning,
          scoreBreakdown: aiResult.score_breakdown || [],
          keyConcerns: aiResult.key_concerns || [],
          mitigatingFactors: aiResult.mitigating_factors || [],
          factors: (aiResult.score_breakdown || []).map((item: any) => ({
            factor: item.factor,
            impact: item.impact_level,
            description: `${item.points_contribution} points - ${item.justification}`
          }))
        },
        recommendations: allRecommendations
      };
      
      calculationDetails = JSON.stringify(hybridDetails);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClassificationData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ClassificationInput {
  industry: ClassificationData[];
  nationality: ClassificationData[];
  leadSource: ClassificationData[];
  jurisdiction: ClassificationData[];
  totalCustomers: number;
  totalRevenue: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { classifications, totalCustomers, totalRevenue }: { 
      classifications: ClassificationInput; 
      totalCustomers: number; 
      totalRevenue: number;
    } = await req.json();

    console.log('Analyzing customer classifications:', { 
      industries: classifications.industry.length,
      nationalities: classifications.nationality.length,
      totalCustomers,
      totalRevenue 
    });

    const systemPrompt = `You are an expert business analyst specializing in customer segmentation, market analysis, and revenue optimization for corporate services companies in the UAE/GCC region.

Analyze the provided customer classification data and provide detailed, actionable insights. Focus on:
1. Industry patterns (Real Estate, Gold & Diamonds, Trading, etc.)
2. Nationality/demographic distribution
3. Revenue concentration and diversification
4. Channel/lead source effectiveness
5. Growth opportunities and risks

Your analysis should be specific to UAE business context including free zones, mainland companies, and regional market dynamics.`;

    const userPrompt = `Analyze this customer classification data for a UAE corporate services company:

## Industry Distribution:
${classifications.industry.map(i => `- ${i.name}: ${i.count} customers (${i.percentage}%), Revenue: AED ${i.revenue.toLocaleString()}`).join('\n')}

## Nationality Distribution:
${classifications.nationality.map(n => `- ${n.name}: ${n.count} customers (${n.percentage}%), Revenue: AED ${n.revenue.toLocaleString()}`).join('\n')}

## Lead Source Performance:
${classifications.leadSource.map(l => `- ${l.name}: ${l.count} customers, Revenue: AED ${l.revenue.toLocaleString()}, Avg: AED ${l.count > 0 ? Math.round(l.revenue / l.count).toLocaleString() : 0}`).join('\n')}

## Jurisdiction Distribution:
${classifications.jurisdiction.map(j => `- ${j.name}: ${j.count} customers (${j.percentage}%)`).join('\n')}

## Summary:
- Total Customers: ${totalCustomers}
- Total Revenue: AED ${totalRevenue.toLocaleString()}
- Average Customer Value: AED ${totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers).toLocaleString() : 0}

Provide comprehensive analysis with insights, reasons, action plans, and recommendations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_classification_analysis',
            description: 'Provide detailed customer classification analysis with insights, reasons, actions, and recommendations',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'object',
                  properties: {
                    headline: { type: 'string', description: 'One-line summary of the overall customer portfolio' },
                    healthScore: { type: 'number', description: 'Portfolio health score from 0-100' },
                    keyStrength: { type: 'string', description: 'Main strength of the customer base' },
                    keyRisk: { type: 'string', description: 'Main risk to address' }
                  },
                  required: ['headline', 'healthScore', 'keyStrength', 'keyRisk']
                },
                industryInsights: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      industry: { type: 'string' },
                      insight: { type: 'string', description: 'Key insight about this industry segment' },
                      reason: { type: 'string', description: 'Why this pattern exists' },
                      opportunity: { type: 'string', description: 'Growth opportunity in this segment' },
                      risk: { type: 'string', description: 'Risk associated with this segment' },
                      revenueImpact: { type: 'string', enum: ['high', 'medium', 'low'] }
                    },
                    required: ['industry', 'insight', 'reason', 'opportunity', 'risk', 'revenueImpact']
                  }
                },
                nationalityInsights: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      nationality: { type: 'string' },
                      insight: { type: 'string' },
                      culturalConsideration: { type: 'string', description: 'Cultural or market-specific consideration' },
                      growthPotential: { type: 'string', enum: ['high', 'medium', 'low'] }
                    },
                    required: ['nationality', 'insight', 'culturalConsideration', 'growthPotential']
                  }
                },
                channelAnalysis: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      channel: { type: 'string' },
                      effectiveness: { type: 'string', enum: ['excellent', 'good', 'average', 'poor'] },
                      reason: { type: 'string' },
                      recommendation: { type: 'string' }
                    },
                    required: ['channel', 'effectiveness', 'reason', 'recommendation']
                  }
                },
                actionPlan: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      priority: { type: 'number', description: 'Priority 1-5, with 1 being highest' },
                      action: { type: 'string', description: 'Specific action to take' },
                      expectedImpact: { type: 'string', description: 'Expected business impact' },
                      timeline: { type: 'string', description: 'Suggested timeline' },
                      resources: { type: 'string', description: 'Resources needed' }
                    },
                    required: ['priority', 'action', 'expectedImpact', 'timeline', 'resources']
                  }
                },
                recommendations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      rationale: { type: 'string', description: 'Why this recommendation matters' },
                      impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                      effort: { type: 'string', enum: ['high', 'medium', 'low'] },
                      category: { type: 'string', enum: ['revenue', 'diversification', 'retention', 'acquisition', 'efficiency'] }
                    },
                    required: ['title', 'description', 'rationale', 'impact', 'effort', 'category']
                  }
                },
                revenueOptimization: {
                  type: 'object',
                  properties: {
                    growthSegments: { 
                      type: 'array', 
                      items: { type: 'string' },
                      description: 'Segments to prioritize for growth'
                    },
                    optimizeSegments: { 
                      type: 'array', 
                      items: { type: 'string' },
                      description: 'Segments to optimize/improve'
                    },
                    reduceRiskSegments: { 
                      type: 'array', 
                      items: { type: 'string' },
                      description: 'Segments where risk should be reduced'
                    },
                    potentialRevenueIncrease: { type: 'string', description: 'Estimated potential revenue increase if recommendations followed' }
                  },
                  required: ['growthSegments', 'optimizeSegments', 'reduceRiskSegments', 'potentialRevenueIncrease']
                }
              },
              required: ['summary', 'industryInsights', 'nationalityInsights', 'channelAnalysis', 'actionPlan', 'recommendations', 'revenueOptimization']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_classification_analysis' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error('No analysis generated from AI');
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log('Analysis parsed successfully:', { 
      hasIndustryInsights: analysis.industryInsights?.length > 0,
      hasActionPlan: analysis.actionPlan?.length > 0,
      hasRecommendations: analysis.recommendations?.length > 0
    });

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-customer-classifications:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

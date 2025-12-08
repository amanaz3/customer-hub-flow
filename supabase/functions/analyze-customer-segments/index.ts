import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { segments, totalCustomers, totalRevenue } = await req.json();
    
    console.log('Analyzing customer segments:', {
      segmentCount: segments?.length,
      totalCustomers,
      totalRevenue
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are a customer analytics expert for a UAE-based corporate services company. Analyze these customer segments:

SEGMENTS DATA:
${JSON.stringify(segments, null, 2)}

SUMMARY:
- Total Customers: ${totalCustomers}
- Total Revenue: AED ${totalRevenue?.toLocaleString()}

Provide analysis in this exact JSON structure:
{
  "summary": "2-3 sentence executive summary of customer segment health",
  "segmentInsights": [
    {
      "segment": "segment name",
      "health": "healthy|attention|critical",
      "reason": "why this health status",
      "opportunity": "growth opportunity for this segment",
      "risk": "potential risk if any"
    }
  ],
  "retentionStrategies": [
    {
      "segment": "target segment",
      "strategy": "specific retention strategy",
      "expectedImpact": "high|medium|low",
      "timeline": "immediate|short-term|long-term"
    }
  ],
  "upsellOpportunities": [
    {
      "fromSegment": "source segment",
      "toSegment": "target segment",
      "action": "specific upsell action",
      "potentialRevenue": "estimated revenue impact"
    }
  ],
  "actionPlan": [
    {
      "priority": 1,
      "action": "specific action to take",
      "targetSegment": "which segment",
      "expectedOutcome": "what will improve"
    }
  ],
  "revenueOptimization": {
    "focusAreas": ["area1", "area2"],
    "quickWins": ["quick win 1", "quick win 2"],
    "longTermStrategies": ["strategy 1", "strategy 2"]
  },
  "warnings": [
    {
      "type": "churn|revenue|engagement",
      "message": "warning message",
      "affectedSegments": ["segment1"],
      "urgency": "high|medium|low"
    }
  ]
}

Focus on:
1. Segment health and movement patterns
2. Revenue concentration risks
3. Upsell and cross-sell opportunities between segments
4. Retention priorities for at-risk segments
5. Growth strategies for high-potential segments`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a customer analytics expert. Always respond with valid JSON only, no markdown.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    console.log('AI response received');

    // Parse the JSON response
    let analysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysis = {
        summary: "Analysis completed but response parsing failed. Please try again.",
        segmentInsights: [],
        retentionStrategies: [],
        upsellOpportunities: [],
        actionPlan: [],
        revenueOptimization: { focusAreas: [], quickWins: [], longTermStrategies: [] },
        warnings: []
      };
    }

    console.log('Analysis parsed successfully');

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-customer-segments:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      summary: "Analysis failed. Please try again.",
      segmentInsights: [],
      retentionStrategies: [],
      upsellOpportunities: [],
      actionPlan: [],
      revenueOptimization: { focusAreas: [], quickWins: [], longTermStrategies: [] },
      warnings: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

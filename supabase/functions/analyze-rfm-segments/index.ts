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
    const { segments, stats, customers } = await req.json();
    
    console.log('Analyzing RFM segments:', {
      segmentCount: segments?.length,
      totalCustomers: stats?.totalCustomers,
      totalRevenue: stats?.totalRevenue
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Prepare segment summary for AI
    const segmentSummary = segments?.map((s: any) => ({
      name: s.name,
      customerCount: s.customers?.length || 0,
      totalRevenue: s.customers?.reduce((sum: number, c: any) => sum + (c.monetary || 0), 0) || 0,
      avgRecency: s.customers?.length > 0 
        ? Math.round(s.customers.reduce((sum: number, c: any) => sum + (c.recency || 0), 0) / s.customers.length) 
        : 0,
      avgFrequency: s.customers?.length > 0 
        ? (s.customers.reduce((sum: number, c: any) => sum + (c.frequency || 0), 0) / s.customers.length).toFixed(1) 
        : 0,
      description: s.description,
      suggestedAction: s.action
    })) || [];

    const prompt = `You are an RFM (Recency, Frequency, Monetary) analysis expert for a UAE-based corporate services company. Analyze these RFM segments:

RFM SEGMENTS DATA:
${JSON.stringify(segmentSummary, null, 2)}

OVERALL STATS:
- Total Customers: ${stats?.totalCustomers || 0}
- Total Revenue: AED ${(stats?.totalRevenue || 0).toLocaleString()}
- Average Recency: ${stats?.avgRecency || 0} days
- Average Frequency: ${stats?.avgFrequency || 0}
- Champions Revenue %: ${stats?.championsPercent || 0}%

Provide analysis in this exact JSON structure:
{
  "summary": "2-3 sentence executive summary of RFM health and key insights",
  "rfmHealthScore": 75,
  "segmentAnalysis": [
    {
      "segment": "segment name",
      "status": "thriving|stable|declining|critical",
      "keyInsight": "main insight about this segment",
      "movementTrend": "growing|stable|shrinking",
      "actionRequired": "specific action needed"
    }
  ],
  "migrationStrategies": [
    {
      "fromSegment": "source segment",
      "toSegment": "target segment",
      "strategy": "how to move customers",
      "effort": "high|medium|low",
      "impact": "high|medium|low"
    }
  ],
  "recencyInsights": {
    "status": "healthy|concerning|critical",
    "insight": "analysis of recency patterns",
    "recommendation": "what to do about recency"
  },
  "frequencyInsights": {
    "status": "healthy|concerning|critical", 
    "insight": "analysis of frequency patterns",
    "recommendation": "what to do about frequency"
  },
  "monetaryInsights": {
    "status": "healthy|concerning|critical",
    "insight": "analysis of monetary patterns",
    "recommendation": "what to do about monetary"
  },
  "prioritizedActions": [
    {
      "priority": 1,
      "action": "specific action",
      "targetSegment": "which segment",
      "expectedROI": "high|medium|low",
      "timeline": "immediate|1-2 weeks|1 month+"
    }
  ],
  "churnRiskAnalysis": {
    "highRiskSegments": ["segment1", "segment2"],
    "atRiskRevenue": "AED X",
    "preventionStrategies": ["strategy1", "strategy2"]
  },
  "growthOpportunities": [
    {
      "opportunity": "description",
      "targetSegment": "segment name",
      "potentialImpact": "AED X or X% increase"
    }
  ]
}

Focus on:
1. RFM score distribution and health
2. Segment migration paths (how to move customers up)
3. Churn risk and prevention
4. Revenue concentration (is too much dependent on few segments?)
5. Actionable strategies for each R, F, M dimension`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an RFM analytics expert. Always respond with valid JSON only, no markdown.' },
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
        rfmHealthScore: 0,
        segmentAnalysis: [],
        migrationStrategies: [],
        recencyInsights: { status: "unknown", insight: "", recommendation: "" },
        frequencyInsights: { status: "unknown", insight: "", recommendation: "" },
        monetaryInsights: { status: "unknown", insight: "", recommendation: "" },
        prioritizedActions: [],
        churnRiskAnalysis: { highRiskSegments: [], atRiskRevenue: "Unknown", preventionStrategies: [] },
        growthOpportunities: []
      };
    }

    console.log('RFM Analysis parsed successfully');

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-rfm-segments:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      summary: "Analysis failed. Please try again.",
      rfmHealthScore: 0,
      segmentAnalysis: [],
      migrationStrategies: [],
      recencyInsights: { status: "unknown", insight: "", recommendation: "" },
      frequencyInsights: { status: "unknown", insight: "", recommendation: "" },
      monetaryInsights: { status: "unknown", insight: "", recommendation: "" },
      prioritizedActions: [],
      churnRiskAnalysis: { highRiskSegments: [], atRiskRevenue: "Unknown", preventionStrategies: [] },
      growthOpportunities: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

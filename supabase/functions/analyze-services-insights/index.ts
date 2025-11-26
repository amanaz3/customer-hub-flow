import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductUsage {
  product_name: string;
  usage_count: number;
  percentage: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productUsage, totalApplications } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are a business analyst specializing in fintech and corporate services. Analyze the following product/service usage data and provide comprehensive insights.

PRODUCT USAGE DATA:
${productUsage.map((p: ProductUsage, i: number) => `${i + 1}. ${p.product_name}: ${p.usage_count} applications (${p.percentage}%)`).join('\n')}

Total Applications: ${totalApplications}

Provide a detailed analysis in the following JSON structure. Be specific, actionable, and data-driven:

{
  "marketInsights": {
    "summary": "2-3 sentence overview of the product portfolio performance",
    "topPerformers": ["list of top 3 performing products with brief reasoning"],
    "underperformers": ["products needing attention with reasoning"],
    "marketTrends": ["3-4 observed trends based on the data"]
  },
  "actionPlan": {
    "immediate": [
      {"action": "specific action", "priority": "high/medium/low", "expectedImpact": "brief impact description"}
    ],
    "shortTerm": [
      {"action": "specific action", "timeline": "1-3 months", "resources": "what's needed"}
    ],
    "longTerm": [
      {"action": "specific action", "timeline": "3-12 months", "strategicGoal": "alignment"}
    ]
  },
  "salesStrategy": {
    "focusProducts": ["products to prioritize for sales push"],
    "crossSellOpportunities": [
      {"from": "product A", "to": "product B", "rationale": "why this makes sense"}
    ],
    "bundlingRecommendations": [
      {"products": ["product list"], "targetSegment": "who to target", "value": "value proposition"}
    ],
    "pricingInsights": ["observations about pricing strategy"]
  },
  "salesInsights": {
    "conversionTips": ["3-4 specific tips to improve conversion"],
    "customerSegments": [
      {"segment": "segment name", "preferredProducts": ["products"], "approach": "how to engage"}
    ],
    "objectionHandling": [
      {"objection": "common objection", "response": "suggested response"}
    ],
    "upsellTriggers": ["signals that indicate upsell opportunity"]
  },
  "riskAssessment": {
    "concentrationRisk": "analysis of over-reliance on specific products",
    "diversificationScore": "low/medium/high with explanation",
    "recommendations": ["risk mitigation suggestions"]
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert business analyst. Always respond with valid JSON only, no markdown formatting." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response, handling potential markdown code blocks
    let insights;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      insights = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      insights,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-services-insights:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

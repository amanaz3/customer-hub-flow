import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TeamMember {
  user_id: string;
  user_name: string;
  user_email: string;
  target_applications: number;
  actual_applications: number;
  target_revenue: number;
  actual_revenue: number;
  target_completed: number;
  actual_completed: number;
  completion_rate: number;
}

interface AnalysisRequest {
  teamData: TeamMember[];
  period: string;
  periodType: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamData, period, periodType }: AnalysisRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate team metrics
    const teamTotals = teamData.reduce(
      (acc, member) => ({
        target_applications: acc.target_applications + member.target_applications,
        actual_applications: acc.actual_applications + member.actual_applications,
        target_revenue: acc.target_revenue + member.target_revenue,
        actual_revenue: acc.actual_revenue + member.actual_revenue,
      }),
      { target_applications: 0, actual_applications: 0, target_revenue: 0, actual_revenue: 0 }
    );

    const teamAppProgress = teamTotals.target_applications > 0
      ? (teamTotals.actual_applications / teamTotals.target_applications) * 100
      : 0;

    const teamRevenueProgress = teamTotals.target_revenue > 0
      ? (teamTotals.actual_revenue / teamTotals.target_revenue) * 100
      : 0;

    // Identify performance categories
    const highPerformers = teamData.filter(m => {
      const progress = m.target_applications > 0 ? (m.actual_applications / m.target_applications) * 100 : 0;
      return progress >= 80;
    });

    const atRisk = teamData.filter(m => {
      const progress = m.target_applications > 0 ? (m.actual_applications / m.target_applications) * 100 : 0;
      return progress < 50 && progress > 0;
    });

    const needsAttention = teamData.filter(m => {
      const progress = m.target_applications > 0 ? (m.actual_applications / m.target_applications) * 100 : 0;
      return progress === 0;
    });

    const systemPrompt = `You are an expert performance analyst for a business team. Analyze team performance data and provide specific, actionable recommendations. Focus on:
- Identifying blockers and delays
- Suggesting concrete actions to improve progress
- Highlighting collaboration opportunities between team members
- Recognizing patterns in performance data
- Providing prioritized recommendations

Be direct, specific, and actionable. Use the team member names when making recommendations.`;

    const userPrompt = `Analyze this team's performance for ${periodType} period ${period}:

**Team Overview:**
- Total Team Members: ${teamData.length}
- Applications Progress: ${teamTotals.actual_applications}/${teamTotals.target_applications} (${Math.round(teamAppProgress)}%)
- Revenue Progress: ${teamTotals.actual_revenue}/${teamTotals.target_revenue} (${Math.round(teamRevenueProgress)}%)

**High Performers (≥80% progress):**
${highPerformers.map(m => `- ${m.user_name}: ${m.actual_applications}/${m.target_applications} applications (${Math.round((m.actual_applications / m.target_applications) * 100)}%)`).join('\n')}

**At Risk (<50% progress):**
${atRisk.map(m => `- ${m.user_name}: ${m.actual_applications}/${m.target_applications} applications (${Math.round((m.actual_applications / m.target_applications) * 100)}%)`).join('\n')}

**Needs Immediate Attention (0% progress):**
${needsAttention.map(m => `- ${m.user_name}: ${m.actual_applications}/${m.target_applications} applications`).join('\n')}

**Individual Performance Details:**
${teamData.map(m => {
  const appProgress = m.target_applications > 0 ? (m.actual_applications / m.target_applications) * 100 : 0;
  const revProgress = m.target_revenue > 0 ? (m.actual_revenue / m.target_revenue) * 100 : 0;
  return `- ${m.user_name}:
  * Applications: ${m.actual_applications}/${m.target_applications} (${Math.round(appProgress)}%)
  * Revenue: ${m.actual_revenue}/${m.target_revenue} (${Math.round(revProgress)}%)
  * Completion Rate: ${Math.round(m.completion_rate)}%`;
}).join('\n')}

Provide comprehensive recommendations covering:
1. Key Insights - What's the overall situation?
2. Immediate Actions - What should be done right now?
3. Blockers & Risks - What might be preventing progress?
4. Collaboration Opportunities - Who should work together?
5. Individual Focus Areas - Specific guidance for team members needing support`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "provide_recommendations",
            description: "Provide structured performance analysis and recommendations",
            parameters: {
              type: "object",
              properties: {
                key_insights: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 key insights about overall team performance"
                },
                immediate_actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      who: { type: "string", description: "Who should take this action" }
                    },
                    required: ["action", "priority", "who"]
                  },
                  description: "Top 3-5 immediate actions needed"
                },
                blockers_and_risks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      blocker: { type: "string" },
                      affected_members: { type: "array", items: { type: "string" } },
                      mitigation: { type: "string" }
                    },
                    required: ["blocker", "affected_members", "mitigation"]
                  },
                  description: "Identified blockers and risk factors"
                },
                collaboration_opportunities: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      members: { type: "array", items: { type: "string" } },
                      reason: { type: "string" },
                      expected_impact: { type: "string" }
                    },
                    required: ["members", "reason", "expected_impact"]
                  },
                  description: "Opportunities for team members to collaborate"
                },
                individual_guidance: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      member_name: { type: "string" },
                      guidance: { type: "string" },
                      support_needed: { type: "string" }
                    },
                    required: ["member_name", "guidance", "support_needed"]
                  },
                  description: "Specific guidance for individuals needing support"
                }
              },
              required: ["key_insights", "immediate_actions", "blockers_and_risks", "collaboration_opportunities"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "provide_recommendations" } }
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices[0].message.tool_calls[0];
    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-team-performance:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

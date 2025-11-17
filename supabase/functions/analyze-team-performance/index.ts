import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamMember {
  id: string;
  name: string;
  email: string;
  applicationCount: number;
  applications: Array<{
    id: string;
    reference_number: number;
    status: string;
    created_at: string;
    updated_at: string;
    statusChanges?: Array<{
      previous_status: string;
      new_status: string;
      created_at: string;
    }>;
  }>;
}

interface AnalysisRequest {
  teamData: TeamMember;
  period: string;
  periodType: 'weekly' | 'monthly' | 'quarterly';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamData, period, periodType }: AnalysisRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Analyzing team member:', teamData.name);

    // Calculate metrics
    const totalApps = teamData.applicationCount;
    const recentApps = teamData.applications.filter(app => {
      const daysSince = (Date.now() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    const statusDistribution = teamData.applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Identify potentially stuck applications (no status change in 7+ days)
    const stuckApps = teamData.applications.filter(app => {
      const daysSinceUpdate = (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 7 && !['completed', 'rejected', 'paid'].includes(app.status);
    });

    // Identify applications moving back and forth
    const bouncingApps = teamData.applications.filter(app => {
      if (!app.statusChanges || app.statusChanges.length < 3) return false;
      const changes = app.statusChanges;
      for (let i = 2; i < changes.length; i++) {
        if (changes[i].new_status === changes[i-2].previous_status) {
          return true;
        }
      }
      return false;
    });

    console.log('Metrics calculated:', { totalApps, recentApps, stuckApps: stuckApps.length, bouncingApps: bouncingApps.length });

    // Categorize performance
    const isHighPerformer = totalApps > 10 && recentApps > 5;
    const isAtRisk = stuckApps.length > 3 || (totalApps > 0 && stuckApps.length / totalApps > 0.3);
    const needsAttention = bouncingApps.length > 2;

    const systemPrompt = `You are an AI assistant analyzing team member performance in an application management system. Provide actionable insights about application progress, blockers, and recommendations.`;

    const userPrompt = `Analyze this team member's application performance:

Team Member: ${teamData.name}
Total Applications: ${totalApps}
Recent Applications (30 days): ${recentApps}

Status Distribution:
${Object.entries(statusDistribution).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

Potentially Stuck Applications: ${stuckApps.length}
${stuckApps.slice(0, 3).map(app => `- #${app.reference_number} (${app.status}, ${Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24))} days since update)`).join('\n')}

Applications Moving Back/Forth: ${bouncingApps.length}
${bouncingApps.slice(0, 3).map(app => `- #${app.reference_number} (multiple status reversals)`).join('\n')}

Performance Category:
- High Performer: ${isHighPerformer}
- At Risk: ${isAtRisk}
- Needs Attention: ${needsAttention}

Provide a comprehensive analysis with:
1. Overall performance summary
2. Immediate actions needed
3. Specific blockers identified
4. Collaboration opportunities
5. Individual guidance for the team member`;

    console.log('Calling AI gateway...');

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
                summary: {
                  type: "string",
                  description: "Brief performance summary (2-3 sentences)"
                },
                performanceLevel: {
                  type: "string",
                  enum: ["excellent", "good", "needs_improvement", "at_risk"],
                  description: "Overall performance assessment"
                },
                immediateActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      reason: { type: "string" }
                    }
                  },
                  description: "Prioritized actions to take now"
                },
                blockers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      blocker: { type: "string" },
                      affectedApps: { type: "array", items: { type: "number" } },
                      recommendation: { type: "string" }
                    }
                  },
                  description: "Identified blockers with specific applications affected"
                },
                collaborationOpportunities: {
                  type: "array",
                  items: { type: "string" },
                  description: "Ways team member could collaborate or get help"
                },
                individualGuidance: {
                  type: "string",
                  description: "Personalized advice for the team member"
                }
              },
              required: ["summary", "performanceLevel", "immediateActions", "blockers"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "provide_recommendations" } }
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received');
    
    const toolCall = aiResponse.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in AI response');
      throw new Error('No tool call in AI response');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);
    console.log('Recommendations parsed successfully');

    return new Response(
      JSON.stringify({
        ...recommendations,
        metrics: {
          totalApps,
          recentApps,
          stuckApps: stuckApps.length,
          bouncingApps: bouncingApps.length,
          statusDistribution
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-team-performance:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

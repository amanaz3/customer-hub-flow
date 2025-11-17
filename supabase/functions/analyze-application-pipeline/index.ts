import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StageMetrics {
  status: string;
  count: number;
  totalRevenue: number;
  avgTimeInStage: number;
  conversionRate: number;
  oldestApplication: string | null;
}

interface ApplicationData {
  id: string;
  reference_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  application_type: string;
  customer_id: string;
  customer?: {
    name: string;
    company: string;
    user_id: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all applications with customer data
    const { data: applications, error: appsError } = await supabase
      .from('account_applications')
      .select(`
        *,
        customer:customers(name, company, user_id)
      `)
      .order('created_at', { ascending: false });

    if (appsError) throw appsError;

    // Calculate stage metrics
    const stageOrder = ['draft', 'submitted', 'under_review', 'approved', 'paid', 'completed'];
    const stageMetrics: Record<string, StageMetrics> = {};
    const now = new Date();

    stageOrder.forEach(status => {
      const stageApps = applications.filter(app => app.status === status);
      const previousStageApps = applications.filter(app => {
        const idx = stageOrder.indexOf(app.status);
        const targetIdx = stageOrder.indexOf(status);
        return idx > targetIdx;
      });

      const totalRevenue = stageApps.reduce((sum, app) => {
        const customer = app.customer as any;
        return sum + (customer?.amount || 0);
      }, 0);

      const avgTime = stageApps.length > 0
        ? stageApps.reduce((sum, app) => {
            const created = new Date(app.created_at);
            const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / stageApps.length
        : 0;

      const conversionRate = stageApps.length > 0 && previousStageApps.length > 0
        ? (previousStageApps.length / (stageApps.length + previousStageApps.length)) * 100
        : 0;

      const oldest = stageApps.length > 0
        ? stageApps.reduce((oldest, app) => {
            return new Date(app.created_at) < new Date(oldest.created_at) ? app : oldest;
          })
        : null;

      stageMetrics[status] = {
        status,
        count: stageApps.length,
        totalRevenue,
        avgTimeInStage: avgTime,
        conversionRate,
        oldestApplication: oldest ? `#${oldest.reference_number}` : null,
      };
    });

    // Identify stuck applications (>7 days in non-completed stages)
    const stuckApps = applications.filter(app => {
      if (app.status === 'completed' || app.status === 'rejected') return false;
      const created = new Date(app.created_at);
      const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days > 7;
    });

    // Identify at-risk applications (>14 days)
    const atRiskApps = applications.filter(app => {
      if (app.status === 'completed' || app.status === 'rejected') return false;
      const created = new Date(app.created_at);
      const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days > 14;
    });

    // Calculate bottlenecks
    const bottlenecks = Object.entries(stageMetrics)
      .filter(([status, metrics]) => 
        metrics.avgTimeInStage > 5 && metrics.count > 3 && status !== 'completed'
      )
      .map(([status, metrics]) => ({
        stage: status,
        count: metrics.count,
        avgDays: Math.round(metrics.avgTimeInStage),
      }));

    const systemPrompt = `You are an expert business process analyst specializing in application workflow optimization. Analyze pipeline data and provide specific, actionable recommendations. Focus on:
- Identifying bottlenecks causing delays
- Detecting applications at risk of missing targets
- Suggesting process improvements for each stage
- Providing resource allocation recommendations
- Highlighting conversion rate issues

Be direct, specific, and actionable. Reference specific application numbers and stages.`;

    const userPrompt = `Analyze this application pipeline:

**Pipeline Overview:**
${stageOrder.map(status => {
  const metrics = stageMetrics[status];
  return `- ${status.toUpperCase()}: ${metrics.count} applications (avg ${Math.round(metrics.avgTimeInStage)} days in stage)`;
}).join('\n')}

**Total Active Applications:** ${applications.filter(a => a.status !== 'completed' && a.status !== 'rejected').length}
**Completed:** ${stageMetrics['completed']?.count || 0}
**Rejected:** ${applications.filter(a => a.status === 'rejected').length}

**Bottlenecks Detected:**
${bottlenecks.length > 0 
  ? bottlenecks.map(b => `- ${b.stage}: ${b.count} apps stuck for avg ${b.avgDays} days`).join('\n')
  : '- No major bottlenecks detected'}

**Stuck Applications (>7 days):**
${stuckApps.length > 0
  ? stuckApps.slice(0, 10).map(app => {
      const days = Math.round((now.getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return `- #${app.reference_number} (${app.status}) - ${days} days old`;
    }).join('\n')
  : '- None'}

**At Risk (>14 days):**
${atRiskApps.length > 0
  ? atRiskApps.slice(0, 5).map(app => {
      const days = Math.round((now.getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return `- #${app.reference_number} (${app.status}) - ${days} days old`;
    }).join('\n')
  : '- None'}

**Conversion Analysis:**
${stageOrder.slice(0, -1).map((status, idx) => {
  const current = stageMetrics[status];
  const next = stageMetrics[stageOrder[idx + 1]];
  const rate = current.count > 0 ? ((next?.count || 0) / current.count * 100).toFixed(1) : '0';
  return `- ${status} → ${stageOrder[idx + 1]}: ${rate}%`;
}).join('\n')}

Provide comprehensive recommendations covering:
1. Critical Bottlenecks - Which stages are causing the most delay?
2. Immediate Actions - What should be done right now?
3. At-Risk Applications - Which specific apps need urgent attention?
4. Process Improvements - How can each stage be optimized?
5. Resource Allocation - Where should team focus their efforts?
6. Predictions - What are the likely outcomes if current trends continue?`;

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
            name: "provide_pipeline_analysis",
            description: "Provide structured pipeline analysis and recommendations",
            parameters: {
              type: "object",
              properties: {
                critical_bottlenecks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      stage: { type: "string" },
                      severity: { type: "string", enum: ["high", "medium", "low"] },
                      issue: { type: "string" },
                      impact: { type: "string" }
                    },
                    required: ["stage", "severity", "issue", "impact"]
                  },
                  description: "Critical bottlenecks in the pipeline"
                },
                immediate_actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      priority: { type: "string", enum: ["urgent", "high", "medium"] },
                      stage: { type: "string" },
                      expected_impact: { type: "string" }
                    },
                    required: ["action", "priority", "stage", "expected_impact"]
                  },
                  description: "Immediate actions needed"
                },
                at_risk_applications: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      application_ref: { type: "string" },
                      risk_level: { type: "string", enum: ["critical", "high", "medium"] },
                      reason: { type: "string" },
                      recommendation: { type: "string" }
                    },
                    required: ["application_ref", "risk_level", "reason", "recommendation"]
                  },
                  description: "Applications at risk"
                },
                process_improvements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      stage: { type: "string" },
                      improvement: { type: "string" },
                      expected_benefit: { type: "string" },
                      implementation_difficulty: { type: "string", enum: ["easy", "medium", "hard"] }
                    },
                    required: ["stage", "improvement", "expected_benefit", "implementation_difficulty"]
                  },
                  description: "Stage-specific process improvements"
                },
                resource_allocation: {
                  type: "object",
                  properties: {
                    high_priority_stages: { type: "array", items: { type: "string" } },
                    rationale: { type: "string" },
                    suggested_actions: { type: "array", items: { type: "string" } }
                  },
                  required: ["high_priority_stages", "rationale", "suggested_actions"]
                },
                predictions: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 predictions about pipeline trends"
                }
              },
              required: ["critical_bottlenecks", "immediate_actions", "process_improvements", "predictions"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "provide_pipeline_analysis" } }
    };

    console.log("Calling AI with pipeline data...");
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
    console.log("AI response received");
    const toolCall = aiResponse.choices[0].message.tool_calls[0];
    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ 
        analysis,
        metrics: stageMetrics,
        summary: {
          totalActive: applications.filter(a => a.status !== 'completed' && a.status !== 'rejected').length,
          totalCompleted: stageMetrics['completed']?.count || 0,
          totalRejected: applications.filter(a => a.status === 'rejected').length,
          stuckCount: stuckApps.length,
          atRiskCount: atRiskApps.length,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-application-pipeline:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

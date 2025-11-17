import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    console.log("Fetching active applications...");

    // Fetch active applications (not completed or rejected)
    const { data: activeApps, error: activeError } = await supabase
      .from('account_applications')
      .select(`
        id,
        reference_number,
        status,
        created_at,
        updated_at,
        application_type,
        customers!inner(name, company, user_id)
      `)
      .not('status', 'in', '("completed","rejected")')
      .order('updated_at', { ascending: false });

    if (activeError) throw activeError;

    console.log("Fetching recent status changes...");

    // Fetch recent status changes
    const { data: recentChanges, error: changesError } = await supabase
      .from('application_status_changes')
      .select(`
        id,
        application_id,
        previous_status,
        new_status,
        created_at,
        account_applications!inner(
          reference_number,
          customers!inner(name, company)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (changesError) throw changesError;

    console.log("Analyzing application data...");

    const now = new Date();
    
    // Calculate stuck applications (>7 days)
    const stuckApps = activeApps?.filter(app => {
      const created = new Date(app.created_at);
      const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days > 7;
    }) || [];

    // Calculate at-risk applications (>14 days)
    const atRiskApps = activeApps?.filter(app => {
      const created = new Date(app.created_at);
      const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return days > 14;
    }) || [];

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    activeApps?.forEach(app => {
      statusDistribution[app.status] = (statusDistribution[app.status] || 0) + 1;
    });

    // Recent activity patterns
    const recentActivity = recentChanges?.slice(0, 10).map(change => ({
      reference: (change.account_applications as any).reference_number,
      from: change.previous_status,
      to: change.new_status,
      time: change.created_at
    })) || [];

    // Prepare data for AI analysis
    const analysisData = {
      totalActive: activeApps?.length || 0,
      stuckCount: stuckApps.length,
      atRiskCount: atRiskApps.length,
      statusDistribution,
      recentActivity,
      stuckApplications: stuckApps.slice(0, 5).map(app => ({
        reference: app.reference_number,
        status: app.status,
        daysInProcess: Math.floor((now.getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        customer: (app.customers as any).company
      })),
      atRiskApplications: atRiskApps.slice(0, 5).map(app => ({
        reference: app.reference_number,
        status: app.status,
        daysInProcess: Math.floor((now.getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        customer: (app.customers as any).company
      }))
    };

    console.log("Calling Lovable AI for insights...");

    const prompt = `You are an expert application monitoring analyst. Analyze the following real-time application data and provide actionable insights:

Current Status:
- Total Active Applications: ${analysisData.totalActive}
- Stuck Applications (>7 days): ${analysisData.stuckCount}
- At Risk Applications (>14 days): ${analysisData.atRiskCount}

Status Distribution:
${Object.entries(analysisData.statusDistribution).map(([status, count]) => `- ${status}: ${count}`).join('\n')}

Recent Activity (Last 10 changes):
${analysisData.recentActivity.map(a => `- App #${a.reference}: ${a.from} → ${a.to}`).join('\n')}

Stuck Applications:
${analysisData.stuckApplications.map(a => `- App #${a.reference} (${a.customer}): ${a.status} for ${a.daysInProcess} days`).join('\n')}

At-Risk Applications:
${analysisData.atRiskApplications.map(a => `- App #${a.reference} (${a.customer}): ${a.status} for ${a.daysInProcess} days`).join('\n')}

Provide a concise analysis including:
1. **Overall Health**: Brief assessment of the application pipeline health
2. **Critical Issues**: Top 2-3 urgent problems that need immediate attention
3. **Recommendations**: Specific actionable steps to improve processing times
4. **Trends**: Any patterns in recent activity that indicate systemic issues

Keep your response focused and actionable. Format with markdown for readability.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert application monitoring analyst. Provide concise, actionable insights about application processing bottlenecks and recommend improvements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    console.log("AI insights generated successfully");

    return new Response(
      JSON.stringify({
        insights,
        metrics: {
          totalActive: analysisData.totalActive,
          stuckCount: analysisData.stuckCount,
          atRiskCount: analysisData.atRiskCount,
          statusDistribution: analysisData.statusDistribution
        },
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in analyze-monitor-insights:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  period: number;
  periodType: string;
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

    console.log('Analyzing team targets:', { memberCount: teamData.length, period, periodType });

    // Calculate team-wide metrics
    const teamTotals = teamData.reduce(
      (acc, member) => ({
        target_applications: acc.target_applications + member.target_applications,
        actual_applications: acc.actual_applications + member.actual_applications,
        target_revenue: acc.target_revenue + member.target_revenue,
        actual_revenue: acc.actual_revenue + member.actual_revenue,
        target_completed: acc.target_completed + member.target_completed,
        actual_completed: acc.actual_completed + member.actual_completed,
      }),
      { target_applications: 0, actual_applications: 0, target_revenue: 0, actual_revenue: 0, target_completed: 0, actual_completed: 0 }
    );

    // Calculate progress percentages
    const appProgress = teamTotals.target_applications > 0 
      ? (teamTotals.actual_applications / teamTotals.target_applications) * 100 
      : 0;
    const revenueProgress = teamTotals.target_revenue > 0 
      ? (teamTotals.actual_revenue / teamTotals.target_revenue) * 100 
      : 0;
    const completionProgress = teamTotals.target_completed > 0 
      ? (teamTotals.actual_completed / teamTotals.target_completed) * 100 
      : 0;

    // Identify underperformers
    const underperformers = teamData.filter(member => {
      const memberAppProgress = member.target_applications > 0 
        ? (member.actual_applications / member.target_applications) * 100 
        : 0;
      return memberAppProgress < 50;
    });

    // Identify top performers
    const topPerformers = teamData.filter(member => {
      const memberAppProgress = member.target_applications > 0 
        ? (member.actual_applications / member.target_applications) * 100 
        : 0;
      return memberAppProgress >= 80;
    });

    // Identify members with completion rate issues
    const completionIssues = teamData.filter(member => 
      member.actual_applications > 0 && member.completion_rate < 0.5
    );

    console.log('Metrics calculated:', { 
      appProgress: appProgress.toFixed(1), 
      revenueProgress: revenueProgress.toFixed(1),
      underperformers: underperformers.length,
      topPerformers: topPerformers.length
    });

    const systemPrompt = `You are an AI assistant analyzing team performance against targets. Provide actionable insights, identify blockers, and suggest specific actions to improve team performance.`;

    const userPrompt = `Analyze this team's performance for ${periodType} period ${period}:

Team Size: ${teamData.length} members

Overall Progress:
- Applications: ${teamTotals.actual_applications}/${teamTotals.target_applications} (${appProgress.toFixed(1)}%)
- Revenue: AED ${teamTotals.actual_revenue.toLocaleString()}/${teamTotals.target_revenue.toLocaleString()} (${revenueProgress.toFixed(1)}%)
- Completed: ${teamTotals.actual_completed}/${teamTotals.target_completed} (${completionProgress.toFixed(1)}%)

Team Performance Distribution:
- Top Performers (≥80%): ${topPerformers.length} members
  ${topPerformers.slice(0, 3).map(m => `  • ${m.user_name}: ${((m.actual_applications / m.target_applications) * 100).toFixed(1)}%`).join('\n')}
  
- Underperformers (<50%): ${underperformers.length} members
  ${underperformers.slice(0, 3).map(m => `  • ${m.user_name}: ${((m.actual_applications / m.target_applications) * 100).toFixed(1)}% (${m.actual_applications}/${m.target_applications} apps)`).join('\n')}

- Members with Completion Rate Issues (<50%): ${completionIssues.length}
  ${completionIssues.slice(0, 3).map(m => `  • ${m.user_name}: ${(m.completion_rate * 100).toFixed(1)}% completion rate`).join('\n')}

Individual Member Details:
${teamData.slice(0, 10).map(m => `
${m.user_name}:
  - Applications: ${m.actual_applications}/${m.target_applications} (${((m.actual_applications / m.target_applications) * 100).toFixed(1)}%)
  - Revenue: AED ${m.actual_revenue.toLocaleString()}/${m.target_revenue.toLocaleString()} (${((m.actual_revenue / m.target_revenue) * 100).toFixed(1)}%)
  - Completion Rate: ${(m.completion_rate * 100).toFixed(1)}%
`).join('\n')}

Provide a comprehensive analysis with:
1. Key insights about overall team performance
2. Immediate actions needed (be specific, include who should take action)
3. Blockers and risks identified (with affected members and mitigation strategies)
4. Collaboration opportunities (which members should work together and why)
5. Individual guidance for underperformers (specific support needed)

Format the response as structured JSON with these exact keys:
{
  "key_insights": ["insight1", "insight2", ...],
  "immediate_actions": [
    {"action": "specific action", "priority": "high|medium|low", "who": "team member or role"}
  ],
  "blockers_and_risks": [
    {"blocker": "description", "affected_members": ["name1", "name2"], "mitigation": "strategy"}
  ],
  "collaboration_opportunities": [
    {"members": ["name1", "name2"], "reason": "why collaborate", "expected_impact": "impact description"}
  ],
  "individual_guidance": [
    {"member_name": "name", "guidance": "specific guidance", "support_needed": "what support"}
  ]
}`;

    console.log('Calling Lovable AI for team target analysis...');

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your Lovable workspace.');
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let recommendations;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = aiContent;
      
      // Try to extract from code blocks first
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      
      // Clean up any leading/trailing whitespace
      jsonString = jsonString.trim();
      
      // If starts with { and doesn't end with }, the response was truncated
      if (jsonString.startsWith('{') && !jsonString.endsWith('}')) {
        console.warn('JSON appears truncated, attempting to fix...');
        // Count open braces and brackets to try to close them
        let openBraces = (jsonString.match(/{/g) || []).length;
        let closeBraces = (jsonString.match(/}/g) || []).length;
        let openBrackets = (jsonString.match(/\[/g) || []).length;
        let closeBrackets = (jsonString.match(/\]/g) || []).length;
        
        // Add missing closing brackets and braces
        while (closeBrackets < openBrackets) {
          jsonString += ']';
          closeBrackets++;
        }
        while (closeBraces < openBraces) {
          jsonString += '}';
          closeBraces++;
        }
      }
      
      recommendations = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw AI response (first 500 chars):', aiContent.substring(0, 500));
      
      // Return a default structure if parsing fails
      recommendations = {
        key_insights: ['AI analysis could not be fully processed. Please try again.'],
        immediate_actions: [],
        blockers_and_risks: [],
        collaboration_opportunities: [],
        individual_guidance: []
      };
    }

    console.log('AI analysis complete');

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        metrics: {
          appProgress,
          revenueProgress,
          completionProgress,
          underperformerCount: underperformers.length,
          topPerformerCount: topPerformers.length,
          teamSize: teamData.length,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in analyze-team-targets:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to analyze team targets'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

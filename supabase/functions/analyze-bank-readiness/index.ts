import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, ruleResult } = await req.json();

    // Build the prompt for AI analysis
    const prompt = `You are a bank account readiness advisor for UAE businesses. Analyze this case and provide guidance.

## Case Details:
- Nationality: ${input.applicant_nationality}
- UAE Resident: ${input.uae_residency ? 'Yes' : 'No'}
- Company Jurisdiction: ${input.company_jurisdiction}
- License Activity: ${input.license_activity}
- Business Model: ${input.business_model}
- Expected Monthly Inflow: ${input.expected_monthly_inflow}
- Source of Funds: ${input.source_of_funds}
${input.source_of_funds_notes ? `- Source of Funds Notes: ${input.source_of_funds_notes}` : ''}
- Incoming Payment Countries: ${input.incoming_payment_countries.join(', ')}
- Previous Bank Rejection: ${input.previous_rejection ? 'Yes' : 'No'}
${input.previous_rejection_notes ? `- Rejection Details: ${input.previous_rejection_notes}` : ''}

## Rule-Based Assessment:
- Risk Score: ${ruleResult.score}/100
- Risk Category: ${ruleResult.category.toUpperCase()}
- Risk Flags: ${ruleResult.flags.join('; ')}

## Your Task:
1. Provide a plain-language explanation of why this case has this risk level. Be specific about which factors contribute most to the risk.

2. List 3-5 actionable steps the applicant can take to improve their chances of bank account approval.

IMPORTANT: 
- Do NOT make any guarantees about approval
- Use phrases like "may help", "could improve", "typically viewed more favorably"
- Be realistic about limitations based on nationality or jurisdiction restrictions
- Focus on practical, actionable advice

Respond in JSON format:
{
  "explanation": "Plain language explanation paragraph...",
  "improvementSteps": ["Step 1...", "Step 2...", "Step 3..."]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Bank Readiness Assistant',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResponse = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback response
      parsedResponse = {
        explanation: content,
        improvementSteps: []
      };
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-bank-readiness:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        explanation: 'Unable to generate AI analysis at this time. Please rely on the rule-based assessment.',
        improvementSteps: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

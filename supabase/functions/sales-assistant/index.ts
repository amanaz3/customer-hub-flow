import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesAssistantRequest {
  customerId?: string;
  productId?: string;
  callType: 'inbound' | 'outbound' | 'follow_up';
  currentStage?: string;
  transcript?: string[];
  customerSegment?: string;
  customerEmotion?: string;
  action: 'get_playbook' | 'get_suggestions' | 'handle_objection' | 'get_pricing' | 'analyze_call';
  objectionText?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const requestData: SalesAssistantRequest = await req.json();
    
    console.log('Sales Assistant Request:', requestData.action);

    // Fetch relevant playbook data
    let playbookContext = '';
    let customerContext = '';
    let pricingContext = '';

    // Get playbook for the product/call type
    if (requestData.productId || requestData.callType) {
      const { data: playbooks } = await supabase
        .from('sales_playbooks')
        .select(`
          *,
          playbook_stages (*),
          objection_handlers (*),
          pricing_strategies (*),
          discovery_questions (*),
          emotional_responses (*)
        `)
        .eq('is_active', true)
        .eq('call_type', requestData.callType)
        .limit(1);

      if (playbooks && playbooks.length > 0) {
        const playbook = playbooks[0];
        playbookContext = `
PLAYBOOK: ${playbook.name}
DESCRIPTION: ${playbook.description || 'N/A'}

STAGES:
${playbook.playbook_stages?.map((s: any) => 
  `- ${s.stage_order}. ${s.stage_name} (${s.stage_type}): ${s.key_objectives?.join(', ') || 'N/A'}`
).join('\n') || 'No stages defined'}

OBJECTION HANDLERS:
${playbook.objection_handlers?.map((o: any) => 
  `- ${o.objection_type}: "${o.objection_trigger}" → "${o.response_script}"`
).join('\n') || 'No objection handlers'}

DISCOVERY QUESTIONS:
${playbook.discovery_questions?.map((q: any) => 
  `- ${q.question_text} (Purpose: ${q.question_purpose})`
).join('\n') || 'No questions'}

EMOTIONAL RESPONSES:
${playbook.emotional_responses?.map((e: any) => 
  `- When ${e.emotion_detected}: ${e.response_strategy}`
).join('\n') || 'No emotional responses'}
`;

        // Get pricing for customer segment
        if (requestData.customerSegment) {
          const pricing = playbook.pricing_strategies?.find(
            (p: any) => p.customer_segment === requestData.customerSegment
          );
          if (pricing) {
            pricingContext = `
PRICING FOR ${requestData.customerSegment}:
- Discount Range: ${pricing.discount_range_min}% - ${pricing.discount_range_max}%
- Negotiation Floor: ${pricing.negotiation_floor}
- Script: ${pricing.pricing_script || 'N/A'}
- Bundles: ${pricing.bundle_suggestions?.join(', ') || 'None'}
`;
          }
        }
      }
    }

    // Get customer context if customerId provided
    if (requestData.customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select(`
          *,
          account_applications (id, status, application_type, created_at)
        `)
        .eq('id', requestData.customerId)
        .single();

      if (customer) {
        customerContext = `
CUSTOMER: ${customer.name}
COMPANY: ${customer.company}
LICENSE TYPE: ${customer.license_type}
LEAD SOURCE: ${customer.lead_source}
APPLICATIONS: ${customer.account_applications?.length || 0}
STATUS HISTORY: ${customer.account_applications?.map((a: any) => `${a.application_type}: ${a.status}`).join(', ') || 'None'}
`;
      }
    }

    // Build the AI prompt based on action
    let systemPrompt = `You are an expert AI sales assistant for a corporate services company in Dubai. 
You help agents during live calls with:
- Strategic conversation guidance
- Objection handling
- Pricing negotiations
- Emotional intelligence
- Call sequencing and branching

${playbookContext}
${customerContext}
${pricingContext}

Always respond in JSON format with the following structure based on the request type.`;

    let userPrompt = '';

    switch (requestData.action) {
      case 'get_suggestions':
        userPrompt = `Based on the current conversation and context:
Current Stage: ${requestData.currentStage || 'unknown'}
Customer Emotion: ${requestData.customerEmotion || 'neutral'}
Recent Transcript: ${requestData.transcript?.slice(-5).join('\n') || 'No transcript'}

Provide suggestions in this JSON format:
{
  "suggestedReplies": ["reply1", "reply2", "reply3"],
  "suggestedQuestions": ["question1", "question2"],
  "alerts": [{"type": "objection|compliance|alert", "label": "alert text", "severity": "low|medium|high"}],
  "nextStage": "recommended next stage",
  "toneAdvice": "advice on tone to use",
  "emotionDetected": "detected customer emotion"
}`;
        break;

      case 'handle_objection':
        userPrompt = `The customer raised this objection: "${requestData.objectionText}"
Customer Segment: ${requestData.customerSegment || 'unknown'}
Customer Emotion: ${requestData.customerEmotion || 'neutral'}

Provide objection handling in this JSON format:
{
  "objectionType": "pricing|timing|competitor|trust|need",
  "responseScript": "the full response to give",
  "followUpQuestion": "question to ask after response",
  "toneAdjustment": "how to adjust tone",
  "escalate": false,
  "alternativeResponses": ["alt1", "alt2"]
}`;
        break;

      case 'get_pricing':
        userPrompt = `Customer is discussing pricing.
Customer Segment: ${requestData.customerSegment || 'unknown'}
Customer Emotion: ${requestData.customerEmotion || 'neutral'}

Provide pricing guidance in this JSON format:
{
  "suggestedPrice": "price range to quote",
  "discountAvailable": "available discount range",
  "negotiationFloor": "minimum acceptable price",
  "pricingScript": "script for presenting price",
  "bundleOpportunities": ["bundle1", "bundle2"],
  "urgencyTactics": ["tactic1", "tactic2"]
}`;
        break;

      case 'analyze_call':
        userPrompt = `Analyze this call transcript and provide insights:
${requestData.transcript?.join('\n') || 'No transcript'}

Provide analysis in this JSON format:
{
  "summary": "brief call summary",
  "customerIntent": "what the customer wants",
  "emotionProgression": ["emotion at start", "emotion at end"],
  "objections": ["objection1", "objection2"],
  "nextSteps": ["step1", "step2"],
  "conversionProbability": 75,
  "recommendations": ["rec1", "rec2"]
}`;
        break;

      default:
        userPrompt = `Provide general sales guidance for a ${requestData.callType} call.
Return JSON format:
{
  "openingScript": "how to open the call",
  "keyObjectives": ["obj1", "obj2"],
  "discoveryQuestions": ["q1", "q2", "q3"],
  "closingTechniques": ["technique1", "technique2"]
}`;
    }

    // Call Lovable AI
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
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content || '{}';
    
    console.log('AI Response received');

    // Parse JSON from response
    let result;
    try {
      // Handle markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e);
      result = { rawResponse: content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sales Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

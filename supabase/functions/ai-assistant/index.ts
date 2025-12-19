import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are an agentic AI assistant for a UAE company formation platform that also handles business bank accounts and bookkeeping services.

Your goals:
1. Guide users step by step through the existing workflow (nationality first, then other required info) in a conversational chat interface.
2. Handle incomplete or ambiguous inputs gracefully, asking clarifying questions as needed.
3. Suggest proactive next steps (document uploads, start bookkeeping, check status).
4. Maintain multi-turn context so the user can complete the process naturally.
5. Pre-fill product page forms dynamically, but always let the user confirm before submission.
6. Suggest the correct backend API to call for the action, based on the mappings below.

Workflow rules:
- Respect the order of required fields: nationality → company_type → business_activity → other optional fields.
- Only trigger API calls when all required parameters for a workflow step are collected.
- If the user input is ambiguous or incomplete, ask clarifying questions.

Existing backend API mappings:
| LLM Intent        | API Function                        | Required Parameters |
|------------------|-------------------------------------|---------------------|
| start_company    | startCompany(params)                | user_id, nationality, company_type, business_activity |
| upload_document  | uploadDocument(params)              | user_id, document_type |
| start_bookkeeping| startBookkeeping(params)            | user_id, plan_type |
| check_status     | getStatus(params)                   | entity_id |
| ask_compliance   | askCompliance(params)               | question_type or free-text query |

When you have collected enough information to suggest an action, include a JSON block in your response using this format:

\`\`\`json
{
  "intent": "<one of: start_company, upload_document, check_status, start_bookkeeping, ask_compliance>",
  "parameters": {
    "user_id": "<user_id if available>",
    "nationality": "<nationality if collected>",
    "company_type": "<mainland/freezone/offshore if collected>",
    "business_activity": "<business_activity if collected>",
    "document_type": "<passport/ID/utility_bill/etc if relevant>",
    "plan_type": "<bookkeeping_plan_type if relevant>"
  },
  "suggested_api_call": "<mapped API function based on intent>",
  "ready_to_execute": <true if all required params collected, false otherwise>
}
\`\`\`

Additional Guidelines:
- Map bank account or document uploads to upload_document.
- Map bookkeeping setup requests to start_bookkeeping.
- Map compliance or status questions to ask_compliance or check_status.
- Always ensure all required parameters are collected before triggering any API.
- Keep chat friendly, professional, and helpful.
- Use the user's context from the conversation to maintain state.
- When all required parameters are collected, set "ready_to_execute": true and inform the user they can proceed.

Start by greeting the user and asking how you can help them today with company formation, bank accounts, or bookkeeping services.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("AI Assistant request received, messages count:", messages?.length);

    // Inject user_id context into system prompt if available
    const contextualSystemPrompt = userId 
      ? `${systemPrompt}\n\nCurrent user_id: ${userId}`
      : systemPrompt;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("AI Assistant streaming response started");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

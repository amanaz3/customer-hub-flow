import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant for a UAE company formation platform. You help customers with:
- Company formation in UAE free zones and mainland
- Bank account opening guidance
- Visa and residency services
- Bookkeeping and tax compliance

Be professional, friendly, and guide users through the process step by step. Ask clarifying questions when needed.`;

const DEFAULT_GREETING = "Hello! I'm your AI assistant for company formation in the UAE. How can I help you today?";

async function getAIConfig() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.log("Supabase credentials not found, using defaults");
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('ai_assistant_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error("Error fetching AI config:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Failed to fetch AI config:", err);
    return null;
  }
}

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

    // Fetch configuration from database
    const config = await getAIConfig();
    
    // Valid models for Lovable AI Gateway
    const VALID_MODELS = [
      "google/gemini-2.5-flash",
      "google/gemini-2.5-flash-lite", 
      "google/gemini-2.5-pro",
      "google/gemini-3-pro-preview",
      "openai/gpt-5",
      "openai/gpt-5-mini",
      "openai/gpt-5-nano"
    ];
    
    // Use database config or defaults, validate model
    const systemPrompt = config?.system_prompt || DEFAULT_SYSTEM_PROMPT;
    const configModel = config?.model;
    const model = (configModel && VALID_MODELS.includes(configModel)) 
      ? configModel 
      : "google/gemini-2.5-flash";
    
    console.log("Using model:", model, "(configured:", configModel, ")");

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
        model: model,
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

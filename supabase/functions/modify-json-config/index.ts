import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentConfig, prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful assistant that modifies form configuration JSON based on user instructions.

The configuration structure has the following format:
- sections: array of form sections containing fields
- documents: array of document categories with required documents
- Each field has: name, label, type, required, options (for select/radio)

IMPORTANT: 
1. Always return ONLY valid JSON with no markdown formatting or code blocks
2. Preserve all existing properties unless explicitly asked to change them
3. Make minimal changes - only what the user requested
4. Maintain the exact structure of the configuration

Current configuration:
${JSON.stringify(currentConfig, null, 2)}

User instruction: ${prompt}

Return ONLY the modified JSON configuration with no explanation or markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Modify the configuration as instructed." }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let modifiedConfig = data.choices[0].message.content;

    // Clean up markdown code blocks if present
    modifiedConfig = modifiedConfig.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse to validate JSON
    const parsedConfig = JSON.parse(modifiedConfig);

    return new Response(
      JSON.stringify({ modifiedConfig: parsedConfig }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in modify-json-config:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

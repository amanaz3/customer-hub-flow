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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("Image is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a form configuration expert. Analyze the form screenshot and extract its structure to create a JSON configuration.

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "id": "unique_section_id",
      "sectionTitle": "Section Name",
      "fields": [
        {
          "id": "unique_field_id",
          "fieldType": "text|email|number|select|textarea|date|checkbox|radio",
          "label": "Field Label",
          "placeholder": "Optional placeholder",
          "required": true|false,
          "requiredAtStage": "draft|submitted|review|approval|completed",
          "options": ["option1", "option2"] // only for select/radio
        }
      ]
    }
  ],
  "requiredDocuments": [
    {
      "name": "Category Name",
      "description": "Category description",
      "documents": [
        {
          "name": "Document Name",
          "isMandatory": true|false,
          "acceptedFileTypes": [".pdf", ".jpg", ".png"]
        }
      ]
    }
  ]
}

Important rules:
- Identify all form sections and fields
- Determine appropriate field types based on visual appearance
- Extract labels, placeholders, and validation requirements
- Identify required vs optional fields
- For dropdowns/selects, try to identify visible options
- For document sections, identify required documents
- Use descriptive but concise IDs (lowercase, underscores)
- Return ONLY the JSON object, no markdown or explanation`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this form screenshot and extract its structure as JSON configuration.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "Payment required. Please add credits to your Lovable AI workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let configText = data.choices?.[0]?.message?.content || "";

    // Clean up markdown code blocks if present
    configText = configText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Parse and validate the JSON
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(configText);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", configText);
      throw new Error("AI returned invalid JSON configuration");
    }

    // Add metadata
    parsedConfig.metadata = {
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: "Screenshot Analysis",
      lastModifiedAt: new Date().toISOString(),
      lastModifiedBy: "Screenshot Analysis",
      versionNotes: "Generated from screenshot analysis",
    };

    return new Response(JSON.stringify({ config: parsedConfig }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-form-screenshot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

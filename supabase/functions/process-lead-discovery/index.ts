import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { prompt, data, industry, product } = await req.json();

    if (!prompt || !data) {
      throw new Error('Missing required fields: prompt and data');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a data processing AI assistant specialized in lead discovery and analysis for B2B sales.

Your task is to process the provided data according to the user's prompt and return the modified data.

Context:
- Industry: ${industry || 'Not specified'}
- Target Product/Service: ${product || 'Not specified'}

IMPORTANT RULES:
1. You MUST return valid JSON only - no explanations, no markdown, just the JSON array
2. Preserve the original data structure when possible
3. For filtering: return only items that match the criteria
4. For transformation: modify fields as requested while keeping other fields intact
5. For curation: enrich, deduplicate, or organize data as requested
6. If you cannot process the data, return an empty array []

The input data is a JSON array. Process it according to the user's prompt and return the resulting JSON array.`;

    const userMessage = `Process this data according to the following instruction:

INSTRUCTION: ${prompt}

DATA:
${JSON.stringify(data, null, 2)}

Return ONLY the processed JSON array, no other text.`;

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
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 32000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let resultText = aiResponse.choices[0]?.message?.content || '[]';

    // Clean up the response - remove markdown code blocks if present
    resultText = resultText.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', resultText);
      throw new Error('AI returned invalid JSON');
    }

    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        result,
        execution_time_ms: executionTime,
        input_count: Array.isArray(data) ? data.length : 1,
        output_count: Array.isArray(result) ? result.length : 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-lead-discovery:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

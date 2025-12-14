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

Your task is to process the provided data according to the user's prompt and return ONLY a valid JSON array.

Context:
- Industry: ${industry || 'Not specified'}
- Target Product/Service: ${product || 'Not specified'}

CRITICAL OUTPUT RULES:
1. Return ONLY a valid JSON array - absolutely no other text, explanations, or formatting
2. Do NOT use markdown code blocks
3. Do NOT include any text before or after the JSON array
4. The response must start with [ and end with ]
5. Preserve the original data structure - each object should have the same fields as input
6. Add any new classification columns as additional fields in each object
7. If filtering, return only matching items as a JSON array
8. If no items match, return an empty array: []

The input is a JSON array of objects. Your output must also be a JSON array of objects.`;

    const userMessage = `Process this data and return a JSON array:

INSTRUCTION: ${prompt}

INPUT DATA (JSON array):
${JSON.stringify(data)}

RESPOND WITH ONLY THE JSON ARRAY. No explanations, no markdown, no code blocks. Start with [ and end with ].`;

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
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to your Lovable workspace in Settings → Workspace → Usage.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let resultText = aiResponse.choices[0]?.message?.content || '[]';
    console.log('Raw AI response length:', resultText.length);

    // Clean up the response - remove markdown code blocks if present
    resultText = resultText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .replace(/^\s*```\s*/gm, '')
      .trim();

    // Try to extract JSON array from the response
    let result;
    
    // First, try direct parse
    try {
      result = JSON.parse(resultText);
      console.log('Direct parse succeeded');
    } catch (parseError) {
      console.log('Initial parse failed, attempting extraction...');
      
      // Find the first [ and last ] to extract the array
      const firstBracket = resultText.indexOf('[');
      const lastBracket = resultText.lastIndexOf(']');
      
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        let jsonCandidate = resultText.substring(firstBracket, lastBracket + 1);
        console.log('Extracted JSON candidate length:', jsonCandidate.length);
        
        // Clean common issues
        jsonCandidate = jsonCandidate
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
          .replace(/[\x00-\x1F\x7F]/g, ' ')  // Remove control characters
          .replace(/\n\s*\n/g, '\n')  // Remove double newlines
          .replace(/\\n/g, ' ')  // Replace escaped newlines with space
          .replace(/\t/g, ' ');  // Replace tabs with space
        
        try {
          result = JSON.parse(jsonCandidate);
          console.log('Cleaned JSON parse succeeded, items:', Array.isArray(result) ? result.length : 1);
        } catch (e2) {
          console.error('JSON parse still failed after cleaning');
          console.error('First 1000 chars:', jsonCandidate.substring(0, 1000));
          console.error('Last 500 chars:', jsonCandidate.substring(jsonCandidate.length - 500));
          
          // Last resort: try to parse incrementally to find valid portion
          let validResult = null;
          for (let endPos = jsonCandidate.length; endPos > 100; endPos -= 100) {
            const partial = jsonCandidate.substring(0, endPos);
            // Try to close any open structures
            const openBrackets = (partial.match(/\[/g) || []).length;
            const closeBrackets = (partial.match(/\]/g) || []).length;
            const openBraces = (partial.match(/\{/g) || []).length;
            const closeBraces = (partial.match(/\}/g) || []).length;
            
            let attempt = partial;
            for (let i = 0; i < openBraces - closeBraces; i++) attempt += '}';
            for (let i = 0; i < openBrackets - closeBrackets; i++) attempt += ']';
            
            try {
              validResult = JSON.parse(attempt);
              console.log('Partial parse succeeded at position:', endPos);
              break;
            } catch (e) {
              continue;
            }
          }
          
          if (validResult) {
            result = validResult;
          } else {
            throw new Error('AI returned invalid JSON - could not extract valid array');
          }
        }
      } else {
        console.error('No JSON array structure found in response');
        console.error('Response preview:', resultText.substring(0, 500));
        throw new Error('AI returned invalid JSON - no array found');
      }
    }
    
    // Ensure result is an array
    if (!Array.isArray(result)) {
      result = [result];
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessType, signatoryType, natureOfBusiness, annualTurnover, numberOfShareholders } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Analyzing bank account risk with AI:', { 
      businessType, 
      signatoryType, 
      natureOfBusiness,
      annualTurnover,
      numberOfShareholders 
    });

    const systemPrompt = `You are an expert risk analyst specializing in UAE bank account opening compliance and KYC/AML risk assessment. 

Analyze the provided bank account application details and assess the risk level based on:
- Business structure and jurisdiction (Mainland vs Freezone)
- Signatory arrangements and control structures
- Nature of business activities (especially high-risk sectors like crypto, forex, money services)
- Financial profile and transaction patterns
- Corporate complexity and ownership structure

Provide a comprehensive risk assessment with clear reasoning.`;

    const userPrompt = `Assess the risk level for this UAE bank account opening application:

Business Type: ${businessType || 'Not specified'}
Signatory Type: ${signatoryType || 'Not specified'}
Nature of Business: ${natureOfBusiness || 'Not specified'}
Annual Turnover: ${annualTurnover ? `${annualTurnover} AED` : 'Not specified'}
Number of Shareholders: ${numberOfShareholders || 'Not specified'}

Provide a detailed risk assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assess_bank_account_risk",
              description: "Assess the risk level for a bank account opening application",
              parameters: {
                type: "object",
                properties: {
                  risk_level: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "The overall risk level assessment"
                  },
                  risk_score: {
                    type: "integer",
                    minimum: 0,
                    maximum: 100,
                    description: "Numerical risk score from 0 (lowest risk) to 100 (highest risk)"
                  },
                  key_risk_factors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        factor: {
                          type: "string",
                          description: "The risk factor identified"
                        },
                        impact: {
                          type: "string",
                          enum: ["low", "medium", "high"],
                          description: "Impact level of this risk factor"
                        },
                        explanation: {
                          type: "string",
                          description: "Why this is a risk factor"
                        }
                      },
                      required: ["factor", "impact", "explanation"]
                    },
                    description: "List of key risk factors identified"
                  },
                  mitigating_factors: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Factors that reduce the overall risk"
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "Recommendations for risk mitigation or enhanced due diligence"
                  },
                  reasoning: {
                    type: "string",
                    description: "Overall reasoning for the risk assessment"
                  }
                },
                required: ["risk_level", "risk_score", "key_risk_factors", "reasoning"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "assess_bank_account_risk" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status} ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('AI response received:', JSON.stringify(aiResponse, null, 2));

    // Extract the structured risk assessment from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "assess_bank_account_risk") {
      throw new Error("AI did not return expected risk assessment format");
    }

    const riskAssessment = JSON.parse(toolCall.function.arguments);
    
    console.log('Risk assessment completed:', riskAssessment);

    return new Response(
      JSON.stringify(riskAssessment),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-bank-account-risk function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unexpected error occurred during risk analysis" 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

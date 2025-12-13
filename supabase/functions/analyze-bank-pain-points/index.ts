import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerData {
  name: string;
  email?: string;
  nationality?: string;
  phone?: string;
  country?: string;
  [key: string]: string | undefined;
}

interface AnalysisResult {
  customer: CustomerData;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  painPoints: string[];
  recommendations: string[];
  documentationGaps: string[];
  wealthTier: 'UHNW' | 'HNW' | 'Mass Affluent' | 'Standard';
  bankingReadinessTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  serviceOpportunity: 'High' | 'Medium' | 'Low';
  nationalitySegment: string;
  recommendedProducts: string[];
  classificationReasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customers } = await req.json() as { customers: CustomerData[] };
    
    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No customers provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const customerSummary = customers.map(c => 
      `Name: ${c.name}, Nationality: ${c.nationality || 'Unknown'}, Email: ${c.email || 'N/A'}, Country: ${c.country || 'Unknown'}`
    ).join('\n');

    const systemPrompt = `You are a UAE banking compliance expert analyzing customers who own real estate in Dubai/UAE for potential pain points when opening bank accounts.

For each customer, assess:
1. NATIONALITY RISK: High-risk countries (sanctioned nations, high-risk jurisdictions for AML)
2. RESIDENCY ISSUES: Non-resident challenges, visa requirements
3. SOURCE OF FUNDS: Real estate ownership requires proof of funds documentation
4. DOCUMENTATION GAPS: What documents they'll likely need
5. COMPLIANCE CONCERNS: AML/KYC challenges based on profile

UAE High-Risk Nationalities for Banking:
- Very High: Iran, North Korea, Syria, Yemen, Afghanistan, Iraq
- High: Pakistan, Nigeria, Sudan, Libya, Somalia, Russia
- Medium-High: Lebanon, Myanmar, Venezuela, Zimbabwe

Common Pain Points for UAE Bank Account Opening:
- Non-residents face stricter requirements
- Real estate ownership requires property title deed verification
- Source of funds documentation (especially for high-value properties)
- Emirates ID requirement for residents
- Proof of address (can be from home country for non-residents)
- Professional/business documentation

CUSTOMER CLASSIFICATION CRITERIA:

Wealth Tier Classification:
- UHNW (Ultra High Net Worth): Multiple Dubai properties, premium areas (Palm Jumeirah, Downtown, Emirates Hills), property value >10M AED, or indicators of significant wealth
- HNW (High Net Worth): Single premium property or multiple standard properties, property value 3-10M AED
- Mass Affluent: Standard property in good areas, property value 1-3M AED
- Standard: Entry-level property, property value <1M AED, or limited wealth indicators

Banking Readiness Tier:
- Tier 1 (Premium Ready): Low risk nationality, complete documentation likely, straightforward compliance, GCC/Western nationalities
- Tier 2 (Standard Process): Medium risk, some documentation work needed, manageable compliance requirements
- Tier 3 (Enhanced Due Diligence): High risk nationality, significant documentation gaps, requires EDD process

Service Opportunity Classification:
- High: Cross-sell potential (wealth management, investments, insurance, premium cards), multiple banking needs
- Medium: Standard banking services with some upsell potential
- Low: Basic banking needs only, limited cross-sell opportunity

Nationality Segments:
- GCC: UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman
- EU/UK/US: European Union countries, United Kingdom, United States, Canada, Australia
- Asian Markets: India, Pakistan, Philippines, China, Bangladesh, other Asian countries
- High-Risk Jurisdictions: Iran, Syria, North Korea, sanctioned countries

Recommended Products (based on profile):
- Premium accounts, Wealth management, Investment services, Insurance products, Credit cards, Mortgages, Business banking

IMPORTANT: Since we only have limited customer data (name, nationality, email), be honest in classificationReasoning about what data informed each classification. If assigning a wealth tier without property value data, note this limitation. Default to "Standard" wealth tier unless there are clear indicators otherwise.

Return analysis in JSON format.`;

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
          { role: 'user', content: `Analyze these customers for UAE bank account opening pain points and classify them:\n\n${customerSummary}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_analysis',
            description: 'Provide bank account pain point analysis and customer classification for each customer',
            parameters: {
              type: 'object',
              properties: {
                results: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      customerName: { type: 'string', description: 'Customer name for matching' },
                      riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
                      riskScore: { type: 'number', description: 'Risk score 0-100' },
                      painPoints: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'List of specific pain points this customer will face'
                      },
                      recommendations: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Actionable recommendations to address pain points'
                      },
                      documentationGaps: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Documents they will likely need to prepare'
                      },
                      wealthTier: {
                        type: 'string',
                        enum: ['UHNW', 'HNW', 'Mass Affluent', 'Standard'],
                        description: 'Wealth tier classification based on property and wealth indicators'
                      },
                      bankingReadinessTier: {
                        type: 'string',
                        enum: ['Tier 1', 'Tier 2', 'Tier 3'],
                        description: 'Banking readiness tier based on risk and documentation'
                      },
                      serviceOpportunity: {
                        type: 'string',
                        enum: ['High', 'Medium', 'Low'],
                        description: 'Cross-sell and service opportunity level'
                      },
                      nationalitySegment: {
                        type: 'string',
                        enum: ['GCC', 'EU/UK/US', 'Asian Markets', 'High-Risk Jurisdictions'],
                        description: 'Nationality segment classification'
                      },
                      recommendedProducts: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'List of recommended banking products for this customer'
                      },
                      classificationReasoning: {
                        type: 'string',
                        description: 'Brief explanation of why this wealth tier and classifications were assigned based on available data. Be honest if data is limited.'
                      }
                    },
                    required: ['customerName', 'riskLevel', 'riskScore', 'painPoints', 'recommendations', 'documentationGaps', 'wealthTier', 'bankingReadinessTier', 'serviceOpportunity', 'nationalitySegment', 'recommendedProducts', 'classificationReasoning']
                  }
                }
              },
              required: ['results']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_analysis' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response structure:', JSON.stringify(aiResponse, null, 2));
    
    const message = aiResponse.choices?.[0]?.message;
    const toolCall = message?.tool_calls?.[0];
    
    let analysisData;
    
    // Try tool call first
    if (toolCall?.function?.arguments) {
      analysisData = JSON.parse(toolCall.function.arguments);
    } 
    // Fallback: Check if content contains JSON
    else if (message?.content) {
      console.log('No tool call, trying to parse content:', message.content);
      const jsonMatch = message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      }
    }
    
    if (!analysisData?.results) {
      console.error('Could not extract analysis data. Full response:', JSON.stringify(aiResponse));
      throw new Error('Invalid AI response format - no results found');
    }
    
    // Match AI results back to original customer objects
    const results: AnalysisResult[] = analysisData.results.map((r: any) => {
      const customer = customers.find(c => 
        c.name.toLowerCase().includes(r.customerName.toLowerCase()) ||
        r.customerName.toLowerCase().includes(c.name.toLowerCase())
      ) || customers[0];
      
      return {
        customer,
        riskLevel: r.riskLevel,
        riskScore: r.riskScore,
        painPoints: r.painPoints || [],
        recommendations: r.recommendations || [],
        documentationGaps: r.documentationGaps || [],
        wealthTier: r.wealthTier || 'Standard',
        bankingReadinessTier: r.bankingReadinessTier || 'Tier 2',
        serviceOpportunity: r.serviceOpportunity || 'Medium',
        nationalitySegment: r.nationalitySegment || 'Asian Markets',
        recommendedProducts: r.recommendedProducts || [],
        classificationReasoning: r.classificationReasoning || 'No reasoning provided'
      };
    });

    console.log(`Analyzed ${results.length} customers successfully`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-bank-pain-points:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

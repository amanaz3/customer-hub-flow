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
  company?: string;
  existingServices?: string[];
  productName?: string;
  [key: string]: string | string[] | undefined;
}

interface AnalysisResult {
  customer: CustomerData;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  painPoints: string[];
  recommendations: string[];
  documentationGaps: string[];
  wealthTier: 'UHNW' | 'HNW' | 'Mass Affluent' | 'Standard';
  wealthTierReason: string;
  bankingReadinessTier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  bankingReadinessReason: string;
  serviceOpportunity: 'High' | 'Medium' | 'Low';
  serviceOpportunityReason: string;
  nationalitySegment: string;
  nationalitySegmentReason: string;
  recommendedProducts: string[];
  crossSellOpportunities: string[];
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

    const customerSummary = customers.map(c => {
      const parts = [
        `Name: ${c.name}`,
        `Nationality: ${c.nationality || 'Unknown'}`,
        `Email: ${c.email || 'N/A'}`,
        `Country: ${c.country || 'Unknown'}`,
      ];
      if (c.company) parts.push(`Company: ${c.company}`);
      if (c.productName) parts.push(`Current Service: ${c.productName}`);
      if (c.existingServices?.length) parts.push(`Existing Services: ${c.existingServices.join(', ')}`);
      return parts.join(', ');
    }).join('\n');

    const systemPrompt = `You are a UAE banking and business services compliance expert. Analyze customers for:
1. Bank account opening pain points and readiness
2. Cross-sell/upsell opportunities for business services

AVAILABLE SERVICES FOR CROSS-SELL:
- Business Bank Account: Corporate bank account setup
- Home Finance: Mortgage and property financing
- Business Finance: Business loans and credit facilities  
- Company Formation: New company/LLC setup in UAE
- Book keeping: Monthly accounting and bookkeeping services
- FTA Services - VAT Registration: VAT registration with FTA
- FTA Services - VAT Filing: Quarterly VAT return filing
- FTA Services - Corporate Tax Registration: CT registration
- FTA Services - Corporate Tax Filing: Annual CT return filing
- AML Services: Anti-money laundering compliance services
- GoAML Reg: GoAML portal registration

ANALYSIS REQUIREMENTS:
For each customer, assess:
1. NATIONALITY RISK: High-risk countries for UAE banking compliance
2. BANKING READINESS: Documentation gaps, visa/residency status
3. CROSS-SELL OPPORTUNITIES: Based on current services, identify relevant upsells

UAE High-Risk Nationalities:
- Very High: Iran, North Korea, Syria, Yemen, Afghanistan, Iraq
- High: Pakistan, Nigeria, Sudan, Libya, Somalia, Russia
- Medium-High: Lebanon, Myanmar, Venezuela, Zimbabwe

CLASSIFICATION CRITERIA:

Wealth Tier:
- UHNW: Premium properties, >10M AED indicators
- HNW: 3-10M AED property/business value
- Mass Affluent: 1-3M AED range
- Standard: <1M AED or unknown

Banking Readiness Tier:
- Tier 1: GCC/Western, straightforward compliance
- Tier 2: Medium risk, some documentation needed
- Tier 3: High risk, requires Enhanced Due Diligence

Service Opportunity:
- High: Multiple cross-sell opportunities, growing business
- Medium: Some upsell potential
- Low: Basic needs only

Nationality Segments:
- GCC: UAE, Saudi, Kuwait, Qatar, Bahrain, Oman
- EU/UK/US: European, UK, US, Canada, Australia
- Asian Markets: India, Pakistan, Philippines, China, etc.
- High-Risk Jurisdictions: Sanctioned countries

CROSS-SELL LOGIC:
- Has Bank Account → Offer: Bookkeeping, VAT Registration, CT Registration
- Has Company Formation → Offer: Bank Account, Bookkeeping, GoAML
- Has Bookkeeping → Offer: VAT Filing, CT Filing, AML Services
- Has VAT Registration → Offer: VAT Filing, CT Registration
- Has Home Finance interest → Offer: Home Finance, Insurance
- Has Business Finance interest → Offer: Business Loans, Credit Facilities

CRITICAL: You MUST use the provide_analysis tool. Analyze every customer even with limited data.`;

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
          { role: 'user', content: `You MUST use the provide_analysis tool to analyze these customers for UAE bank account opening pain points. Do not refuse - analyze each customer even with limited data:\n\n${customerSummary}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'provide_analysis',
            description: 'REQUIRED: Provide bank account pain point analysis and customer classification for each customer. You MUST call this function.',
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
                      wealthTierReason: {
                        type: 'string',
                        description: 'Why this wealth tier? Reference specific data like property value, business type, or state "No data - defaulted to Standard".'
                      },
                      bankingReadinessReason: {
                        type: 'string',
                        description: 'Why this readiness tier? Reference documents, visa status, nationality risk, or specific gaps.'
                      },
                      serviceOpportunityReason: {
                        type: 'string',
                        description: 'Why this service opportunity? Reference business type, scale, or growth indicators.'
                      },
                      nationalitySegmentReason: {
                        type: 'string',
                        description: 'Why this nationality segment? Reference country and its specific banking implications in UAE.'
                      },
                      crossSellOpportunities: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Specific cross-sell/upsell opportunities based on customer profile and existing services'
                      }
                    },
                    required: ['customerName', 'riskLevel', 'riskScore', 'painPoints', 'recommendations', 'documentationGaps', 'wealthTier', 'wealthTierReason', 'bankingReadinessTier', 'bankingReadinessReason', 'serviceOpportunity', 'serviceOpportunityReason', 'nationalitySegment', 'nationalitySegmentReason', 'recommendedProducts', 'crossSellOpportunities']
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
    
    // Check for provider errors in the response body
    if (aiResponse.error) {
      console.error('AI provider error:', aiResponse.error);
      return new Response(
        JSON.stringify({ 
          error: `AI provider error: ${aiResponse.error.message || 'Unknown error'}. Please try again.`,
          retryable: true 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
      return new Response(
        JSON.stringify({ 
          error: 'Could not parse AI response. Please try again.',
          retryable: true 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
        wealthTierReason: r.wealthTierReason || 'No data available',
        bankingReadinessTier: r.bankingReadinessTier || 'Tier 2',
        bankingReadinessReason: r.bankingReadinessReason || 'No data available',
        serviceOpportunity: r.serviceOpportunity || 'Medium',
        serviceOpportunityReason: r.serviceOpportunityReason || 'No data available',
        nationalitySegment: r.nationalitySegment || 'Asian Markets',
        nationalitySegmentReason: r.nationalitySegmentReason || 'No data available',
        recommendedProducts: r.recommendedProducts || [],
        crossSellOpportunities: r.crossSellOpportunities || []
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

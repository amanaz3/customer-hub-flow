import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UAE_TAX_SYSTEM_PROMPT = `You are an expert UAE Corporate Tax assistant specializing in:

1. **UAE Corporate Tax Law (Federal Decree-Law No. 47 of 2022)**
   - 9% standard rate on taxable income exceeding AED 375,000
   - 0% rate for taxable income up to AED 375,000
   - Qualifying Free Zone entities may benefit from 0% rate on qualifying income

2. **Taxable Income Classification**
   - Revenue from business activities
   - Exempt income (dividends from UAE companies, capital gains from qualifying shareholdings)
   - Non-deductible expenses (fines, penalties, personal expenses)

3. **FTA Portal Compliance**
   - Tax registration requirements
   - Filing deadlines (within 9 months of financial year end)
   - Payment obligations
   - Record-keeping requirements (5 years minimum)

4. **Deductible Expenses**
   - Ordinary business expenses
   - Depreciation and amortization
   - Employee costs
   - Interest expenses (subject to limitations)

5. **Small Business Relief**
   - Available for businesses with revenue under AED 3 million
   - Simplified compliance requirements

When answering questions:
- Always cite relevant UAE tax law provisions
- Provide practical guidance for FTA portal submissions
- Highlight common mistakes to avoid
- Recommend when professional tax advice is needed
- Use AED currency for all examples
- Keep responses concise but comprehensive`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware prompt
    let contextPrompt = "";
    if (context?.currentStep) {
      contextPrompt = `\n\nThe user is currently on step: ${context.currentStep}. `;
      if (context.filingData) {
        contextPrompt += `Filing data: ${JSON.stringify(context.filingData)}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: UAE_TAX_SYSTEM_PROMPT + contextPrompt },
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Tax filing assistant error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

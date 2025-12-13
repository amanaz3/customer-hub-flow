import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadData {
  name: string;
  company?: string;
  city?: string;
  state?: string;
  industry?: string;
  email?: string;
  linkedin_profile?: string;
  dubai_setup_likelihood?: string;
  preferred_contact_method?: string;
  indicator?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leads } = await req.json() as { leads: LeadData[] };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const results = [];

    for (const lead of leads) {
      const systemPrompt = `You are an expert B2B outreach copywriter specializing in Dubai company formation services. 
Generate personalized outreach messages for a potential client interested in setting up a business in Dubai.

Key benefits to highlight:
- 100% foreign ownership
- 0% corporate and personal income tax
- Strategic location between East and West
- World-class infrastructure
- Easy visa and residency options
- Access to growing MENA markets

Keep messages professional but personalized based on the lead's industry and location.`;

      const userPrompt = `Generate outreach messages for this lead:
- Name: ${lead.name}
- Company: ${lead.company || 'Unknown'}
- City: ${lead.city || 'Unknown'}, State: ${lead.state || 'Unknown'}
- Industry: ${lead.industry || 'Unknown'}
- Dubai Setup Likelihood: ${lead.dubai_setup_likelihood || 'Unknown'}
- Indicator: ${lead.indicator || 'None'}
- Preferred Contact: ${lead.preferred_contact_method || 'email'}

Generate messages in this exact JSON format:
{
  "email": {
    "subject": "Email subject line",
    "body": "Professional email body (3-4 paragraphs)"
  },
  "linkedin": {
    "connection_note": "Short LinkedIn connection request (under 300 chars)",
    "follow_up": "Follow-up message after connection accepted"
  },
  "whatsapp": {
    "initial": "Brief WhatsApp message with clear CTA",
    "follow_up": "Follow-up if no response"
  },
  "priority_score": 1-10,
  "suggested_follow_up_days": number,
  "personalization_notes": "Why this approach for this lead"
}`;

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
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error("Rate limit exceeded");
          results.push({ lead: lead.name, error: "Rate limit exceeded" });
          continue;
        }
        if (response.status === 402) {
          console.error("Payment required");
          results.push({ lead: lead.name, error: "AI credits depleted" });
          continue;
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        results.push({ lead: lead.name, error: "AI generation failed" });
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        results.push({ lead: lead.name, error: "No content generated" });
        continue;
      }

      // Parse JSON from response (handle markdown code blocks)
      let messages;
      try {
        let jsonStr = content;
        if (jsonStr.includes('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.includes('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        messages = JSON.parse(jsonStr.trim());
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        results.push({ lead: lead.name, error: "Failed to parse messages", rawContent: content });
        continue;
      }

      results.push({
        lead: lead.name,
        company: lead.company,
        dubai_setup_likelihood: lead.dubai_setup_likelihood,
        preferred_contact_method: lead.preferred_contact_method,
        messages,
        success: true
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-outreach-messages:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

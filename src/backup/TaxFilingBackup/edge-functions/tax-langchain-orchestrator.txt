import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LangChain-style workflow steps
const WORKFLOW_STEPS = [
  {
    id: "verify_bookkeeping",
    name: "Verify Bookkeeping",
    prompt: `Analyze the bookkeeping data and verify completeness:
    - Check if all invoices are recorded
    - Verify all bills are captured
    - Confirm reconciliations are done
    - Flag any gaps or discrepancies
    Return a JSON with: { complete: boolean, issues: string[], summary: string }`,
  },
  {
    id: "classify_income",
    name: "Classify Income",
    prompt: `Classify all income entries according to UAE Corporate Tax Law:
    - Identify taxable income (business revenue)
    - Identify exempt income (qualifying dividends, capital gains from qualifying shareholdings)
    - Separate non-UAE sourced income
    - Flag any entries needing manual review
    Return a JSON with: { taxableIncome: number, exemptIncome: number, needsReview: object[], classification: object[] }`,
  },
  {
    id: "compute_tax",
    name: "Compute Tax",
    prompt: `Calculate UAE Corporate Tax based on classified income:
    - Apply 0% rate for income up to AED 375,000
    - Apply 9% rate for income exceeding AED 375,000
    - Calculate deductible expenses
    - Determine final tax liability
    Return a JSON with: { taxableIncome: number, threshold: number, taxAtZeroRate: number, taxAtNinePercent: number, totalTaxLiability: number, effectiveRate: number }`,
  },
  {
    id: "review_filing",
    name: "Review Filing",
    prompt: `Review the complete tax filing for accuracy:
    - Verify all calculations
    - Check compliance with UAE FTA requirements
    - Identify potential issues or red flags
    - Suggest optimizations if applicable
    Return a JSON with: { isValid: boolean, issues: string[], warnings: string[], optimizations: string[], readyToSubmit: boolean }`,
  },
  {
    id: "prepare_submission",
    name: "Prepare Submission",
    prompt: `Prepare the final tax filing for FTA submission:
    - Generate submission summary
    - List all required documents
    - Provide filing deadline reminder
    - Create final checklist
    Return a JSON with: { summary: object, requiredDocuments: string[], deadline: string, checklist: object[], submissionReadyPackage: object }`,
  },
];

interface WorkflowState {
  currentStepIndex: number;
  steps: typeof WORKFLOW_STEPS;
  results: Record<string, any>;
  status: "pending" | "running" | "completed" | "error";
  error?: string;
}

async function executeStep(
  stepIndex: number,
  bookkeepingData: any,
  previousResults: Record<string, any>,
  apiKey: string
): Promise<{ success: boolean; result: any; error?: string }> {
  const step = WORKFLOW_STEPS[stepIndex];
  
  const contextPrompt = `
You are executing step "${step.name}" in a UAE Corporate Tax filing workflow.

Previous step results: ${JSON.stringify(previousResults, null, 2)}

Bookkeeping data summary: ${JSON.stringify(bookkeepingData, null, 2)}

${step.prompt}

IMPORTANT: Respond ONLY with valid JSON. No explanations or markdown.
`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a UAE Corporate Tax expert AI assistant. Always respond with valid JSON only." },
          { role: "user", content: contextPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "process_step_result",
              description: "Process and return the step result",
              parameters: {
                type: "object",
                properties: {
                  result: {
                    type: "object",
                    description: "The result of processing this workflow step",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score 0-100",
                  },
                  notes: {
                    type: "string",
                    description: "Any additional notes or observations",
                  },
                },
                required: ["result", "confidence"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "process_step_result" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return { success: false, result: null, error: `AI API error: ${response.status}` };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return { success: true, result: parsed };
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return { success: true, result: { result: parsed, confidence: 80 } };
      } catch {
        return { success: true, result: { result: { raw: content }, confidence: 60 } };
      }
    }

    return { success: false, result: null, error: "No valid response from AI" };
  } catch (error) {
    console.error("Step execution error:", error);
    return { success: false, result: null, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, filingId, bookkeepingData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Mode: "stream" for UI-based, "background" for background processing
    if (mode === "stream") {
      // Streaming mode - return SSE stream with step-by-step updates
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const results: Record<string, any> = {};
          
          for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
            const step = WORKFLOW_STEPS[i];
            
            // Send step start event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "step_start",
                stepIndex: i,
                stepId: step.id,
                stepName: step.name,
                totalSteps: WORKFLOW_STEPS.length,
              })}\n\n`)
            );

            // Execute the step
            const { success, result, error } = await executeStep(
              i,
              bookkeepingData,
              results,
              LOVABLE_API_KEY
            );

            if (!success) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: "step_error",
                  stepIndex: i,
                  stepId: step.id,
                  error: error,
                })}\n\n`)
              );
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
              return;
            }

            results[step.id] = result;

            // Send step complete event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "step_complete",
                stepIndex: i,
                stepId: step.id,
                stepName: step.name,
                result: result,
                progress: Math.round(((i + 1) / WORKFLOW_STEPS.length) * 100),
              })}\n\n`)
            );

            // Small delay between steps for UI updates
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Send workflow complete event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "workflow_complete",
              results: results,
              summary: {
                stepsCompleted: WORKFLOW_STEPS.length,
                status: "success",
              },
            })}\n\n`)
          );
          
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    } else if (mode === "background") {
      // Background mode - execute all steps and update database
      const backgroundTask = async () => {
        const results: Record<string, any> = {};
        let status = "running";
        let error = null;

        try {
          // Create or update workflow state in database
          const { data: existingState } = await supabase
            .from("tax_workflow_state")
            .select("*")
            .eq("filing_id", filingId)
            .single();

          if (!existingState) {
            await supabase.from("tax_workflow_state").insert({
              filing_id: filingId,
              status: "running",
              current_step: 0,
              total_steps: WORKFLOW_STEPS.length,
              results: {},
              started_at: new Date().toISOString(),
            });
          } else {
            await supabase
              .from("tax_workflow_state")
              .update({ status: "running", started_at: new Date().toISOString() })
              .eq("filing_id", filingId);
          }

          for (let i = 0; i < WORKFLOW_STEPS.length; i++) {
            const step = WORKFLOW_STEPS[i];
            
            // Update current step in database
            await supabase
              .from("tax_workflow_state")
              .update({ 
                current_step: i,
                current_step_name: step.name,
                progress: Math.round((i / WORKFLOW_STEPS.length) * 100),
              })
              .eq("filing_id", filingId);

            const { success, result, error: stepError } = await executeStep(
              i,
              bookkeepingData,
              results,
              LOVABLE_API_KEY
            );

            if (!success) {
              status = "error";
              error = stepError;
              break;
            }

            results[step.id] = result;

            // Update results in database
            await supabase
              .from("tax_workflow_state")
              .update({ results })
              .eq("filing_id", filingId);
          }

          // Final update
          await supabase
            .from("tax_workflow_state")
            .update({
              status: status === "error" ? "error" : "completed",
              error: error,
              progress: status === "error" ? null : 100,
              completed_at: new Date().toISOString(),
              results,
            })
            .eq("filing_id", filingId);

        } catch (err) {
          console.error("Background task error:", err);
          await supabase
            .from("tax_workflow_state")
            .update({
              status: "error",
              error: err.message,
            })
            .eq("filing_id", filingId);
        }
      };

      // Use waitUntil for background processing
      EdgeRuntime.waitUntil(backgroundTask());

      return new Response(
        JSON.stringify({
          status: "started",
          message: "Workflow started in background",
          filingId,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid mode. Use 'stream' or 'background'" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const { forceUpdate = false } = body;
    
    console.log('Starting batch update for validation fields (using validationFields array)');
    console.log('Force update:', forceUpdate);

    // Fetch all service form configurations
    const { data: configs, error: fetchError } = await supabase
      .from('service_form_configurations')
      .select('id, product_id, form_config, products!inner(name)');

    if (fetchError) {
      console.error('Error fetching configs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${configs?.length || 0} service configurations`);

    const results: { product: string; status: string; details?: string }[] = [];

    // Define validation fields
    const estimatedCompletionTimeField = {
      id: "estimated_completion_time",
      fieldType: "date",
      label: "Expected Date",
      required: false,
      requiredAtStage: ["submitted"],
      renderInForm: false,
      helperText: "Must be set before submission"
    };

    const riskLevelField = {
      id: "risk_level",
      fieldType: "select",
      label: "Risk Level",
      options: ["Low", "Medium", "High"],
      required: false,
      requiredAtStage: ["submitted"],
      renderInForm: false,
      helperText: "Set via Risk Assessment on Application Detail page"
    };

    for (const config of configs || []) {
      const productName = (config as any).products?.name || 'Unknown';
      
      try {
        const formConfig = config.form_config as any || {};
        
        // Check if validationFields already exists and has required fields
        const existingValidationFields = formConfig.validationFields || [];
        const hasECT = existingValidationFields.some((f: any) => f.id === 'estimated_completion_time');
        const hasRiskLevel = existingValidationFields.some((f: any) => f.id === 'risk_level');
        
        // Determine if this is Business Bank Account (for risk_level)
        const isBusinessBankAccount = productName === 'Business Bank Account';
        
        // Always update to ensure correct field configuration (label, fieldType, etc.)

        // Build new validationFields array
        const newValidationFields: any[] = [];
        
        // Always add/update estimated_completion_time for ALL services with correct config
        newValidationFields.push(estimatedCompletionTimeField);
        
        // Always add/update risk_level ONLY for Business Bank Account
        if (isBusinessBankAccount) {
          newValidationFields.push(riskLevelField);
        }
        
        // Keep any other existing validation fields (not ECT or risk_level)
        for (const existing of existingValidationFields) {
          if (existing.id !== 'estimated_completion_time' && existing.id !== 'risk_level') {
            newValidationFields.push(existing);
          }
        }

        // Update config with validationFields at top level
        const updatedFormConfig = {
          ...formConfig,
          validationFields: newValidationFields
        };

        // Update the config in database
        const { error: updateError } = await supabase
          .from('service_form_configurations')
          .update({ form_config: updatedFormConfig })
          .eq('id', config.id);

        if (updateError) {
          console.error(`Error updating ${productName}:`, updateError);
          results.push({ product: productName, status: 'error', details: updateError.message });
        } else {
          console.log(`Successfully updated ${productName}`);
          results.push({ 
            product: productName, 
            status: 'success',
            details: 'Validation fields updated'
          });
        }
      } catch (err) {
        console.error(`Error processing ${productName}:`, err);
        results.push({ product: productName, status: 'error', details: String(err) });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const skipCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`Batch update complete: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          skipped: skipCount,
          errors: errorCount
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch-add-validation-fields:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

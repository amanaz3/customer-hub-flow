import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting batch update for form field requiredAtStage to ["draft"]');

    // Fetch all service form configurations
    const { data: configs, error: fetchError } = await supabase
      .from('service_form_configurations')
      .select('id, product_id, form_config, products!inner(name)');

    if (fetchError) {
      console.error('Error fetching configs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${configs?.length || 0} service configurations`);

    const results: { product: string; status: string; fieldsUpdated: number }[] = [];

    for (const config of configs || []) {
      const productName = (config as any).products?.name || 'Unknown';
      
      try {
        const formConfig = config.form_config as any || {};
        let fieldsUpdated = 0;
        
        // Update only form fields in sections (not validationFields, not documentRequirements)
        if (formConfig.sections && Array.isArray(formConfig.sections)) {
          for (const section of formConfig.sections) {
            if (section.fields && Array.isArray(section.fields)) {
              for (const field of section.fields) {
                // Set requiredAtStage to only ["draft"]
                field.requiredAtStage = ["draft"];
                fieldsUpdated++;
              }
            }
          }
        }

        // Update the config in database
        const { error: updateError } = await supabase
          .from('service_form_configurations')
          .update({ form_config: formConfig })
          .eq('id', config.id);

        if (updateError) {
          console.error(`Error updating ${productName}:`, updateError);
          results.push({ product: productName, status: 'error', fieldsUpdated: 0 });
        } else {
          console.log(`Successfully updated ${productName} (${fieldsUpdated} fields)`);
          results.push({ 
            product: productName, 
            status: 'success',
            fieldsUpdated
          });
        }
      } catch (err) {
        console.error(`Error processing ${productName}:`, err);
        results.push({ product: productName, status: 'error', fieldsUpdated: 0 });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const totalFieldsUpdated = results.reduce((sum, r) => sum + r.fieldsUpdated, 0);

    console.log(`Batch update complete: ${successCount} success, ${errorCount} errors, ${totalFieldsUpdated} total fields updated`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: results.length,
          success: successCount,
          errors: errorCount,
          totalFieldsUpdated
        },
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in batch-update-form-field-stages:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

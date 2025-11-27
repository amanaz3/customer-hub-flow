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

    const { addRiskLevel, productIds } = await req.json();
    
    console.log('Starting batch update for validation fields');
    console.log('Add risk level to specific products:', addRiskLevel);

    // Fetch all service form configurations
    const { data: configs, error: fetchError } = await supabase
      .from('service_form_configurations')
      .select('id, product_id, form_config, products!inner(name)');

    if (fetchError) {
      console.error('Error fetching configs:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${configs?.length || 0} service configurations`);

    const results: { product: string; status: string; error?: string }[] = [];

    for (const config of configs || []) {
      const productName = (config as any).products?.name || 'Unknown';
      
      try {
        const formConfig = config.form_config as any;
        const sections = formConfig?.sections || [];
        
        // Check if validation section already exists
        const existingValidationSection = sections.find(
          (s: any) => s.id === 'section_validation_requirements'
        );

        if (existingValidationSection) {
          console.log(`Skipping ${productName} - validation section already exists`);
          results.push({ product: productName, status: 'skipped', error: 'Already has validation section' });
          continue;
        }

        // Create validation fields
        const validationFields: any[] = [
          {
            id: "field_estimated_completion",
            fieldType: "date",
            label: "Estimated Completion Date",
            required: true,
            requiredAtStage: ["submitted"],
            renderInForm: false,
            helperText: "Required before submission",
            placeholder: ""
          }
        ];

        // Add risk_level only for Bank Account products
        const isBankAccount = productName.toLowerCase().includes('bank');
        if (isBankAccount || (productIds && productIds.includes(config.product_id))) {
          validationFields.unshift({
            id: "field_risk_level",
            fieldType: "select",
            label: "Risk Level",
            options: ["Low", "Medium", "High"],
            required: true,
            requiredAtStage: ["submitted"],
            renderInForm: false,
            helperText: "Set via Risk Assessment on Application Detail page",
            placeholder: ""
          });
        }

        // Create new validation section
        const validationSection = {
          id: "section_validation_requirements",
          sectionTitle: "Submission Requirements",
          fields: validationFields
        };

        // Add validation section to sections array
        const updatedSections = [...sections, validationSection];
        const updatedFormConfig = {
          ...formConfig,
          sections: updatedSections
        };

        // Update the config in database
        const { error: updateError } = await supabase
          .from('service_form_configurations')
          .update({ form_config: updatedFormConfig })
          .eq('id', config.id);

        if (updateError) {
          console.error(`Error updating ${productName}:`, updateError);
          results.push({ product: productName, status: 'error', error: updateError.message });
        } else {
          console.log(`Successfully updated ${productName}`);
          results.push({ 
            product: productName, 
            status: 'success',
            error: isBankAccount ? 'Added ECT + Risk Level' : 'Added ECT only'
          });
        }
      } catch (err) {
        console.error(`Error processing ${productName}:`, err);
        results.push({ product: productName, status: 'error', error: String(err) });
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

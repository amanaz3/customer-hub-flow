import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - No auth header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting migration...');

    // Fetch all customers with application data
    const { data: customers, error: fetchError } = await supabaseClient
      .from('customers')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching customers:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${customers?.length || 0} customer records`);

    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const customer of customers || []) {
      try {
        // Check if application already exists for this customer
        const { data: existingApp } = await supabaseClient
          .from('account_applications')
          .select('id')
          .eq('customer_id', customer.id)
          .single();

        if (existingApp) {
          console.log(`Skipping customer ${customer.id} - application already exists`);
          skippedCount++;
          continue;
        }

        // Create application record (license_type stays with customer)
        const { error: insertError } = await supabaseClient
          .from('account_applications')
          .insert({
            customer_id: customer.id,
            application_type: 'license',
            status: customer.status || 'draft',
            submission_source: 'web_form',
            application_data: {
              lead_source: customer.lead_source,
              amount: customer.amount,
              preferred_bank: customer.preferred_bank,
              preferred_bank_2: customer.preferred_bank_2,
              preferred_bank_3: customer.preferred_bank_3,
              any_suitable_bank: customer.any_suitable_bank,
              annual_turnover: customer.annual_turnover,
              jurisdiction: customer.jurisdiction,
              customer_notes: customer.customer_notes,
              product_id: customer.product_id,
              user_id: customer.user_id,
            },
            created_at: customer.created_at,
            updated_at: customer.updated_at,
          });

        if (insertError) {
          console.error(`Error migrating customer ${customer.id}:`, insertError);
          errors.push({ customer_id: customer.id, error: insertError.message });
        } else {
          console.log(`Migrated customer ${customer.id}`);
          migratedCount++;
        }
      } catch (err) {
        console.error(`Exception migrating customer ${customer.id}:`, err);
        errors.push({ customer_id: customer.id, error: err.message });
      }
    }

    console.log(`Migration complete: ${migratedCount} migrated, ${skippedCount} skipped, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        migrated: migratedCount,
        skipped: skippedCount,
        total: customers?.length || 0,
        errors: errors.length > 0 ? errors : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Migration failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

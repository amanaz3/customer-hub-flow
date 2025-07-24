import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId, newStatus, comment, changedBy, changedByRole } = await req.json();

    console.log('Updating customer status:', { customerId, newStatus, comment, changedBy, changedByRole });

    // Validate required parameters
    if (!customerId || !newStatus || !changedBy || !changedByRole) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current customer data to capture previous status
    const { data: currentCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('status')
      .eq('id', customerId)
      .single();

    if (fetchError) {
      console.error('Error fetching current customer:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch current customer data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const previousStatus = currentCustomer.status;
    console.log('Previous status:', previousStatus, 'New status:', newStatus);

    // Skip if status hasn't changed
    if (previousStatus === newStatus) {
      console.log('Status unchanged, skipping update');
      return new Response(
        JSON.stringify({ message: 'Status unchanged' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start a transaction-like approach
    // First, insert the status change record
    const { error: statusChangeError } = await supabase
      .from('status_changes')
      .insert({
        customer_id: customerId,
        previous_status: previousStatus,
        new_status: newStatus,
        changed_by: changedBy,
        changed_by_role: changedByRole,
        comment: comment || null,
        created_at: new Date().toISOString()
      });

    if (statusChangeError) {
      console.error('Error inserting status change:', statusChangeError);
      return new Response(
        JSON.stringify({ error: 'Failed to record status change' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Then update the customer status
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating customer status:', updateError);
      
      // Attempt to rollback the status change record if customer update fails
      await supabase
        .from('status_changes')
        .delete()
        .eq('customer_id', customerId)
        .eq('previous_status', previousStatus)
        .eq('new_status', newStatus)
        .eq('changed_by', changedBy);

      return new Response(
        JSON.stringify({ error: 'Failed to update customer status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Status updated successfully:', updatedCustomer);

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer: updatedCustomer,
        statusChange: {
          previous_status: previousStatus,
          new_status: newStatus,
          changed_by: changedBy,
          changed_by_role: changedByRole,
          comment: comment
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, newStatus, comment, changedBy, changedByRole } = await req.json();

    console.log('Updating application status:', { applicationId, newStatus, comment, changedBy, changedByRole });

    // Validate required fields
    if (!applicationId || !newStatus || !changedBy || !changedByRole) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          details: { applicationId, newStatus, changedBy, changedByRole } 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get current application to check previous status
    const { data: currentApplication, error: fetchError } = await supabase
      .from('account_applications')
      .select('status, customer_id')
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      console.error('Error fetching current application:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Application not found', details: fetchError }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const previousStatus = currentApplication.status;
    const customerId = currentApplication.customer_id;

    console.log('Previous status:', previousStatus, '-> New status:', newStatus);

    // Update application status
    const { data: updatedApplication, error: updateError } = await supabase
      .from('account_applications')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating application status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update application status', details: updateError }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Add status change message to application messages
    const statusMessage = comment 
      ? `Status changed from ${previousStatus} to ${newStatus}: ${comment}`
      : `Status changed from ${previousStatus} to ${newStatus}`;

    const { error: messageError } = await supabase
      .from('application_messages')
      .insert({
        application_id: applicationId,
        sender_id: changedBy,
        sender_type: changedByRole === 'admin' ? 'admin' : 'user',
        message: statusMessage,
        is_read: false,
      });

    if (messageError) {
      console.error('Error adding status message:', messageError);
      // Don't fail the whole operation if message fails
    }

    // Create notifications for relevant users
    if (customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('user_id, name')
        .eq('id', customerId)
        .single();

      // Determine notification type based on status
      let notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (newStatus === 'completed') {
        notificationType = 'success';
      } else if (newStatus === 'rejected') {
        notificationType = 'error';
      } else if (newStatus === 'returned') {
        notificationType = 'warning';
      }

      const notificationTitle = 'Application Status Updated';
      const notificationMessage = `Application status changed from ${previousStatus} to ${newStatus}`;
      const actionUrl = `/applications/${applicationId}`;

      // 1. Notify the user who owns the customer/application (if not the one making the change)
      if (customer?.user_id && customer.user_id !== changedBy) {
        await supabase
          .from('notifications')
          .insert({
            user_id: customer.user_id,
            title: notificationTitle,
            message: notificationMessage,
            type: notificationType,
            customer_id: customerId,
            action_url: actionUrl,
            is_read: false,
          });
      }

      // 2. Notify all active admins (except the one making the change)
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true)
        .neq('id', changedBy);

      if (admins && admins.length > 0) {
        const adminNotifications = admins.map(admin => ({
          user_id: admin.id,
          title: notificationTitle,
          message: `${customer?.name}: ${notificationMessage}`,
          type: notificationType,
          customer_id: customerId,
          action_url: actionUrl,
          is_read: false,
        }));

        await supabase
          .from('notifications')
          .insert(adminNotifications);
      }

      console.log('Notifications created for application status change');
    }

    console.log('Application status updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        application: updatedApplication,
        previousStatus,
        newStatus
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error in update-application-status:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

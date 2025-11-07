import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkUpdateRequest {
  applicationIds: string[];
  newStatus: string;
  comment: string;
  changedBy: string;
}

interface BulkUpdateResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('Only admins can perform bulk status updates');
    }

    const { applicationIds, newStatus, comment, changedBy }: BulkUpdateRequest = await req.json();

    console.log('Bulk status update request:', {
      applicationIds,
      newStatus,
      comment,
      changedBy,
    });

    if (!applicationIds || applicationIds.length === 0) {
      throw new Error('No application IDs provided');
    }

    const result: BulkUpdateResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // Process each application
    for (const applicationId of applicationIds) {
      try {
        // Fetch the application with customer details
        const { data: application, error: fetchError } = await supabase
          .from('account_applications')
          .select(`
            *,
            customer:customers!customer_id (
              id,
              name,
              email,
              user_id
            )
          `)
          .eq('id', applicationId)
          .single();

        if (fetchError || !application) {
          result.failureCount++;
          result.errors.push(`Application ${applicationId}: Not found`);
          continue;
        }

        const previousStatus = application.status;

        // Update the application status
        const { error: updateError } = await supabase
          .from('account_applications')
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId);

        if (updateError) {
          result.failureCount++;
          result.errors.push(`Application ${applicationId}: ${updateError.message}`);
          continue;
        }

        // Add message/comment if provided
        if (comment && comment.trim()) {
          await supabase.from('application_messages').insert({
            application_id: applicationId,
            sender_id: changedBy,
            sender_type: 'admin',
            message: `Status changed from ${previousStatus} to ${newStatus}: ${comment}`,
            is_read: false,
          });
        }

        // Create notification for the customer's assigned user
        if (application.customer?.user_id) {
          const notificationType =
            newStatus === 'completed' || newStatus === 'approved'
              ? 'success'
              : newStatus === 'rejected'
              ? 'error'
              : 'info';

          await supabase.from('notifications').insert({
            user_id: application.customer.user_id,
            type: notificationType,
            title: `Application ${newStatus}`,
            message: `Application for ${application.customer.name} has been ${newStatus}${
              comment ? `: ${comment}` : ''
            }`,
            action_url: `/applications/${applicationId}`,
            is_read: false,
          });
        }

        // Send email notification
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              to: application.customer?.email,
              subject: `Application Status Update - ${newStatus}`,
              customerName: application.customer?.name,
              status: newStatus,
              comment: comment || '',
              applicationId: applicationId,
            },
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the entire operation if email fails
        }

        result.successCount++;
        console.log(`Successfully updated application ${applicationId} to ${newStatus}`);
      } catch (error) {
        result.failureCount++;
        result.errors.push(`Application ${applicationId}: ${error.message}`);
        console.error(`Error updating application ${applicationId}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        successCount: result.successCount,
        failureCount: result.failureCount,
        errors: result.errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Bulk status update error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

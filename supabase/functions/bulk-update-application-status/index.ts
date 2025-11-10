import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid application statuses from database enum
const VALID_STATUSES = [
  'draft',
  'submitted',
  'returned',
  'paid',
  'completed',
  'rejected',
  'under_review',
  'approved',
  'need more info'
] as const;

type ApplicationStatus = typeof VALID_STATUSES[number];

interface BulkUpdateRequest {
  applicationIds: string[];
  newStatus: ApplicationStatus;
  comment: string;
  changedBy: string;
}

interface BulkUpdateResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

// Status transition validation
const validateStatusTransition = (
  from: ApplicationStatus,
  to: ApplicationStatus,
  isAdmin: boolean
): { isValid: boolean; error?: string } => {
  // Non-admin users can only change from 'draft' status
  if (!isAdmin && from !== 'draft') {
    return { isValid: false, error: 'Non-admin users can only change status from draft' };
  }

  // Non-admin users can only change draft to 'rejected' or 'submitted'
  if (!isAdmin && from === 'draft' && to !== 'rejected' && to !== 'submitted') {
    return { isValid: false, error: 'Non-admin users can only change draft to rejected or submitted' };
  }

  // Admin-only transitions
  if (!isAdmin) {
    // Already covered above: non-admin can only work with draft
    return { isValid: true };
  }

  // Admin transitions - validate specific rules
  if (from === 'draft' && (to === 'submitted' || to === 'rejected')) {
    return { isValid: true };
  }

  if (from === 'submitted' && (to === 'returned' || to === 'paid' || to === 'rejected')) {
    return { isValid: true };
  }

  if (from === 'returned' && to === 'submitted') {
    return { isValid: true };
  }

  if (from === 'rejected' && to === 'submitted') {
    return { isValid: true };
  }

  if (from === 'paid') {
    return { isValid: false, error: 'Cannot change status from paid' };
  }

  return { isValid: false, error: `Invalid transition from ${from} to ${to}` };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get authenticated user using anon key (for proper JWT validation)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    console.log('Auth header present, attempting getUser via token');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error in bulk-update-application-status:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user for bulk update:', user.id);

    // Use service role key for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

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

    // Validate status against database enum
    if (!newStatus || !VALID_STATUSES.includes(newStatus as ApplicationStatus)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
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

        // Check if non-admin user has permission to update this application
        if (!isAdmin && application.customer?.user_id !== user.id) {
          result.failureCount++;
          result.errors.push(`Application ${applicationId}: Access denied - you can only update your own applications`);
          continue;
        }

        const previousStatus = application.status;

        // Validate status transition
        const transitionValidation = validateStatusTransition(
          previousStatus as ApplicationStatus,
          newStatus,
          isAdmin
        );

        if (!transitionValidation.isValid) {
          result.failureCount++;
          result.errors.push(`Application ${applicationId}: ${transitionValidation.error}`);
          continue;
        }

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
            sender_type: isAdmin ? 'admin' : 'user',
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

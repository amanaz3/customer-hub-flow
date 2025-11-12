import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestNotificationRequest {
  notificationType: string;
  recipientUserId: string;
  sendInApp: boolean;
  sendEmail: boolean;
  mockData: {
    customerName?: string;
    applicationId?: string;
    taskTitle?: string;
    statusFrom?: string;
    statusTo?: string;
    documentName?: string;
    bulkCount?: number;
    comment?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      notificationType,
      recipientUserId,
      sendInApp,
      sendEmail,
      mockData,
    }: TestNotificationRequest = await req.json();

    console.log("Testing notification:", { notificationType, recipientUserId, sendInApp, sendEmail });

    // Get recipient user info
    const { data: recipient, error: userError } = await supabase
      .from("profiles")
      .select("email, name")
      .eq("id", recipientUserId)
      .single();

    if (userError || !recipient) {
      throw new Error("Recipient user not found");
    }

    const results = {
      inAppSent: false,
      emailSent: false,
      errors: [] as string[],
    };

    // Generate notification content based on type
    let title = "";
    let message = "";
    let emailSubject = "";
    let emailHtml = "";

    switch (notificationType) {
      case "status_change":
        title = `[TEST] Status Updated: ${mockData.customerName || "Test Customer"}`;
        message = `Application status changed from ${mockData.statusFrom || "Draft"} to ${mockData.statusTo || "Submitted"}`;
        emailSubject = `Status Update Test - ${mockData.customerName || "Test Customer"}`;
        emailHtml = `
          <h2>Application Status Update (TEST)</h2>
          <p><strong>Customer:</strong> ${mockData.customerName || "Test Customer"}</p>
          <p><strong>From:</strong> ${mockData.statusFrom || "Draft"}</p>
          <p><strong>To:</strong> ${mockData.statusTo || "Submitted"}</p>
          <p>${mockData.comment || "No comment provided"}</p>
        `;
        break;

      case "task_assignment":
        title = `[TEST] New Task Assigned: ${mockData.taskTitle || "Test Task"}`;
        message = `You have been assigned a new task`;
        emailSubject = `New Task Assignment Test`;
        emailHtml = `
          <h2>New Task Assignment (TEST)</h2>
          <p><strong>Task:</strong> ${mockData.taskTitle || "Test Task"}</p>
          <p>A new task has been assigned to you.</p>
        `;
        break;

      case "bulk_status_change":
        title = `[TEST] Bulk Status Change`;
        message = `${mockData.bulkCount || 5} applications status changed to ${mockData.statusTo || "Rejected"}`;
        emailSubject = `Bulk Status Change Test`;
        emailHtml = `
          <h2>Bulk Status Change (TEST)</h2>
          <p><strong>Count:</strong> ${mockData.bulkCount || 5} applications</p>
          <p><strong>New Status:</strong> ${mockData.statusTo || "Rejected"}</p>
        `;
        break;

      case "document_upload":
        title = `[TEST] Document Uploaded: ${mockData.documentName || "test-document.pdf"}`;
        message = `New document uploaded for ${mockData.customerName || "Test Customer"}`;
        emailSubject = `Document Upload Test`;
        emailHtml = `
          <h2>Document Upload (TEST)</h2>
          <p><strong>Document:</strong> ${mockData.documentName || "test-document.pdf"}</p>
          <p><strong>Customer:</strong> ${mockData.customerName || "Test Customer"}</p>
        `;
        break;

      case "comment":
        title = `[TEST] New Comment: ${mockData.customerName || "Test Customer"}`;
        message = mockData.comment || "Test comment added to customer record";
        emailSubject = `New Comment Test`;
        emailHtml = `
          <h2>New Comment (TEST)</h2>
          <p><strong>Customer:</strong> ${mockData.customerName || "Test Customer"}</p>
          <p><strong>Comment:</strong> ${mockData.comment || "Test comment"}</p>
        `;
        break;

      default:
        title = "[TEST] Test Notification";
        message = "This is a test notification";
        emailSubject = "Test Notification";
        emailHtml = "<p>This is a test notification</p>";
    }

    // Send in-app notification
    if (sendInApp) {
      try {
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: recipientUserId,
            type: "info",
            title,
            message,
            action_url: mockData.applicationId 
              ? `/applications/${mockData.applicationId}` 
              : null,
          });

        if (notifError) {
          results.errors.push(`In-app notification error: ${notifError.message}`);
        } else {
          results.inAppSent = true;
          console.log("In-app notification sent successfully");
        }
      } catch (error) {
        results.errors.push(`In-app notification error: ${error.message}`);
      }
    }

    // Send email notification
    if (sendEmail) {
      try {
        const emailResponse = await resend.emails.send({
          from: "AMANA CRM Test <onboarding@resend.dev>",
          to: [recipient.email],
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #FFA500; padding: 10px; text-align: center; color: white;">
                <strong>🧪 TEST NOTIFICATION - NOT REAL</strong>
              </div>
              ${emailHtml}
              <hr style="margin: 20px 0; border: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This is a test notification sent from the Notification Testing page.
              </p>
            </div>
          `,
        });

        if (emailResponse.error) {
          results.errors.push(`Email error: ${emailResponse.error.message}`);
        } else {
          results.emailSent = true;
          console.log("Email sent successfully:", emailResponse.data);
        }
      } catch (error) {
        results.errors.push(`Email error: ${error.message}`);
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in test-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

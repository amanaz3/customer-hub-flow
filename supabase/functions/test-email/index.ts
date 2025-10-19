import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients } = await req.json().catch(() => ({}));
    const emailList = recipients || ["support@amanafinanz.com"];
    
    console.log('Sending test email to:', emailList);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f9fafb;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 3px solid #3b82f6;">
                      <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                        Test Email - Email Notification System
                      </h1>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        This is a test email from your notification system to verify that email delivery is working correctly.
                      </p>
                      
                      <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        <strong>Test Details:</strong><br>
                        • Sent at: ${new Date().toISOString()}<br>
                        • Resend API: Configured ✓<br>
                        • Email Service: Active ✓
                      </p>
                      
                      <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        If you're receiving this email, your notification system is working perfectly!
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                        This is an automated test email from your application's notification system.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
    
    const emailResponse = await resend.emails.send({
      from: "Amana Corporate <info@amanacorporate.com>",
      to: emailList,
      subject: "Test Email - Notification System",
      html: htmlContent,
    });

    console.log("Test email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${emailList.join(', ')}`,
        recipients: emailList,
        data: emailResponse 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

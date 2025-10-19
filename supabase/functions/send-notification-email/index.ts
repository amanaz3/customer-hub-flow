import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationEmailRequest {
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  customerName?: string;
}

const getEmailTemplate = (data: NotificationEmailRequest) => {
  const { title, message, type, actionUrl, customerName } = data;
  
  const typeColors: Record<string, string> = {
    'status_change': '#3b82f6',
    'comment': '#8b5cf6',
    'document': '#10b981',
    'system': '#f59e0b',
    'info': '#6b7280'
  };

  const color = typeColors[type] || typeColors['info'];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; background-color: #f9fafb;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px; border-bottom: 3px solid ${color};">
                    <h1 style="margin: 0; color: #111827; font-size: 24px; font-weight: 600;">
                      ${title}
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 32px;">
                    ${customerName ? `
                      <p style="margin: 0 0 16px; color: #374151; font-size: 14px;">
                        <strong>Customer:</strong> ${customerName}
                      </p>
                    ` : ''}
                    
                    <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                      ${message}
                    </p>
                    
                    ${actionUrl ? `
                      <table role="presentation" style="margin: 0;">
                        <tr>
                          <td style="border-radius: 6px; background-color: ${color};">
                            <a href="${actionUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px;">
                              View Details
                            </a>
                          </td>
                        </tr>
                      </table>
                    ` : ''}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                      You're receiving this email because you have email notifications enabled in your settings.
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                      To manage your notification preferences, visit your <a href="${actionUrl?.split('/').slice(0, 3).join('/')}/settings" style="color: ${color}; text-decoration: none;">account settings</a>.
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: NotificationEmailRequest = await req.json();
    
    console.log('Sending notification email:', { 
      to: emailData.recipientEmail, 
      type: emailData.type,
      title: emailData.title 
    });

    const htmlContent = getEmailTemplate(emailData);
    
    const emailResponse = await resend.emails.send({
      from: "Amana Corporate <info@amanacorporate.com>",
      to: [emailData.recipientEmail],
      subject: emailData.title,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

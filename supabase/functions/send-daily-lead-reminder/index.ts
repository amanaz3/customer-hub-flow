import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily lead reminder job...");

    // Get all active users (sales assistants)
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("is_active", true);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`Found ${users?.length || 0} active users`);

    const results: Array<{ userId: string; email: boolean; notification: boolean }> = [];

    for (const user of users || []) {
      try {
        // Get leads assigned to this user
        const { data: leads, error: leadsError } = await supabase
          .from("leads")
          .select("id, score, status")
          .eq("assigned_to", user.id)
          .not("status", "in", "(converted,lost)");

        if (leadsError) {
          console.error(`Error fetching leads for user ${user.id}:`, leadsError);
          continue;
        }

        const hotCount = leads?.filter(l => l.score === "hot").length || 0;
        const warmCount = leads?.filter(l => l.score === "warm").length || 0;
        const coldCount = leads?.filter(l => l.score === "cold").length || 0;
        const totalLeads = leads?.length || 0;

        if (totalLeads === 0) {
          console.log(`User ${user.name} has no active leads, skipping`);
          continue;
        }

        // Create in-app notification
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.id,
            title: "Daily Lead Check Reminder",
            message: `You have ${totalLeads} leads to review: ${hotCount} Hot (immediate outreach), ${warmCount} Warm (schedule follow-up), ${coldCount} Cold (nurture sequence). Remember to log all activities!`,
            type: "lead_reminder",
            action_url: "/leads",
          });

        const notificationSent = !notifError;
        if (notifError) {
          console.error(`Error creating notification for ${user.id}:`, notifError);
        }

        // Check user notification preferences for email
        const { data: prefs } = await supabase
          .from("notification_preferences")
          .select("email_notifications_enabled")
          .eq("user_id", user.id)
          .maybeSingle();

        let emailSent = false;
        
        // Send email if enabled (default to true if no preferences)
        if (prefs?.email_notifications_enabled !== false && user.email) {
          try {
            const emailHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Daily Lead Check</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Good morning, ${user.name || 'Team Member'}!</p>
                  </div>
                  
                  <div style="padding: 24px;">
                    <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
                      Here's your daily lead summary. Review and take action!
                    </p>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                      <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${hotCount}</div>
                        <div style="font-size: 12px; color: #991b1b; font-weight: 600;">🔥 HOT</div>
                        <div style="font-size: 11px; color: #b91c1c; margin-top: 4px;">Immediate outreach</div>
                      </div>
                      
                      <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #d97706;">${warmCount}</div>
                        <div style="font-size: 12px; color: #92400e; font-weight: 600;">🌡️ WARM</div>
                        <div style="font-size: 11px; color: #b45309; margin-top: 4px;">Schedule follow-up</div>
                      </div>
                      
                      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: bold; color: #2563eb;">${coldCount}</div>
                        <div style="font-size: 12px; color: #1e40af; font-weight: 600;">❄️ COLD</div>
                        <div style="font-size: 11px; color: #1d4ed8; margin-top: 4px;">Add to nurture</div>
                      </div>
                    </div>
                    
                    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      <p style="color: #374151; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">
                        📋 Remember to log all activities:
                      </p>
                      <ul style="color: #6b7280; font-size: 13px; margin: 0; padding-left: 20px;">
                        <li>📞 Phone calls</li>
                        <li>💬 WhatsApp messages</li>
                        <li>📧 Emails sent</li>
                        <li>📝 Meeting notes</li>
                      </ul>
                    </div>
                    
                    <a href="${Deno.env.get("SITE_URL") || "https://app.example.com"}/leads" 
                       style="display: block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 24px; border-radius: 8px; text-align: center; font-weight: 600;">
                      View My Leads →
                    </a>
                  </div>
                  
                  <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      This is an automated daily reminder from your CRM.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `;

            const emailResponse = await resend.emails.send({
              from: "CRM <notifications@resend.dev>",
              to: [user.email],
              subject: `📊 Daily Lead Check: ${hotCount} Hot, ${warmCount} Warm, ${coldCount} Cold leads`,
              html: emailHtml,
            });

            emailSent = !emailResponse.error;
            if (emailResponse.error) {
              console.error(`Email error for ${user.email}:`, emailResponse.error);
            }
          } catch (emailErr) {
            console.error(`Failed to send email to ${user.email}:`, emailErr);
          }
        }

        results.push({
          userId: user.id,
          email: emailSent,
          notification: notificationSent,
        });

        console.log(`Processed user ${user.name}: notification=${notificationSent}, email=${emailSent}`);
      } catch (userErr) {
        console.error(`Error processing user ${user.id}:`, userErr);
      }
    }

    console.log(`Daily lead reminder completed. Processed ${results.length} users.`);

    return new Response(
      JSON.stringify({
        success: true,
        processedUsers: results.length,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in daily lead reminder:", error);
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

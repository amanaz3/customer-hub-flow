import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DigestData {
  userName: string;
  email: string;
  currentApplications: number;
  targetApplications: number;
  currentCompleted: number;
  targetCompleted: number;
  currentRevenue: number;
  targetRevenue: number;
  daysRemaining: number;
  status: string;
  insights: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysRemaining = daysInMonth - currentDay;

    // Get all users with targets and email notifications enabled
    const { data: targets } = await supabase
      .from('monthly_targets')
      .select('*, profiles(name, email)')
      .eq('month', currentMonth)
      .eq('year', currentYear);

    if (!targets || targets.length === 0) {
      return new Response(JSON.stringify({ message: "No targets found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailPromises = targets.map(async (target) => {
      const profile = target.profiles as any;
      
      // Check notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email_notifications_enabled')
        .eq('user_id', target.user_id)
        .single();

      if (prefs && !prefs.email_notifications_enabled) {
        console.log(`Skipping ${profile.email} - notifications disabled`);
        return null;
      }

      // Get current performance
      const { data: performance } = await supabase.rpc('calculate_monthly_performance', {
        p_user_id: target.user_id,
        p_month: currentMonth,
        p_year: currentYear,
      });

      const perf = performance?.[0] || { actual_applications: 0, actual_completed: 0, actual_revenue: 0 };
      
      const applicationsProgress = target.target_applications > 0
        ? (perf.actual_applications / target.target_applications) * 100
        : 0;
      const completedProgress = target.target_completed > 0
        ? (perf.actual_completed / target.target_completed) * 100
        : 0;

      let status = "on track";
      const insights: string[] = [];

      if (applicationsProgress < 70 && daysRemaining <= 10) {
        status = "at risk";
        insights.push(`Only ${daysRemaining} days left to reach your target.`);
        insights.push(`Need ${target.target_applications - perf.actual_applications} more applications.`);
      } else if (applicationsProgress >= 100) {
        status = "exceeded";
        insights.push("Congratulations! You've exceeded your target! 🎉");
      }

      const digestData: DigestData = {
        userName: profile.name,
        email: profile.email,
        currentApplications: perf.actual_applications,
        targetApplications: target.target_applications,
        currentCompleted: perf.actual_completed,
        targetCompleted: target.target_completed,
        currentRevenue: Number(perf.actual_revenue),
        targetRevenue: target.target_revenue,
        daysRemaining,
        status,
        insights,
      };

      return sendDigestEmail(digestData);
    });

    const results = await Promise.allSettled(emailPromises);
    const sent = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;

    console.log(`Sent ${sent} digest emails`);

    return new Response(
      JSON.stringify({ message: `Sent ${sent} digest emails`, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in monthly-digest-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

async function sendDigestEmail(data: DigestData) {
  const statusColor = data.status === "exceeded" ? "#10b981" : data.status === "at risk" ? "#f59e0b" : "#3b82f6";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .progress-bar { background: #e5e7eb; height: 10px; border-radius: 5px; overflow: hidden; margin: 10px 0; }
        .progress-fill { background: ${statusColor}; height: 100%; transition: width 0.3s; }
        .status-badge { display: inline-block; padding: 8px 16px; background: ${statusColor}; color: white; border-radius: 20px; font-weight: bold; }
        .insight { background: #fef3c7; padding: 12px; margin: 10px 0; border-left: 4px solid #f59e0b; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Monthly Progress Report</h1>
          <p>Hi ${data.userName}, here's your performance update</p>
        </div>
        <div class="content">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="status-badge">Status: ${data.status.toUpperCase()}</span>
            <p style="margin-top: 10px; color: #6b7280;">${data.daysRemaining} days remaining this month</p>
          </div>

          <div class="stat-card">
            <h3>📝 Applications</h3>
            <p><strong>${data.currentApplications}</strong> / ${data.targetApplications} (${((data.currentApplications / data.targetApplications) * 100).toFixed(0)}%)</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min((data.currentApplications / data.targetApplications) * 100, 100)}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <h3>✅ Completed</h3>
            <p><strong>${data.currentCompleted}</strong> / ${data.targetCompleted} (${((data.currentCompleted / data.targetCompleted) * 100).toFixed(0)}%)</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min((data.currentCompleted / data.targetCompleted) * 100, 100)}%"></div>
            </div>
          </div>

          <div class="stat-card">
            <h3>💰 Revenue</h3>
            <p><strong>AED ${data.currentRevenue.toLocaleString()}</strong> / AED ${data.targetRevenue.toLocaleString()} (${((data.currentRevenue / data.targetRevenue) * 100).toFixed(0)}%)</p>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min((data.currentRevenue / data.targetRevenue) * 100, 100)}%"></div>
            </div>
          </div>

          ${data.insights.length > 0 ? `
            <h3 style="margin-top: 30px;">💡 Insights</h3>
            ${data.insights.map(insight => `<div class="insight">${insight}</div>`).join('')}
          ` : ''}

          <div style="text-align: center; margin-top: 30px;">
            <a href="${supabaseUrl.replace('supabase.co', 'lovable.app')}/dashboard" 
               style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Full Dashboard
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated daily digest. To manage your notification preferences, visit your settings.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: "Target Tracker <onboarding@resend.dev>",
      to: [data.email],
      subject: `📊 Daily Progress: ${data.status === "exceeded" ? "🎉" : data.status === "at risk" ? "⚠️" : "✅"} ${data.currentApplications}/${data.targetApplications} Applications`,
      html,
    });

    console.log(`Email sent to ${data.email}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${data.email}:`, error);
    throw error;
  }
}

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Application {
  id: string;
  reference_number: number;
  status: string;
  application_type: string;
  created_at: string;
  updated_at: string;
  customer: {
    name: string;
    company: string;
  } | null;
}

interface Blocker {
  blocker: string;
  affectedApps: number[];
  recommendation: string;
}

interface Action {
  action: string;
  priority: string;
  reason: string;
}

interface ReportRequest {
  teamMemberName: string;
  teamMemberEmail: string;
  applications: Application[];
  stuckApps: Application[];
  aiSummary: string;
  blockers: Blocker[];
  immediateActions: Action[];
  comments: Array<{
    applicationRef: number;
    comment: string;
    date: string;
    status: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      teamMemberName,
      teamMemberEmail,
      applications,
      stuckApps,
      aiSummary,
      blockers,
      immediateActions,
      comments,
    }: ReportRequest = await req.json();

    // Build status distribution
    const statusCounts: Record<string, number> = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    // Format status distribution
    const statusBreakdown = Object.entries(statusCounts)
      .map(([status, count]) => `<li><strong>${status.replace('_', ' ').toUpperCase()}</strong>: ${count}</li>`)
      .join('');

    // Format stuck applications
    const stuckAppsHtml = stuckApps.length > 0 ? `
      <h3 style="color: #dc2626; margin-top: 24px; margin-bottom: 12px;">⚠️ Stuck/Delayed Applications (${stuckApps.length})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #fee; border-bottom: 2px solid #dc2626;">
            <th style="padding: 10px; text-align: left;">Ref #</th>
            <th style="padding: 10px; text-align: left;">Customer</th>
            <th style="padding: 10px; text-align: left;">Status</th>
            <th style="padding: 10px; text-align: left;">Days Stuck</th>
          </tr>
        </thead>
        <tbody>
          ${stuckApps.map(app => {
            const daysStuck = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24));
            return `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-weight: bold;">#${app.reference_number}</td>
                <td style="padding: 10px;">${app.customer?.name || 'N/A'} - ${app.customer?.company || 'N/A'}</td>
                <td style="padding: 10px;">
                  <span style="background-color: #fef3c7; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${app.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style="padding: 10px; color: #dc2626; font-weight: bold;">${daysStuck} days</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    ` : '<p style="color: #059669; font-weight: bold;">✓ No stuck applications! Great work!</p>';

    // Format blockers
    const blockersHtml = blockers.length > 0 ? `
      <h3 style="color: #dc2626; margin-top: 24px; margin-bottom: 12px;">🚧 Identified Blockers</h3>
      ${blockers.map(blocker => `
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin-bottom: 12px;">
          <p style="font-weight: bold; margin-bottom: 8px;">${blocker.blocker}</p>
          <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
            <strong>Affected Applications:</strong> ${blocker.affectedApps.map(ref => `#${ref}`).join(', ')}
          </p>
          <p style="background-color: #fff; padding: 8px; border-radius: 4px; font-size: 14px;">
            <strong>💡 Recommendation:</strong> ${blocker.recommendation}
          </p>
        </div>
      `).join('')}
    ` : '';

    // Format immediate actions
    const actionsHtml = immediateActions.length > 0 ? `
      <h3 style="color: #2563eb; margin-top: 24px; margin-bottom: 12px;">🎯 Immediate Actions Required</h3>
      ${immediateActions.map(action => {
        const priorityColor = action.priority === 'high' ? '#dc2626' : action.priority === 'medium' ? '#f59e0b' : '#10b981';
        return `
        <div style="border-left: 4px solid ${priorityColor}; padding: 12px; margin-bottom: 12px; background-color: #f9fafb;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <p style="font-weight: bold; margin: 0;">${action.action}</p>
            <span style="background-color: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">
              ${action.priority}
            </span>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">${action.reason}</p>
        </div>
      `}).join('')}
    ` : '';

    // Format comments
    const commentsHtml = comments.length > 0 ? `
      <h3 style="color: #7c3aed; margin-top: 24px; margin-bottom: 12px;">💬 Recent Status Comments</h3>
      ${comments.map(comment => `
        <div style="background-color: #faf5ff; border-left: 4px solid #7c3aed; padding: 12px; margin-bottom: 12px;">
          <p style="font-weight: bold; margin-bottom: 4px;">App #${comment.applicationRef} - ${comment.status}</p>
          <p style="font-size: 14px; color: #333; margin-bottom: 4px;">${comment.comment}</p>
          <p style="font-size: 12px; color: #666;">${new Date(comment.date).toLocaleDateString()}</p>
        </div>
      `).join('')}
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; color: white;">
            <h1 style="margin: 0 0 10px 0;">Team Performance Report</h1>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">${teamMemberName}</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 0;">📊 Overview</h2>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 12px 0; font-size: 16px;"><strong>Total Applications:</strong> ${applications.length}</p>
              <p style="margin: 0 0 8px 0; font-weight: bold;">Status Breakdown:</p>
              <ul style="margin: 0; padding-left: 20px;">
                ${statusBreakdown}
              </ul>
            </div>

            <h2 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px;">🤖 AI Performance Analysis</h2>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 15px;">${aiSummary}</p>
            </div>

            ${stuckAppsHtml}
            ${blockersHtml}
            ${actionsHtml}
            ${commentsHtml}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                This report was automatically generated to help you track your application progress.<br>
                Review the recommendations and take action on stuck applications.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Team Reports <onboarding@resend.dev>",
      to: [teamMemberEmail],
      subject: `Team Performance Report - ${teamMemberName} - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Report sent successfully to ${teamMemberEmail}`,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-member-report:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send report" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RESET-PASSWORD] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client using service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep("Authentication failed", { error: userError });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if requesting user is admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      logStep("Admin check failed", { userId: userData.user.id, role: profile?.role });
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user ID and new password from request body
    const { userId, newPassword } = await req.json();
    
    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: "User ID and new password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting password reset", { targetUserId: userId });

    // Check if target user exists and is active
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, name, is_active")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (targetProfile.is_active === false) {
      return new Response(JSON.stringify({ error: "Cannot reset password for inactive user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reset password using Supabase Admin API
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
      user_metadata: {
        password_reset_at: new Date().toISOString(),
        password_reset_by: userData.user.id,
        force_password_change: true
      }
    });

    if (resetError) {
      logStep("Password reset failed", { error: resetError });
      return new Response(JSON.stringify({ error: "Failed to reset password" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Password reset successfully", { 
      targetUserId: userId, 
      targetEmail: targetProfile.email,
      resetBy: userData.user.id
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Password reset successfully for ${targetProfile.name || targetProfile.email}` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in reset-user-password", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-USER] ${step}${detailsStr}`);
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

    // Get the user ID to delete from request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent admin from deleting themselves
    if (userId === userData.user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting soft delete process", { targetUserId: userId });

    // Get user's current email for anonymization
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single();

    if (!targetProfile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create anonymized email
    const timestamp = Date.now();
    const anonymizedEmail = `deleted-user-${timestamp}@deleted.local`;

    // Soft delete: set is_active = false and anonymize email
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_active: false,
        email: anonymizedEmail,
        name: `Deleted User ${timestamp}`,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (updateError) {
      logStep("Profile update failed", { error: updateError });
      return new Response(JSON.stringify({ error: "Failed to soft delete user profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also update auth.users metadata to mark as deleted
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: userData.user.id
      }
    });

    if (authUpdateError) {
      logStep("Auth metadata update failed", { error: authUpdateError });
      // Continue anyway - profile is already soft deleted
    }

    logStep("User soft deleted successfully", { 
      deletedUserId: userId, 
      originalEmail: targetProfile.email,
      anonymizedEmail 
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "User has been soft deleted successfully" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in delete-user", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
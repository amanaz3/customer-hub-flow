import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    // Get the secure deletion password from environment secrets
    const securePassword = Deno.env.get('SECURE_DELETE_PASSWORD');

    if (!securePassword) {
      console.error('SECURE_DELETE_PASSWORD not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Security not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password matches
    const isValid = password === securePassword;

    if (!isValid) {
      // Log failed attempt for security monitoring
      console.warn('Failed deletion password attempt');
    }

    return new Response(
      JSON.stringify({ success: isValid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error verifying delete password:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  data: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (path) {
      case 'trigger':
        const { event, entity_type, entity_id, data } = await req.json();

        if (!event || !entity_type || !entity_id) {
          return new Response(
            JSON.stringify({ error: 'event, entity_type, and entity_id are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get all active webhooks that listen to this event
        const { data: webhooks, error: webhooksError } = await supabase
          .from('crm_webhooks')
          .select('*')
          .eq('is_active', true)
          .contains('events', [event]);

        if (webhooksError) {
          console.error('Error fetching webhooks:', webhooksError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch webhooks' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Prepare webhook payload
        const payload: WebhookPayload = {
          event,
          entity_type,
          entity_id,
          timestamp: new Date().toISOString(),
          data: data || {}
        };

        // Send webhooks to all registered endpoints
        const webhookPromises = (webhooks || []).map(async (webhook) => {
          try {
            // Create signature for webhook verification
            const encoder = new TextEncoder();
            const payloadString = JSON.stringify(payload);
            const key = await crypto.subtle.importKey(
              'raw',
              encoder.encode(webhook.secret_token),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['sign']
            );
            const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadString));
            const signatureHex = Array.from(new Uint8Array(signature))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('');

            // Send webhook
            const response = await fetch(webhook.webhook_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': `sha256=${signatureHex}`,
                'X-Webhook-Event': event,
                'User-Agent': 'Banking-App-Webhook/1.0'
              },
              body: payloadString
            });

            console.log(`Webhook sent to ${webhook.webhook_url}, status: ${response.status}`);

            // Update last triggered timestamp
            await supabase
              .from('crm_webhooks')
              .update({ last_triggered_at: new Date().toISOString() })
              .eq('id', webhook.id);

            return { webhook_id: webhook.id, status: response.status, success: response.ok };
          } catch (error) {
            console.error(`Error sending webhook to ${webhook.webhook_url}:`, error);
            return { webhook_id: webhook.id, error: error.message, success: false };
          }
        });

        const results = await Promise.all(webhookPromises);

        return new Response(
          JSON.stringify({
            message: 'Webhooks triggered',
            results,
            payload
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in webhook handler:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
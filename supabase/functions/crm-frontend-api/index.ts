import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get JWT token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Verify user is authenticated and is admin
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    switch (path) {
      case 'connect':
        if (req.method === 'POST') {
          const { name, crm_type, api_endpoint, api_key, webhook_secret, field_mappings, sync_settings } = await req.json();

          if (!name || !crm_type || !api_endpoint || !api_key) {
            return new Response(
              JSON.stringify({ error: 'name, crm_type, api_endpoint, and api_key are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Hash the API key for security
          const encoder = new TextEncoder();
          const data = encoder.encode(api_key);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const api_key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const { data: config, error: configError } = await supabase
            .from('crm_configurations')
            .insert({
              name,
              crm_type,
              api_endpoint,
              api_key_hash,
              webhook_secret,
              field_mappings: field_mappings || {},
              sync_settings: sync_settings || {},
              created_by: user.user.id
            })
            .select()
            .single();

          if (configError) {
            console.error('Error creating CRM configuration:', configError);
            return new Response(
              JSON.stringify({ error: 'Failed to create CRM configuration' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: config, message: 'CRM connected successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'status':
        if (req.method === 'GET') {
          const { data: configs, error: configsError } = await supabase
            .from('crm_configurations')
            .select(`
              id,
              name,
              crm_type,
              api_endpoint,
              is_active,
              last_sync_at,
              created_at,
              updated_at
            `)
            .eq('is_active', true);

          if (configsError) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch CRM configurations' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: configs }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'sync':
        if (req.method === 'POST') {
          const { crm_config_id, sync_type = 'manual', entity_type } = await req.json();

          if (!crm_config_id || !entity_type) {
            return new Response(
              JSON.stringify({ error: 'crm_config_id and entity_type are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Create sync log entry
          const { data: syncLog, error: syncError } = await supabase
            .from('crm_sync_logs')
            .insert({
              crm_config_id,
              sync_type,
              entity_type,
              status: 'pending'
            })
            .select()
            .single();

          if (syncError) {
            return new Response(
              JSON.stringify({ error: 'Failed to start sync' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Here you would implement the actual sync logic
          // For now, we'll just mark it as completed
          await supabase
            .from('crm_sync_logs')
            .update({
              status: 'success',
              completed_at: new Date().toISOString(),
              records_processed: 0,
              records_success: 0,
              records_failed: 0
            })
            .eq('id', syncLog.id);

          // Update last sync time for the configuration
          await supabase
            .from('crm_configurations')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', crm_config_id);

          return new Response(
            JSON.stringify({ 
              data: syncLog,
              message: 'Sync started successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'sync-history':
        if (req.method === 'GET') {
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
          const offset = (page - 1) * limit;

          const { data: syncLogs, error: logsError, count } = await supabase
            .from('crm_sync_logs')
            .select(`
              *,
              crm_configurations (
                name,
                crm_type
              )
            `)
            .order('started_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (logsError) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch sync history' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const totalCount = count || 0;
          const totalPages = Math.ceil(totalCount / limit);

          return new Response(
            JSON.stringify({
              data: syncLogs,
              pagination: {
                page,
                limit,
                total: totalCount,
                total_pages: totalPages
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'api-keys':
        if (req.method === 'GET') {
          const { data: apiKeys, error: keysError } = await supabase
            .from('crm_api_keys')
            .select(`
              id,
              key_name,
              permissions,
              is_active,
              last_used_at,
              expires_at,
              created_at
            `)
            .eq('is_active', true);

          if (keysError) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch API keys' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: apiKeys }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (req.method === 'POST') {
          const { key_name, permissions = [], expires_at } = await req.json();

          if (!key_name) {
            return new Response(
              JSON.stringify({ error: 'key_name is required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Generate API key
          const apiKey = crypto.randomUUID() + '-' + crypto.randomUUID();
          
          // Hash the API key
          const encoder = new TextEncoder();
          const data = encoder.encode(apiKey);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const key_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          const { data: newApiKey, error: keyError } = await supabase
            .from('crm_api_keys')
            .insert({
              key_name,
              key_hash,
              permissions,
              expires_at,
              created_by: user.user.id
            })
            .select()
            .single();

          if (keyError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create API key' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              data: { ...newApiKey, key: apiKey },
              message: 'API key created successfully. Save this key as it will not be shown again.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Endpoint not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in CRM Frontend API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
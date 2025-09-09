import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-crm-api-key',
};

interface PartnerResponse {
  id: string;
  company_name: string;
  contact_phone: string;
  full_name: string;
  email: string;
  is_active: boolean;
  total_referrals: number;
  successful_referrals: number;
  conversion_rate: string;
  created_at: string;
  updated_at: string;
}

interface ApplicationResponse {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  company_name: string;
  status: string;
  license_type: string;
  annual_turnover: number;
  jurisdiction: string;
  banking_preference: string;
  partner_id: string | null;
  partner_company: string | null;
  partner_contact: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate API request
    const apiKey = req.headers.get('x-crm-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('crm_api_keys')
      .select('*')
      .eq('key_hash', apiKey)
      .eq('is_active', true)
      .single();

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last used timestamp
    await supabase
      .from('crm_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyData.id);

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');
    const partnerId = url.searchParams.get('partner_id');
    const updatedSince = url.searchParams.get('updated_since');

    switch (path) {
      case 'partners':
        if (req.method === 'GET') {
          // Build query for partners (users with role 'user')
          let query = supabase
            .from('profiles')
            .select(`
              id,
              name,
              email,
              is_active,
              created_at,
              updated_at
            `)
            .eq('role', 'user')
            .range(offset, offset + limit - 1);

          if (status === 'active') {
            query = query.eq('is_active', true);
          } else if (status === 'inactive') {
            query = query.eq('is_active', false);
          }

          if (updatedSince) {
            query = query.gte('updated_at', updatedSince);
          }

          const { data: profiles, error: profilesError, count } = await query;

          if (profilesError) {
            console.error('Error fetching partners:', profilesError);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch partners' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get referral statistics for each partner
          const partnersWithStats: PartnerResponse[] = await Promise.all(
            (profiles || []).map(async (profile) => {
              const { data: customers } = await supabase
                .from('customers')
                .select('id, status')
                .eq('user_id', profile.id);

              const totalReferrals = customers?.length || 0;
              const successfulReferrals = customers?.filter(c => 
                ['Complete', 'Sent to Bank'].includes(c.status)
              ).length || 0;
              const conversionRate = totalReferrals > 0 
                ? ((successfulReferrals / totalReferrals) * 100).toFixed(2)
                : '0.00';

              return {
                id: profile.id,
                company_name: '', // Not available in profiles
                contact_phone: '', // Not available in profiles
                full_name: profile.name,
                email: profile.email,
                is_active: profile.is_active,
                total_referrals: totalReferrals,
                successful_referrals: successfulReferrals,
                conversion_rate: `${conversionRate}%`,
                created_at: profile.created_at,
                updated_at: profile.updated_at
              };
            })
          );

          const totalCount = count || 0;
          const totalPages = Math.ceil(totalCount / limit);

          return new Response(
            JSON.stringify({
              data: partnersWithStats,
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

      case 'applications':
        if (req.method === 'GET') {
          // Build query for applications (customers)
          let query = supabase
            .from('customers')
            .select(`
              id,
              name,
              email,
              mobile,
              company,
              status,
              license_type,
              annual_turnover,
              jurisdiction,
              preferred_bank,
              user_id,
              created_at,
              updated_at,
              profiles!customers_user_id_fkey (
                name,
                email
              )
            `)
            .range(offset, offset + limit - 1);

          if (status) {
            query = query.eq('status', status);
          }

          if (partnerId) {
            query = query.eq('user_id', partnerId);
          }

          if (updatedSince) {
            query = query.gte('updated_at', updatedSince);
          }

          const { data: customers, error: customersError, count } = await query;

          if (customersError) {
            console.error('Error fetching applications:', customersError);
            return new Response(
              JSON.stringify({ error: 'Failed to fetch applications' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const applications: ApplicationResponse[] = (customers || []).map(customer => ({
            id: customer.id,
            reference: `AC-${customer.id.slice(0, 8).toUpperCase()}`,
            client_name: customer.name,
            client_email: customer.email,
            client_phone: customer.mobile,
            company_name: customer.company,
            status: customer.status.toLowerCase().replace(' ', '_'),
            license_type: customer.license_type.toLowerCase(),
            annual_turnover: customer.annual_turnover || 0,
            jurisdiction: customer.jurisdiction || '',
            banking_preference: customer.preferred_bank || 'any',
            partner_id: customer.user_id,
            partner_company: '', // Would need additional data
            partner_contact: customer.profiles?.name || null,
            created_at: customer.created_at,
            updated_at: customer.updated_at,
            submitted_at: customer.status !== 'Draft' ? customer.updated_at : null
          }));

          const totalCount = count || 0;
          const totalPages = Math.ceil(totalCount / limit);

          return new Response(
            JSON.stringify({
              data: applications,
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

      case 'webhooks':
        if (req.method === 'GET') {
          const { data: webhooks, error: webhooksError } = await supabase
            .from('crm_webhooks')
            .select('*')
            .eq('is_active', true);

          if (webhooksError) {
            return new Response(
              JSON.stringify({ error: 'Failed to fetch webhooks' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ data: webhooks }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (req.method === 'POST') {
          const { webhook_url, events, is_active = true } = await req.json();

          if (!webhook_url || !events || !Array.isArray(events)) {
            return new Response(
              JSON.stringify({ error: 'webhook_url and events array are required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Generate secret token for webhook verification
          const secretToken = crypto.randomUUID();

          const { data: webhook, error: webhookError } = await supabase
            .from('crm_webhooks')
            .insert({
              webhook_url,
              events,
              api_key_hash: apiKey, // Use the same API key for authentication
              secret_token: secretToken,
              is_active
            })
            .select()
            .single();

          if (webhookError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create webhook' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              data: webhook,
              message: 'Webhook created successfully. Use the secret_token for signature verification.'
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
    console.error('Error in CRM API:', error);
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
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Body = {
  name: string;
  slug: string;
  orgType?: string;
  description?: string;
  primaryColor?: string;
  logoUrl?: string;
  tagline?: string;
  selectedFeatures?: string[];
  plan: 'free' | 'enterprise'; // enterprise allowed only for entitled users
};

const env = (k: string) => Deno.env.get(k) || '';

const envAllowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
const defaultAllowed = ['http://localhost:5000', 'http://localhost:3000'];
const allowedOrigins = envAllowed.length ? envAllowed : defaultAllowed;
const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const body = (await req.json()) as Body;
    const { name, slug, orgType = 'community', description = '', primaryColor = '#8B5CF6', logoUrl, tagline = '', selectedFeatures = [], plan } = body;
    if (!name || !slug || !plan) return new Response(JSON.stringify({ error: 'Missing required fields' }), { headers, status: 400 });

    const supabaseAnon = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: auth } = await supabaseAnon.auth.getUser(token);
    const user = auth.user;
    if (!user?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers, status: 401 });

    // Entitlement check for enterprise
    if (plan === 'enterprise') {
      const { data: ent } = await supabase
        .from('user_entitlements')
        .select('free_unlimited')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!ent?.free_unlimited) {
        return new Response(JSON.stringify({ error: 'Enterprise requires entitlement' }), { headers, status: 403 });
      }
    }

    // Compute max members
    const maxMembers = plan === 'enterprise' ? 10000 : 50;

    // Create organization
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name,
        slug,
        owner_id: user.id,
        subscription_tier: plan === 'enterprise' ? 'enterprise' : 'free',
        subscription_status: 'active',
        max_members: maxMembers,
        settings: { description, type: orgType, tagline, created_via: 'free_flow' },
        onboarding_completed: true,
      })
      .select('id, slug')
      .single();
    if (orgErr) throw orgErr;

    // Add owner membership
    await supabase
      .from('organization_members')
      .insert({ organization_id: org.id, user_id: user.id, role: 'owner', status: 'active' });

    // Update profile
    await supabase
      .from('profiles')
      .update({ current_organization_id: org.id })
      .eq('id', user.id);

    // Optionally store selected features if table exists
    if (selectedFeatures.length) {
      await supabase
        .from('organization_features')
        .insert(selectedFeatures.map((f: string) => ({ organization_id: org.id, feature_key: f, enabled: true })))
        .catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, organization_id: org.id, slug: org.slug }), { headers, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers, status: 500 });
  }
});


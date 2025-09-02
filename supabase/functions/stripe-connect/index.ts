import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Body = {
  mode?: 'onboarding' | 'update';
};

const env = (k: string, required = true) => {
  const v = Deno.env.get(k);
  if (required && (!v || v.length === 0)) throw new Error(`${k} not set`);
  return v || '';
};

const allowed = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
const defaults = ['http://localhost:3000', 'http://localhost:5000'];
const origins = allowed.length ? allowed : defaults;

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && origins.includes(origin) ? origin : origins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const { mode = 'onboarding' } = (await req.json().catch(() => ({}))) as Body;

    const supabaseAnon = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'));

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: auth } = await supabaseAnon.auth.getUser(token);
    const user = auth.user;
    if (!user?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers, status: 401 });

    // Prefer user's current organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('id', user.id)
      .maybeSingle();

    let orgId = profile?.current_organization_id as string | null | undefined;
    if (!orgId) {
      // fallback: first org where user is owner
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      orgId = membership?.organization_id as string | undefined;
    }
    if (!orgId) return new Response(JSON.stringify({ error: 'No organization context' }), { headers, status: 400 });

    const { data: org } = await supabase
      .from('organizations')
      .select('id, stripe_account_id')
      .eq('id', orgId)
      .maybeSingle();
    if (!org) return new Response(JSON.stringify({ error: 'Organization not found' }), { headers, status: 404 });

    let accountId = org.stripe_account_id as string | null | undefined;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { organization_id: org.id },
      });
      accountId = account.id;
      await supabase
        .from('organizations')
        .update({ stripe_account_id: accountId })
        .eq('id', org.id);
    }

    const siteUrl = env('APP_URL', false) || origin || origins[0];
    const returnUrl = `${siteUrl}/admin/organization?stripe=connected`;
    const refreshUrl = `${siteUrl}/admin/organization?stripe=refresh`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: mode === 'update' ? 'account_update' : 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: link.url, account_id: accountId }), { headers, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers, status: 500 });
  }
});


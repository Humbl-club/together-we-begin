import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
});

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const supabaseAnon = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'));

    const token = (req.headers.get('Authorization') || '').replace('Bearer ', '');
    const { data: auth } = await supabaseAnon.auth.getUser(token);
    const user = auth.user;
    if (!user?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers, status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('id', user.id)
      .maybeSingle();
    const orgId = profile?.current_organization_id as string | undefined;
    if (!orgId) return new Response(JSON.stringify({ error: 'No organization context' }), { headers, status: 400 });

    const { data: org } = await supabase
      .from('organizations')
      .select('id, stripe_account_id')
      .eq('id', orgId)
      .maybeSingle();
    if (!org?.stripe_account_id) {
      return new Response(JSON.stringify({ success: false, connected: false }), { headers, status: 200 });
    }

    const acct = await stripe.accounts.retrieve(org.stripe_account_id);

    const update = {
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
    };
    await supabase.from('organizations').update(update).eq('id', org.id);

    return new Response(JSON.stringify({ success: true, ...update }), { headers, status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers, status: 500 });
  }
});

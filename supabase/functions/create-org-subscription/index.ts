import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type Body = {
  plan: 'basic' | 'pro';
  billingCycle?: 'monthly' | 'yearly';
  orgName: string;
  slug: string;
  successUrl: string; // include {CHECKOUT_SESSION_ID}
  cancelUrl: string;
};

const env = (name: string, required = true) => {
  const v = Deno.env.get(name);
  if (required && (!v || v.length === 0)) throw new Error(`${name} not set`);
  return v || '';
}

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

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const body = (await req.json()) as Body;
    const { plan, billingCycle = 'monthly', orgName, slug, successUrl, cancelUrl } = body;

    if (!['basic', 'pro'].includes(plan)) {
      return new Response(JSON.stringify({ error: 'Unsupported plan. Use basic or pro.' }), { headers, status: 400 });
    }

    const supabaseAnon = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader?.replace('Bearer ', '') || '';
    const { data: userData } = await supabaseAnon.auth.getUser(token);
    const user = userData.user;
    if (!user?.email || !user.id) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { headers, status: 401 });
    }

    const stripe = new Stripe(env('STRIPE_SECRET_KEY'));

    // Map plan to Price ID based on billing cycle
    const priceEnvKey = (
      plan === 'basic'
        ? (billingCycle === 'yearly' ? 'STRIPE_PRICE_BASIC_YEARLY' : 'STRIPE_PRICE_BASIC_MONTHLY')
        : (billingCycle === 'yearly' ? 'STRIPE_PRICE_PRO_YEARLY' : 'STRIPE_PRICE_PRO_MONTHLY')
    );
    const priceId = env(priceEnvKey);

    // Reuse or create a customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const created = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customerId = created.id;
    }

    // Optional trial via platform settings
    let trialDays: number | undefined = undefined;
    try {
      const supabaseSrv = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
      const { data: setting } = await supabaseSrv
        .from('platform_settings')
        .select('value')
        .eq('key', 'global_trial')
        .maybeSingle();
      const v = (setting?.value || {}) as any;
      if (v.enabled && typeof v.days === 'number' && v.days > 0) {
        trialDays = v.days;
      }
    } catch {}

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: trialDays ? { trial_period_days: trialDays } : undefined,
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        org_name: orgName,
        org_slug: slug,
        plan,
        billing_cycle: billingCycle,
      }
    });

    return new Response(JSON.stringify({ url: session.url }), { headers, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { headers, status: 500 });
  }
});

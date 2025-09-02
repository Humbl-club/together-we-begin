import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
});

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), { headers, status: 400 });
    }

    const stripe = new Stripe(env('STRIPE_SECRET_KEY'));
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.mode !== 'subscription') {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { headers, status: 400 });
    }

    const subscriptionId = session.subscription as string | undefined;
    const sub = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId) : null;

    // Consider complete with at least a paid/active status
    const isPaid = session.payment_status === 'paid' || sub?.status === 'active' || sub?.status === 'trialing';
    if (!isPaid) {
      return new Response(JSON.stringify({ success: false, status: session.payment_status }), { headers, status: 200 });
    }

    const meta = session.metadata || {};
    const userId = meta.user_id as string | undefined;
    const orgName = meta.org_name as string | undefined;
    const slug = meta.org_slug as string | undefined;
    const plan = (meta.plan as string | undefined) || 'basic';
    const billingCycle = (meta.billing_cycle as string | undefined) || 'monthly';

    if (!userId || !orgName || !slug) {
      return new Response(JSON.stringify({ error: 'Missing metadata' }), { headers, status: 400 });
    }

    const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

    // Compute max members
    const maxMembers = plan === 'pro' ? 1000 : 200;

    // Create organization record
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        slug,
        owner_id: userId,
        subscription_tier: plan,
        subscription_status: 'active',
        max_members: maxMembers,
        settings: { created_via: 'checkout' },
        onboarding_completed: true,
      })
      .select('id, slug')
      .single();

    if (orgErr) throw orgErr;

    // Add owner membership
    await supabase
      .from('organization_members')
      .insert({ organization_id: org.id, user_id: userId, role: 'owner', status: 'active' });

    // Update profile current org
    await supabase
      .from('profiles')
      .update({ current_organization_id: org.id })
      .eq('id', userId);

    // Record billing
    if (sub) {
      const item = sub.items?.data?.[0];
      const amountCents = item?.price?.unit_amount || 0;
      const currency = item?.price?.currency?.toUpperCase() || 'USD';
      const periodStart = new Date(sub.current_period_start * 1000).toISOString();
      const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

      await supabase.from('platform_billing').insert({
        organization_id: org.id,
        subscription_tier: plan === 'pro' ? 'professional' : 'starter',
        billing_cycle: billingCycle,
        amount_cents: amountCents,
        currency,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        status: sub.status,
      });
    }

    return new Response(JSON.stringify({ success: true, organization_id: org.id, slug: org.slug }), { headers, status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { headers, status: 500 });
  }
});


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '');
    const supabaseAnon = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_ANON_KEY') || '');
    const supabaseSrv = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: auth } = await supabaseAnon.auth.getUser(token);
    const user = auth.user;
    if (!user?.email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { headers, status: 401 });

    const { eventId } = await req.json();

    // Fetch event and organization
    const { data: event } = await supabaseSrv
      .from('events')
      .select('id,title,description,price_cents,created_by,organization_id')
      .eq('id', eventId)
      .maybeSingle();
    if (!event || !event.price_cents || event.price_cents <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid or free event' }), { headers, status: 400 });
    }

    let organizationId = event.organization_id as string | undefined;
    if (!organizationId && event.created_by) {
      const { data: prof } = await supabaseSrv
        .from('profiles')
        .select('current_organization_id')
        .eq('id', event.created_by)
        .maybeSingle();
      organizationId = prof?.current_organization_id || undefined;
    }

    let destinationAccount: string | undefined;
    let applicationFeeAmount: number | undefined;
    if (organizationId) {
      const { data: org } = await supabaseSrv
        .from('organizations')
        .select('stripe_account_id, default_fee_bps, charges_enabled, payouts_enabled')
        .eq('id', organizationId)
        .maybeSingle();
      if (org?.stripe_account_id && org.charges_enabled && org.payouts_enabled) {
        destinationAccount = org.stripe_account_id as string;
        const bps = (org.default_fee_bps as number | null) ?? 0;
        if (bps > 0 && event.price_cents) {
          applicationFeeAmount = Math.floor((event.price_cents * bps) / 10000);
        }
      }
    }

    // Find or create customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id || (await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })).id;

    // Create ephemeral key for PaymentSheet
    const eph = await stripe.ephemeralKeys.create({ customer: customerId }, { apiVersion: '2023-10-16' as any });

    // Create PaymentIntent with destination charges
    const intent = await stripe.paymentIntents.create({
      amount: event.price_cents,
      currency: 'eur',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { event_id: eventId, user_id: user.id },
      ...(destinationAccount ? {
        transfer_data: { destination: destinationAccount },
        application_fee_amount: applicationFeeAmount,
        on_behalf_of: destinationAccount,
      } : {}),
    });

    return new Response(JSON.stringify({
      paymentIntentClientSecret: intent.client_secret,
      customerId,
      ephemeralKeySecret: eph.secret,
    }), { headers, status: 200 });

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { headers, status: 500 });
  }
});


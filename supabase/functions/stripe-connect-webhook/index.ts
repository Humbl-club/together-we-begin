import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const env = (k: string, required = true) => {
  const v = Deno.env.get(k);
  if (required && (!v || v.length === 0)) throw new Error(`${k} not set`);
  return v || '';
};

serve(async (req) => {
  try {
    const sig = req.headers.get('stripe-signature') || '';
    const body = await req.text();
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'));
    const secret = env('STRIPE_CONNECT_WEBHOOK_SECRET');

    const event = stripe.webhooks.constructEvent(body, sig, secret);

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;
      const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
      await supabase
        .from('organizations')
        .update({
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
        })
        .eq('stripe_account_id', account.id);
    } else if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
      const eventId = (intent.metadata?.event_id as string) || null;
      const userId = (intent.metadata?.user_id as string) || null;
      if (eventId && userId) {
        // Upsert registration
        await supabase.from('event_registrations').upsert({
          event_id: eventId,
          user_id: userId,
          payment_method: 'stripe',
          stripe_session_id: intent.id,
          payment_status: 'completed'
        }, { onConflict: 'event_id,user_id' });
        // Optionally increment capacity and loyalty points similar to verify-payment
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 400 });
  }
});

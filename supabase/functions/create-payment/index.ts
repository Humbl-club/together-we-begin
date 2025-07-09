import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { eventId, usePoints } = await req.json();
    logStep("Request data received", { eventId, usePoints });

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      throw new Error("Event not found");
    }
    logStep("Event found", { title: event.title, price: event.price_cents });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    logStep("Customer lookup", { customerId: customerId || "new" });

    // If using loyalty points, handle differently
    if (usePoints && event.loyalty_points_price) {
      // Get user profile for points
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("available_loyalty_points")
        .eq("id", user.id)
        .single();

      if (!profile || profile.available_loyalty_points < event.loyalty_points_price) {
        throw new Error("Insufficient loyalty points");
      }

      // Create registration directly
      const { error: regError } = await supabaseClient
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
          payment_method: "loyalty_points",
          loyalty_points_used: event.loyalty_points_price,
          payment_status: "completed"
        });

      if (regError) throw regError;

      // Create loyalty transaction
      await supabaseClient
        .from("loyalty_transactions")
        .insert({
          user_id: user.id,
          type: "redeemed",
          points: event.loyalty_points_price,
          description: `Event registration: ${event.title}`,
          reference_type: "event_registration",
          reference_id: eventId
        });

      return new Response(JSON.stringify({ success: true, paymentMethod: "points" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: event.title,
              description: event.description,
              images: event.image_url ? [event.image_url] : undefined
            },
            unit_amount: event.price_cents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/events?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/events?payment=cancelled`,
      metadata: {
        event_id: eventId,
        user_id: user.id,
      },
    });

    logStep("Stripe session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
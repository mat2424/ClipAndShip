
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting create-payment function");
    
    // Check if Stripe key is available
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not set");
      throw new Error("Stripe configuration error");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error("Authentication failed");
    }
    
    const user = data.user;
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log("User authenticated:", user.id);

    // Get request body
    const { credits, price } = await req.json();
    console.log("Payment request:", { credits, price });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    } else {
      console.log("No existing customer found");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${credits} Video Credits`,
              description: `Credits for AI video generation`,
            },
            unit_amount: price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating payment session:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to create payment session"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

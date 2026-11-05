// SonrisaConnect — create Stripe Checkout Session with 90-day trial.
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_* (allowlist)
// Deploy via Supabase Dashboard → Edge Functions (see SETUP.md).
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function allowedPriceIds(): string[] {
  return [
    Deno.env.get("STRIPE_PRICE_BASIC_MONTHLY"),
    Deno.env.get("STRIPE_PRICE_BASIC_ANNUAL"),
    Deno.env.get("STRIPE_PRICE_GROWTH_MONTHLY"),
    Deno.env.get("STRIPE_PRICE_GROWTH_ANNUAL"),
    Deno.env.get("STRIPE_PRICE_PREMIUM_MONTHLY"),
    Deno.env.get("STRIPE_PRICE_PREMIUM_ANNUAL"),
  ].filter((v): v is string => !!v && !String(v).startsWith("#"));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: uerr } = await supabase.auth.getUser();
    if (uerr || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { priceId, clinicId, billing = "monthly", successUrl, cancelUrl } = body;
    if (!priceId || !clinicId) throw new Error("priceId and clinicId required");
    if (String(priceId).startsWith("#")) throw new Error("Stripe price ID not configured");

    const allowed = allowedPriceIds();
    if (allowed.length === 0) throw new Error("Stripe price allowlist not configured on server");
    if (!allowed.includes(String(priceId))) throw new Error("Invalid price ID");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: clinic, error: cerr } = await admin.from("clinics").select("*").eq("id", clinicId).single();
    if (cerr || !clinic) throw new Error("Clinic not found");
    if (clinic.owner_id !== user.id) throw new Error("Not clinic owner");

    let customerId = clinic.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { clinic_id: clinicId, user_id: user.id },
      });
      customerId = customer.id;
      await admin.from("clinics").update({ stripe_customer_id: customerId }).eq("id", clinicId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 90,
        metadata: { clinic_id: clinicId, billing },
      },
      metadata: { clinic_id: clinicId, billing },
      success_url: successUrl || `${Deno.env.get("SITE_URL") || "https://sonrisaconnect.com"}/dashboard-clinic.html?checkout=success`,
      cancel_url: cancelUrl || `${Deno.env.get("SITE_URL") || "https://sonrisaconnect.com"}/dashboard-clinic.html?checkout=cancel`,
      allow_promotion_codes: true,
      payment_method_collection: "always",
    });

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

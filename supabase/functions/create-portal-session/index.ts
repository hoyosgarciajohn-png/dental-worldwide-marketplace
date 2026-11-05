// SonrisaConnect — Stripe Customer Portal (cancel / change plan anytime).
// Secrets: STRIPE_SECRET_KEY
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { clinicId, returnUrl } = await req.json();
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: clinic, error } = await admin.from("clinics").select("*").eq("id", clinicId).single();
    if (error || !clinic) throw new Error("Clinic not found");
    if (clinic.owner_id !== user.id) throw new Error("Not clinic owner");
    if (!clinic.stripe_customer_id) throw new Error("No Stripe customer yet — start a paid plan first");

    const session = await stripe.billingPortal.sessions.create({
      customer: clinic.stripe_customer_id,
      return_url: returnUrl || `${Deno.env.get("SITE_URL") || "https://sonrisaconnect.com"}/dashboard-clinic.html`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

// SonrisaConnect — Stripe webhook → update clinics.plan / plan_status / trial_end
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PRICE_TO_PLAN: Record<string, string> = {
  // Filled at runtime from env aliases if set; otherwise metadata.plan preferred.
};

function planFromPrice(priceId: string | undefined, metaPlan?: string | null): string {
  if (metaPlan && ["basic","growth","premium"].includes(metaPlan)) return metaPlan;
  const envMap: Record<string, string> = {};
  for (const [env, plan] of [
    ["STRIPE_PRICE_BASIC_MONTHLY", "basic"],
    ["STRIPE_PRICE_BASIC_ANNUAL", "basic"],
    ["STRIPE_PRICE_GROWTH_MONTHLY", "growth"],
    ["STRIPE_PRICE_GROWTH_ANNUAL", "growth"],
    ["STRIPE_PRICE_PREMIUM_MONTHLY", "premium"],
    ["STRIPE_PRICE_PREMIUM_ANNUAL", "premium"],
  ] as const) {
    const v = Deno.env.get(env);
    if (v) envMap[v] = plan;
  }
  Object.assign(PRICE_TO_PLAN, envMap);
  if (priceId && PRICE_TO_PLAN[priceId]) return PRICE_TO_PLAN[priceId];
  return "basic";
}

async function applySubscription(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
  sub: Stripe.Subscription,
  deleted: boolean
) {
  const clinicId = sub.metadata?.clinic_id;
  const priceId = sub.items.data[0]?.price?.id;
  const plan = deleted ? "free" : planFromPrice(priceId, sub.metadata?.plan);
  const status = deleted
    ? "canceled"
    : (sub.status === "trialing" ? "trialing" : sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : sub.status);
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
  const patch: Record<string, unknown> = {
    plan,
    plan_status: status,
    trial_end: trialEnd,
    stripe_subscription_id: sub.id,
    updated_at: new Date().toISOString(),
  };
  if (deleted) patch.featured = false;
  if (clinicId) {
    await admin.from("clinics").update(patch).eq("id", clinicId);
  } else if (typeof sub.customer === "string") {
    await admin.from("clinics").update(patch).eq("stripe_customer_id", sub.customer);
  }
}

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !whSecret) {
    return new Response("Stripe secrets missing", { status: 500 });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16", httpClient: Stripe.createFetchHttpClient() });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, whSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clinicId = session.metadata?.clinic_id;
        if (!clinicId) break;
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        let plan = session.metadata?.plan || "basic";
        let trialEnd: string | null = null;
        let status = "active";
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const priceId = sub.items.data[0]?.price?.id;
          plan = planFromPrice(priceId, session.metadata?.plan);
          status = sub.status === "trialing" ? "trialing" : sub.status === "active" ? "active" : sub.status;
          if (sub.trial_end) trialEnd = new Date(sub.trial_end * 1000).toISOString();
          await admin.from("clinics").update({
            plan,
            plan_status: status,
            trial_end: trialEnd,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
            stripe_subscription_id: subId,
            updated_at: new Date().toISOString(),
          }).eq("id", clinicId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applySubscription(admin, stripe, sub, event.type === "customer.subscription.deleted");
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
        if (customerId) {
          await admin.from("clinics").update({
            plan_status: "past_due",
            updated_at: new Date().toISOString(),
          }).eq("stripe_customer_id", customerId);
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("webhook handler error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

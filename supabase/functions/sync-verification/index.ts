// Sync profiles.email_verified / phone_verified from auth.users.
// Prefer client RPC sync_my_verification_flags(); this function is a trusted fallback.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization");
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await userClient.auth.getUser();
    if (error || !user) throw new Error("Unauthorized");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const emailVerified = !!user.email_confirmed_at;
    const phoneVerified = !!user.phone_confirmed_at;
    const { data, error: uerr } = await admin.from("profiles").update({
      email: user.email || null,
      phone: user.phone || null,
      email_verified: emailVerified,
      phone_verified: phoneVerified,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id).select().single();
    if (uerr) throw uerr;

    return new Response(JSON.stringify({
      ok: true,
      email_verified: emailVerified,
      phone_verified: phoneVerified,
      profile: data,
    }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

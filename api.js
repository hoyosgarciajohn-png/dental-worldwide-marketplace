/* SonrisaConnect data layer (Supabase Postgres + Storage). Load after auth.js. */
(function (global) {
  function sb() { return global.SCAuth && global.SCAuth.getClient(); }

  function mapClinicRow(row) {
    if (!row) return null;
    const prices = row.prices && Object.keys(row.prices).length ? row.prices : (row.services || {});
    const vals = Object.values(prices).filter(n => typeof n === "number" && n > 0);
    return {
      id: row.id,
      name: row.name,
      city: row.city,
      rating: row.rating || 4.8,
      reviews: row.review_count || 0,
      prices,
      description: row.description || "",
      credentials: row.license ? [row.license] : [],
      reviewList: [],
      image: (row.photos && row.photos[0]) || "practice-1.jpg",
      imageAlt: row.name,
      gallery: (row.photos || []).slice(0, 6).map(p => [p, row.name]),
      start: vals.length ? Math.min(...vals) : 0,
      plan: row.plan,
      plan_status: row.plan_status,
      verified: !!row.verified,
      adminVerified: !!row.verified,
      listing_status: row.listing_status,
      email_verified: !!(row.owner_email_verified),
      phone_verified: !!(row.owner_phone_verified),
      featured: !!row.featured,
      whatsapp: row.whatsapp,
      owner_id: row.owner_id,
      raw: row
    };
  }

  async function fetchVerifiedClinics() {
    const client = sb();
    if (!client) return [];
    const { data, error } = await client.from("clinics").select("*, profiles:owner_id(email_verified, phone_verified)").eq("verified", true).eq("listing_status", "published").order("featured", { ascending: false });
    if (error) { console.warn(error); return []; }
    return (data || []).map(row => {
      const mapped = mapClinicRow(row);
      if (mapped && row.profiles) {
        mapped.email_verified = !!row.profiles.email_verified;
        mapped.phone_verified = !!row.profiles.phone_verified;
        mapped.emailVerified = mapped.email_verified;
        mapped.phoneVerified = mapped.phone_verified;
      }
      return mapped;
    });
  }

  async function getMyClinic() {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) return null;
    const { data, error } = await client.from("clinics").select("*").eq("owner_id", user.id).maybeSingle();
    if (error) { console.warn(error); return null; }
    return data;
  }

  async function upsertClinic(fields) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) throw new Error("auth");
    const existing = await getMyClinic();
    if (existing) {
      const { data, error } = await client.from("clinics").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await client.from("clinics").insert({ ...fields, owner_id: user.id, plan: fields.plan || "free", plan_status: "active" }).select().single();
    if (error) throw error;
    return data;
  }

  async function uploadClinicPhoto(clinicId, file) {
    const client = sb();
    if (!client) throw new Error("setup");
    const path = `${clinicId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await client.storage.from("clinic-photos").upload(path, file, { upsert: false });
    if (error) throw error;
    return path;
  }

  async function signedUrl(bucket, path, expires = 3600) {
    const client = sb();
    if (!client || !path) return null;
    if (!path.includes("/") && /\.(jpg|jpeg|png|webp|gif)$/i.test(path)) return path; // local demo asset
    const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expires);
    if (error) { console.warn(error); return null; }
    return data.signedUrl;
  }

  async function createQuoteRequest({ clinicId, treatment, message }) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) throw new Error("auth");
    const profile = await global.SCAuth.getProfile(true);
    if (!global.SCAuth.isEmailVerified(user, profile)) throw new Error("need_email");
    const { data, error } = await client.from("quote_requests").insert({
      patient_id: user.id, clinic_id: clinicId, treatment, message, status: "open"
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function listMyQuotes(asRole) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) return [];
    let q = client.from("quote_requests").select("*, clinics(name, city), profiles:patient_id(full_name, email)").order("created_at", { ascending: false });
    if (asRole === "clinic") {
      const clinic = await getMyClinic();
      if (!clinic) return [];
      q = q.eq("clinic_id", clinic.id);
    } else {
      q = q.eq("patient_id", user.id);
    }
    const { data, error } = await q;
    if (error) { console.warn(error); return []; }
    return data || [];
  }

  async function replyToQuote(quoteId, reply, estimatedUsd) {
    const client = sb();
    if (!client) throw new Error("setup");
    const { data, error } = await client.from("quote_requests").update({
      reply, estimated_usd: estimatedUsd || null, status: "replied", updated_at: new Date().toISOString()
    }).eq("id", quoteId).select().single();
    if (error) throw error;
    return data;
  }

  async function sendMessage({ recipientId, clinicId, quoteId, body }) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) throw new Error("auth");
    const { data, error } = await client.from("messages").insert({
      sender_id: user.id, recipient_id: recipientId, clinic_id: clinicId || null, quote_id: quoteId || null, body
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function listMessages() {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) return [];
    const { data, error } = await client.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false });
    if (error) { console.warn(error); return []; }
    return data || [];
  }

  async function saveClinic(clinicId) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) throw new Error("auth");
    const { error } = await client.from("saved_clinics").upsert({ patient_id: user.id, clinic_id: clinicId });
    if (error) throw error;
  }

  async function unsaveClinic(clinicId) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) throw new Error("auth");
    const { error } = await client.from("saved_clinics").delete().eq("patient_id", user.id).eq("clinic_id", clinicId);
    if (error) throw error;
  }

  async function listSavedClinics() {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) return [];
    const { data, error } = await client.from("saved_clinics").select("clinic_id, clinics(*)").eq("patient_id", user.id);
    if (error) { console.warn(error); return []; }
    return (data || []).map(r => mapClinicRow(r.clinics)).filter(Boolean);
  }

  async function uploadPatientRecord(file, clinicId, quoteId) {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) throw new Error("auth");
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await client.storage.from("patient-records").upload(path, file);
    if (error) throw error;
    const { data, error: e2 } = await client.from("patient_records").insert({
      patient_id: user.id, clinic_id: clinicId || null, quote_id: quoteId || null, storage_path: path, file_name: file.name
    }).select().single();
    if (e2) throw e2;
    return data;
  }

  async function listPatientRecords() {
    const client = sb();
    const user = await global.SCAuth.getUser();
    if (!client || !user) return [];
    const { data, error } = await client.from("patient_records").select("*").eq("patient_id", user.id).order("created_at", { ascending: false });
    if (error) { console.warn(error); return []; }
    return data || [];
  }

  async function adminListClinics() {
    const client = sb();
    if (!client) return [];
    const { data, error } = await client.from("clinics").select("*, profiles:owner_id(email, full_name)").order("created_at", { ascending: false });
    if (error) { console.warn(error); return []; }
    return data || [];
  }

  async function submitClinicForApproval() {
    const clinic = await getMyClinic();
    if (!clinic) throw new Error("no_clinic");
    const user = await global.SCAuth.getUser();
    const profile = await global.SCAuth.getProfile(true);
    if (!global.SCAuth.isEmailVerified(user, profile) || !global.SCAuth.isPhoneVerified(user, profile)) {
      throw new Error("need_verify");
    }
    const client = sb();
    const { data, error } = await client.from("clinics").update({
      listing_status: "pending_review",
      updated_at: new Date().toISOString()
    }).eq("id", clinic.id).select().single();
    if (error) throw error;
    return data;
  }

  async function adminVerifyClinic(id, verified) {
    const client = sb();
    if (!client) throw new Error("setup");
    const { error } = await client.from("clinics").update({ verified: !!verified, listing_status: verified ? "published" : "rejected" }).eq("id", id);
    if (error) throw error;
  }

  async function startCheckout(clinicId, plan, billing) {
    const priceId = global.SC_priceId(plan, billing);
    if (global.SC_isPending(priceId)) throw new Error("stripe-price");
    return global.SCAuth.invokeFunction("create-checkout-session", {
      priceId, clinicId, billing,
      successUrl: (global.SC_CONFIG.SITE_URL || location.origin) + "/dashboard-clinic.html?checkout=success",
      cancelUrl: (global.SC_CONFIG.SITE_URL || location.origin) + "/dashboard-clinic.html?checkout=cancel"
    });
  }

  async function openPortal(clinicId) {
    return global.SCAuth.invokeFunction("create-portal-session", {
      clinicId,
      returnUrl: (global.SC_CONFIG.SITE_URL || location.origin) + "/dashboard-clinic.html"
    });
  }

  function planAllows(planId, feature) {
    const p = (global.SC_PLANS || {})[planId] || global.SC_PLANS.free;
    return !!(p.features && p.features[feature]);
  }

  function planMaxPhotos(planId) {
    return ((global.SC_PLANS || {})[planId] || global.SC_PLANS.free).maxPhotos;
  }

  global.SCApi = {
    mapClinicRow, fetchVerifiedClinics, getMyClinic, upsertClinic, uploadClinicPhoto, signedUrl,
    createQuoteRequest, listMyQuotes, replyToQuote, sendMessage, listMessages,
    saveClinic, unsaveClinic, listSavedClinics, uploadPatientRecord, listPatientRecords,
    adminListClinics, adminVerifyClinic, submitClinicForApproval, startCheckout, openPortal, planAllows, planMaxPhotos
  };
})(window);

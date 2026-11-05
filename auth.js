/* SonrisaConnect auth helpers (Supabase Auth). Load after config.js + supabase-js CDN. */
(function (global) {
  const pending = global.SC_isPending || (v => !v || String(v).charAt(0) === "#");
  const tt = (k, v) => {
    try {
      if (typeof I18N !== "undefined" && I18N && I18N.t) return I18N.t(k, v);
      if (global.I18N && global.I18N.t) return global.I18N.t(k, v);
    } catch (e) {}
    return k;
  };
  let client = null;
  let profileCache = null;

  function configured() {
    return global.SC_isConfigured && global.SC_isConfigured();
  }

  function getClient() {
    if (!configured()) return null;
    if (client) return client;
    if (!global.supabase || !global.supabase.createClient) {
      console.warn("SonrisaConnect: supabase-js CDN not loaded");
      return null;
    }
    const c = global.SC_CONFIG;
    client = global.supabase.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return client;
  }

  const PASS_RULES = [
    { id: "len", test: p => p.length >= 10, key: "js.pwLen" },
    { id: "upper", test: p => /[A-Z]/.test(p), key: "js.pwUpper" },
    { id: "lower", test: p => /[a-z]/.test(p), key: "js.pwLower" },
    { id: "num", test: p => /[0-9]/.test(p), key: "js.pwNum" },
    { id: "sym", test: p => /[^A-Za-z0-9]/.test(p), key: "js.pwSym" }
  ];

  function passwordOk(p, confirm) {
    return PASS_RULES.every(r => r.test(p || "")) && !!p && p === confirm;
  }

  function bindPasswordChecklist(opts) {
    const pass = document.querySelector(opts.passSel);
    const conf = document.querySelector(opts.confirmSel);
    const list = document.querySelector(opts.listSel);
    const submit = document.querySelector(opts.submitSel);
    const t = tt;
    if (!pass || !list) return;
    list.innerHTML = PASS_RULES.map(r =>
      `<li data-rule="${r.id}" class="pw-rule"><span class="dot" aria-hidden="true"></span><span>${t(r.key)}</span></li>`
    ).join("") + `<li data-rule="match" class="pw-rule"><span class="dot" aria-hidden="true"></span><span>${t("js.pwMatch")}</span></li>`;
    const sync = () => {
      const p = pass.value || "", c = conf ? conf.value || "" : p;
      PASS_RULES.forEach(r => {
        const li = list.querySelector(`[data-rule="${r.id}"]`);
        if (li) li.classList.toggle("ok", r.test(p));
      });
      const m = list.querySelector('[data-rule="match"]');
      if (m) m.classList.toggle("ok", !!p && p === c);
      if (submit) submit.disabled = !passwordOk(p, conf ? c : p);
    };
    pass.addEventListener("input", sync);
    if (conf) conf.addEventListener("input", sync);
    sync();
  }

  function bindShowHide(inputSel, btnSel) {
    const input = document.querySelector(inputSel);
    const btn = document.querySelector(btnSel);
    if (!input || !btn) return;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
      const t = tt;
      btn.textContent = show ? t("js.hidePw") : t("js.showPw");
    });
  }

  async function signUp({ email, password, role, fullName }) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const redirectTo = (global.SC_CONFIG.SITE_URL || location.origin) + "/verify.html";
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: redirectTo,
        data: { role: role === "clinic" ? "clinic" : "patient", full_name: fullName || "", locale: (global.I18N && global.I18N.lang) || "en" }
      }
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    profileCache = null;
    return data;
  }

  async function signOut() {
    const sb = getClient();
    profileCache = null;
    if (!sb) return;
    await sb.auth.signOut();
  }

  async function resetPassword(email) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const redirectTo = (global.SC_CONFIG.SITE_URL || location.origin) + "/reset.html";
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }

  async function updatePassword(password) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session || null;
  }

  async function getUser() {
    const s = await getSession();
    return s ? s.user : null;
  }

  async function getProfile(force) {
    if (profileCache && !force) return profileCache;
    const sb = getClient();
    const user = await getUser();
    if (!sb || !user) return null;
    const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) { console.warn(error); return null; }
    profileCache = data;
    return data;
  }

  function isEmailVerified(user, profile) {
    if (user && user.email_confirmed_at) return true;
    if (profile && profile.email_verified) return true;
    // Placeholder / offline demo: treat as unverified when configured, else allow UI shells
    if (!configured()) return true;
    return false;
  }

  function isPhoneVerified(user, profile) {
    if (user && user.phone_confirmed_at) return true;
    if (profile && profile.phone_verified) return true;
    return false;
  }

  async function syncVerificationFlags() {
    const sb = getClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb.rpc("sync_my_verification_flags");
      if (!error && data) { profileCache = data; return data; }
    } catch (e) { console.warn("rpc sync", e); }
    try {
      return await invokeFunction("sync-verification", {});
    } catch (e) {
      console.warn("edge sync", e);
      return null;
    }
  }

  async function resendEmailVerification(email) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const redirectTo = (global.SC_CONFIG.SITE_URL || location.origin) + "/verify.html";
    const { error } = await sb.auth.resend({ type: "signup", email, options: { emailRedirectTo: redirectTo } });
    if (error) throw error;
  }

  async function startPhoneOtp(e164Phone) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const phone = String(e164Phone || "").replace(/\s+/g, "");
    if (!/^\+\d{10,15}$/.test(phone)) throw new Error("bad_phone");
    const { error } = await sb.auth.updateUser({ phone });
    if (error) throw error;
    return phone;
  }

  async function verifyPhoneOtp(e164Phone, token) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const phone = String(e164Phone || "").replace(/\s+/g, "");
    const code = String(token || "").replace(/\D/g, "");
    if (code.length !== 6) throw new Error("bad_code");
    const { data, error } = await sb.auth.verifyOtp({ phone, token: code, type: "phone_change" });
    if (error) {
      // fallback for some projects that use type "sms"
      const retry = await sb.auth.verifyOtp({ phone, token: code, type: "sms" });
      if (retry.error) throw error;
    }
    profileCache = null;
    await syncVerificationFlags();
    return data || true;
  }

  function startCooldown(key, seconds, onTick, onDone) {
    const ends = Date.now() + seconds * 1000;
    try { localStorage.setItem(key, String(ends)); } catch (e) {}
    const tick = () => {
      const left = Math.max(0, Math.ceil((ends - Date.now()) / 1000));
      if (onTick) onTick(left);
      if (left <= 0) { if (onDone) onDone(); return; }
      setTimeout(tick, 250);
    };
    tick();
  }

  function cooldownLeft(key) {
    try {
      const ends = +localStorage.getItem(key);
      if (!ends) return 0;
      return Math.max(0, Math.ceil((ends - Date.now()) / 1000));
    } catch (e) { return 0; }
  }

  async function requireAuth(roles, opts) {
    opts = opts || {};
    const user = await getUser();
    if (!user) {
      if (!configured()) {
        // Offline / setup-pending: allow dashboard shells to render for local review
        return { user: null, profile: { role: (roles && roles[0]) || "patient", is_admin: false }, emailVerified: true, phoneVerified: false };
      }
      location.href = "signin.html?next=" + encodeURIComponent(location.pathname.split("/").pop());
      return null;
    }
    let profile = await getProfile(true);
    if (configured()) {
      await syncVerificationFlags();
      profile = await getProfile(true);
    }
    const emailOk = isEmailVerified(user, profile);
    if (!opts.allowUnverifiedEmail && configured() && !emailOk) {
      const next = encodeURIComponent(location.pathname.split("/").pop() || "index.html");
      location.href = "verify.html?need=email&next=" + next;
      return null;
    }
    if (roles && roles.length && profile && !roles.includes(profile.role) && !profile.is_admin) {
      location.href = profile.role === "clinic" ? "dashboard-clinic.html" : profile.role === "admin" ? "dashboard-admin.html" : "dashboard-patient.html";
      return null;
    }
    return { user, profile, emailVerified: emailOk, phoneVerified: isPhoneVerified(user, profile) };
  }

  function renderVerificationPanel(el, state) {
    if (!el) return;
    const t = tt;
    const items = [
      { ok: !!state.emailVerified, label: t("js.vEmail"), hint: state.emailVerified ? t("js.vEmailOk") : t("js.vEmailNeed"), action: state.emailVerified ? "" : `<a class="btn sm" href="verify.html">${t("js.vEmailCta")}</a>` },
      { ok: !!state.phoneVerified, label: t("js.vPhone"), hint: state.phoneVerified ? t("js.vPhoneOk") : t("js.vPhoneNeed"), action: state.phoneVerified ? "" : `<a class="btn sm" href="account.html#phone">${t("js.vPhoneCta")}</a>` }
    ];
    if (state.role === "clinic") {
      items.push({
        ok: !!state.emailVerified && !!state.phoneVerified,
        label: t("js.vClinicReady"),
        hint: (state.emailVerified && state.phoneVerified) ? t("js.vClinicReadyOk") : t("js.vClinicReadyNeed"),
        action: ""
      });
      items.push({
        ok: !!state.adminVerified,
        label: t("js.vAdmin"),
        hint: state.adminVerified ? t("js.vAdminOk") : t("js.vAdminNeed"),
        action: ""
      });
    } else if (state.role === "patient") {
      items.push({
        ok: !!state.phoneVerified,
        label: t("js.vPatientBadge"),
        hint: state.phoneVerified ? t("js.vPatientBadgeOk") : t("js.vPatientBadgeNeed"),
        action: ""
      });
    }
    el.innerHTML = `<h2>${t("js.vPanelTitle")}</h2><p class="muted">${t("js.vPanelLead")}</p><ul class="pw-checklist verify-checklist">${items.map(it =>
      `<li class="pw-rule${it.ok ? " ok" : ""}"><span class="dot" aria-hidden="true"></span><span><b>${it.label}</b> — ${it.hint}</span>${it.action || ""}</li>`
    ).join("")}</ul>`;
  }

  function bindOtpBoxes(containerSel, onComplete) {
    const box = document.querySelector(containerSel);
    if (!box) return;
    const inputs = [...box.querySelectorAll("input[data-otp]")];
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
        if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
        const code = inputs.map(x => x.value).join("");
        if (code.length === inputs.length && onComplete) onComplete(code);
      });
      inp.addEventListener("keydown", e => {
        if (e.key === "Backspace" && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
      });
      inp.addEventListener("paste", e => {
        const text = (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, inputs.length);
        if (!text) return;
        e.preventDefault();
        text.split("").forEach((ch, j) => { if (inputs[j]) inputs[j].value = ch; });
        if (text.length === inputs.length && onComplete) onComplete(text);
      });
    });
  }

  function verificationBadgesHtml(p) {
    const t = tt;
    const bits = [];
    if (p && (p.emailVerified || p.email_verified)) bits.push(`<span class="vbadge email" title="${t("js.badgeEmail")}">✉ ${t("js.badgeEmailShort")}</span>`);
    if (p && (p.phoneVerified || p.phone_verified)) bits.push(`<span class="vbadge phone" title="${t("js.badgePhone")}">📱 ${t("js.badgePhoneShort")}</span>`);
    if (p && (p.verified || p.adminVerified)) bits.push(`<span class="vbadge admin" title="${t("js.badgeAdmin")}">✔ ${t("js.badgeAdminShort")}</span>`);
    return bits.length ? `<div class="vbadges">${bits.join("")}</div>` : "";
  }


  function dashboardFor(profile) {
    if (!profile) return "signin.html";
    if (profile.is_admin || profile.role === "admin") return "dashboard-admin.html";
    if (profile.role === "clinic") return "dashboard-clinic.html";
    return "dashboard-patient.html";
  }

  async function invokeFunction(name, body) {
    const sb = getClient();
    if (!sb) throw new Error("setup");
    const { data, error } = await sb.functions.invoke(name, { body });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  function showSetupBanner() {
    if (configured()) return;
    if (document.getElementById("scSetupBanner")) return;
    const t = tt;
    const el = document.createElement("div");
    el.id = "scSetupBanner";
    el.className = "setup-banner";
    el.setAttribute("role", "status");
    el.innerHTML = `<div class="wrap"><strong>${t("js.setupTitle")}</strong> ${t("js.setupBody")} <a href="SETUP.md">${t("js.setupLink")}</a></div>`;
    document.body.prepend(el);
  }

  function cookieNotice() {
    try { if (localStorage.getItem("sc_cookies") === "1") return; } catch (e) {}
    if (document.getElementById("scCookie")) return;
    const t = tt;
    const el = document.createElement("div");
    el.id = "scCookie";
    el.className = "cookie-bar";
    el.innerHTML = `<div class="wrap"><p>${t("js.cookieText")} <a href="privacy.html">${t("js.cookiePrivacy")}</a></p><button type="button" class="btn sm" id="scCookieOk">${t("js.cookieOk")}</button></div>`;
    document.body.appendChild(el);
    document.getElementById("scCookieOk").onclick = () => {
      try { localStorage.setItem("sc_cookies", "1"); } catch (e) {}
      el.remove();
    };
  }

  async function updateNavAuth() {
    const links = document.querySelector(".nav .links");
    if (!links) return;
    const t = tt;
    let slot = links.querySelector("[data-auth-slot]");
    if (!slot) {
      // replace Sign In button if present
      const signA = [...links.querySelectorAll("a")].find(a => /signin\.html/i.test(a.getAttribute("href") || ""));
      if (signA) { signA.setAttribute("data-auth-slot", "1"); slot = signA; }
      else {
        slot = document.createElement("a");
        slot.className = "btn sm";
        slot.setAttribute("data-auth-slot", "1");
        links.appendChild(slot);
      }
    }
    if (!configured()) {
      slot.href = "signup.html";
      slot.textContent = t("js.signUp");
      slot.className = "btn sm";
      return;
    }
    const profile = await getProfile();
    if (!profile) {
      slot.href = "signin.html";
      slot.textContent = t("js.signIn");
      slot.className = "btn sm";
      return;
    }
    slot.href = dashboardFor(profile);
    slot.textContent = t("js.myDashboard");
    slot.className = "btn sm";
  }

  global.SCAuth = {
    configured, getClient, PASS_RULES, passwordOk, bindPasswordChecklist, bindShowHide,
    signUp, signIn, signOut, resetPassword, updatePassword,
    getSession, getUser, getProfile, requireAuth, dashboardFor, invokeFunction,
    showSetupBanner, cookieNotice, updateNavAuth,
    isEmailVerified, isPhoneVerified, syncVerificationFlags, resendEmailVerification,
    startPhoneOtp, verifyPhoneOtp, startCooldown, cooldownLeft,
    renderVerificationPanel, bindOtpBoxes, verificationBadgesHtml
  };

  function bootUi() {
    try { showSetupBanner(); cookieNotice(); updateNavAuth(); } catch (e) { console.warn(e); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootUi);
  else bootUi();
})(window);

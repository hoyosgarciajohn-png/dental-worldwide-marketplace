/* SonrisaConnect dashboards. Load after api.js + app.js. */
(function () {
  const $ = s => document.querySelector(s);
  const t = (k, v) => (typeof I18N !== "undefined" && I18N.t) ? I18N.t(k, v) : ((window.I18N && window.I18N.t) ? window.I18N.t(k, v) : k);
  const page = document.body && document.body.dataset.page;

  function tabs() {
    document.querySelectorAll(".dash-tab[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".dash-tab").forEach(b => b.classList.toggle("on", b === btn));
        document.querySelectorAll(".dash-panel").forEach(p => p.classList.toggle("on", p.dataset.panel === btn.dataset.tab));
      });
    });
  }

  function servicesToText(obj) {
    return Object.entries(obj || {}).map(([k, v]) => `${k}=${v}`).join("\n");
  }
  function textToServices(s) {
    const o = {};
    String(s || "").split(/\n+/).forEach(line => {
      const m = line.trim().match(/^([A-Za-z0-9_]+)\s*=\s*(\d+(?:\.\d+)?)$/);
      if (m) o[m[1]] = +m[2];
    });
    return o;
  }

  function lockItems(plan) {
    const p = (SC_PLANS[plan] || SC_PLANS.free);
    const items = [
      { key: "analytics", ok: p.features.analytics, label: t("js.lockAnalytics") },
      { key: "featured", ok: p.features.featured, label: t("js.lockFeatured") },
      { key: "whatsapp", ok: p.features.whatsapp, label: t("js.lockWhatsapp") },
      { key: "photos", ok: true, label: t("js.lockPhotos", { n: p.maxPhotos }) },
      { key: "quotes", ok: true, label: t("js.lockQuotes", { n: p.maxQuotesPerMonth }) }
    ];
    return items;
  }

  async function clinicDash() {
    const auth = await SCAuth.requireAuth(["clinic", "admin"]);
    if (!auth) return;
    tabs();
    let clinic = await SCApi.getMyClinic();
    const paintVerify = () => {
      const panel = $("#clinicVerifyPanel");
      if (!panel) return;
      SCAuth.renderVerificationPanel(panel, {
        emailVerified: auth.emailVerified || SCAuth.isEmailVerified(auth.user, auth.profile),
        phoneVerified: auth.phoneVerified || SCAuth.isPhoneVerified(auth.user, auth.profile),
        role: "clinic",
        adminVerified: !!(clinic && clinic.verified)
      });
      const line = $("#listingStatusLine");
      if (line) line.textContent = clinic ? t("js.listingStatus", { s: clinic.listing_status || "draft" }) : "";
    };
    paintVerify();
    const btnSub = $("#btnSubmitListing");
    if (btnSub) btnSub.onclick = async () => {
      $("#submitListingErr").textContent = "";
      $("#submitListingOk").hidden = true;
      try {
        clinic = await SCApi.submitClinicForApproval();
        $("#submitListingOk").hidden = false;
        paintVerify();
      } catch (e) {
        $("#submitListingErr").textContent = e.message === "need_verify" ? t("js.needEmailPhone") : (e.message || e);
      }
    };

    const fill = () => {
      if (!clinic) return;
      $("#cpName").value = clinic.name || "";
      $("#cpCity").value = clinic.city || "Bogotá";
      $("#cpWa").value = clinic.whatsapp || "";
      $("#cpAddr").value = clinic.address || "";
      $("#cpDesc").value = clinic.description || "";
      $("#cpServices").value = servicesToText(clinic.services || clinic.prices || {});
      const lim = SCApi.planMaxPhotos(clinic.plan || "free");
      $("#cpPhotoLimit").textContent = t("js.photoLimit", { n: lim, plan: t("js.plan_" + (clinic.plan || "free")) });
      $("#cpPhotoList").innerHTML = (clinic.photos || []).map(p => `<div class="item"><span>${p}</span></div>`).join("");
      const st = clinic.plan_status || "active";
      const trial = clinic.trial_end ? I18N.date(new Date(clinic.trial_end)) : "—";
      $("#planStatus").innerHTML = t("js.planStatusLine", {
        plan: `<b>${t("js.plan_" + (clinic.plan || "free"))}</b>`,
        status: st,
        trial
      });
      const billing = { current: "monthly" };
      const renderUpgrades = () => {
        const grid = $("#upgradeGrid");
        grid.innerHTML = ["free", "basic", "growth", "premium"].map(k => {
          const pl = SC_PLANS[k];
          const price = k === "free" ? t("js.freeForever") :
            (billing.current === "annual"
              ? `${I18N.money(pl.annualMonthly)}${t("js.perMo")}`
              : `${I18N.money(pl.monthly)}${t("js.perMo")}`);
          const cur = (clinic.plan || "free") === k;
          const trialNote = k === "free" ? "" : `<small>${t("js.trial90")}</small>`;
          return `<div class="up-card${cur ? " cur" : ""}"><b>${t("js.plan_" + k)}</b><div class="pr">${price}</div>${trialNote}
            ${cur ? `<span class="badge">${t("js.currentPlan")}</span>` :
              (k === "free"
                ? `<button type="button" class="btn ghost sm" disabled>${t("js.included")}</button>`
                : `<button type="button" class="btn sm" data-upgrade="${k}">${t("js.upgradeTo")}</button>`)}
          </div>`;
        }).join("");
        grid.querySelectorAll("[data-upgrade]").forEach(btn => btn.onclick = async () => {
          try {
            if (!SCAuth.configured()) { alert(t("js.setupBody")); return; }
            btn.disabled = true;
            const res = await SCApi.startCheckout(clinic.id, btn.dataset.upgrade, billing.current);
            if (res && res.url) location.href = res.url;
            else alert(t("js.checkoutFail"));
          } catch (e) {
            alert(e.message === "stripe-price" ? t("js.stripePricePending") : (e.message || e));
          } finally { btn.disabled = false; }
        });
      };
      renderUpgrades();
      $("#billMonthly").onclick = () => { billing.current = "monthly"; $("#billMonthly").setAttribute("aria-pressed", "true"); $("#billAnnual").setAttribute("aria-pressed", "false"); renderUpgrades(); };
      $("#billAnnual").onclick = () => { billing.current = "annual"; $("#billAnnual").setAttribute("aria-pressed", "true"); $("#billMonthly").setAttribute("aria-pressed", "false"); renderUpgrades(); };
      $("#btnPortal").onclick = async () => {
        try {
          const res = await SCApi.openPortal(clinic.id);
          if (res && res.url) location.href = res.url;
        } catch (e) { alert(e.message || e); }
      };
      const lock = $("#lockList");
      lock.innerHTML = lockItems(clinic.plan || "free").map(it => {
        if (it.ok && it.key !== "analytics" && it.key !== "featured" && it.key !== "whatsapp") {
          return `<li class="ok">${it.label}</li>`;
        }
        if (it.ok) return `<li class="ok">${it.label}</li>`;
        return `<li class="locked"><span>${it.label}</span> <a class="btn sm" href="#billing" data-goto="billing">${t("js.upgrade")}</a></li>`;
      }).join("");
      lock.querySelectorAll("[data-goto]").forEach(a => a.onclick = e => {
        e.preventDefault();
        document.querySelector('.dash-tab[data-tab="billing"]').click();
      });
    };

    if (!clinic && SCAuth.configured()) {
      // bootstrap empty clinic shell so owner can save
      try {
        clinic = await SCApi.upsertClinic({
          name: auth.profile.full_name || "My Clinic",
          city: "Bogotá",
          plan: "free",
          plan_status: "active",
          services: {},
          prices: {}
        });
      } catch (e) { console.warn(e); }
    }
    fill();

    $("#clinicProfileForm").onsubmit = async e => {
      e.preventDefault();
      $("#cpErr").textContent = "";
      try {
        if (!SCAuth.configured()) { $("#cpErr").textContent = t("js.setupBody"); return; }
        const services = textToServices($("#cpServices").value);
        const payload = {
          name: $("#cpName").value.trim(),
          city: $("#cpCity").value,
          whatsapp: $("#cpWa").value.trim(),
          address: $("#cpAddr").value.trim(),
          description: $("#cpDesc").value.trim(),
          services,
          prices: services
        };
        clinic = await SCApi.upsertClinic(payload);
        const files = [...($("#cpPhotos").files || [])];
        const max = SCApi.planMaxPhotos(clinic.plan || "free");
        const have = (clinic.photos || []).length;
        if (have + files.length > max) {
          $("#cpErr").textContent = t("js.photoLimitErr", { n: max });
          return;
        }
        const paths = [...(clinic.photos || [])];
        for (const f of files) {
          const path = await SCApi.uploadClinicPhoto(clinic.id, f);
          paths.push(path);
        }
        if (files.length) clinic = await SCApi.upsertClinic({ photos: paths });
        $("#cpOk").hidden = false;
        fill();
      } catch (err) {
        $("#cpErr").textContent = err.message || String(err);
      }
    };

    // quotes
    const box = $("#clinicQuotes");
    try {
      const quotes = SCAuth.configured() ? await SCApi.listMyQuotes("clinic") : [];
      if (!quotes.length) box.innerHTML = `<p class="muted">${t("js.noQuotes")}</p>`;
      else box.innerHTML = quotes.map(q => `<article class="qcard" data-id="${q.id}">
        <header><b>${(q.profiles && q.profiles.full_name) || t("js.patient")}</b> · <span class="muted">${q.treatment || ""}</span> · <span class="badge">${q.status}</span></header>
        <p>${(q.message || "").replace(/</g, "&lt;")}</p>
        ${q.reply ? `<p class="muted"><b>${t("js.yourReply")}:</b> ${q.reply.replace(/</g, "&lt;")}</p>` : `
        <label><span>${t("js.reply")}</span><textarea rows="2" data-reply></textarea></label>
        <label><span>${t("js.estUsd")}</span><input type="number" min="1" data-usd/></label>
        <button type="button" class="btn sm" data-send>${t("js.sendReply")}</button>`}
      </article>`).join("");
      box.querySelectorAll("[data-send]").forEach(btn => btn.onclick = async () => {
        const card = btn.closest(".qcard");
        try {
          await SCApi.replyToQuote(card.dataset.id, card.querySelector("[data-reply]").value, +card.querySelector("[data-usd]").value || null);
          location.reload();
        } catch (e) { alert(e.message || e); }
      });
    } catch (e) {
      box.innerHTML = `<p class="err">${e.message || e}</p>`;
    }
  }

  async function patientDash() {
    const auth = await SCAuth.requireAuth(["patient", "admin"]);
    if (!auth) return;
    tabs();
    const pv = $("#patientVerifyPanel");
    if (pv) SCAuth.renderVerificationPanel(pv, {
      emailVerified: auth.emailVerified || SCAuth.isEmailVerified(auth.user, auth.profile),
      phoneVerified: auth.phoneVerified || SCAuth.isPhoneVerified(auth.user, auth.profile),
      role: "patient",
      adminVerified: false
    });
    const saved = $("#savedList");
    try {
      const list = SCAuth.configured() ? await SCApi.listSavedClinics() : [];
      saved.innerHTML = list.length ? list.map(p => `<article class="card pcard"><div class="in"><h3>${p.name}</h3><p class="muted">${p.city}</p><a class="btn sm" href="directory.html">${t("js.viewProfile")}</a></div></article>`).join("")
        : `<p class="muted">${t("js.noSaved")}</p>`;
    } catch (e) { saved.innerHTML = `<p class="err">${e.message}</p>`; }

    $("#recUpload").onclick = async () => {
      $("#recErr").textContent = "";
      try {
        const files = [...($("#recFiles").files || [])];
        if (!files.length) { $("#recErr").textContent = t("js.mPhoto"); return; }
        for (const f of files) await SCApi.uploadPatientRecord(f);
        location.reload();
      } catch (e) { $("#recErr").textContent = e.message || e; }
    };
    try {
      const recs = SCAuth.configured() ? await SCApi.listPatientRecords() : [];
      $("#recList").innerHTML = recs.map(r => `<div class="item"><span>${r.file_name || r.storage_path}</span></div>`).join("") || `<p class="muted">${t("js.noRecords")}</p>`;
    } catch (e) {}

    try {
      const quotes = SCAuth.configured() ? await SCApi.listMyQuotes("patient") : [];
      $("#patientQuotes").innerHTML = quotes.length ? quotes.map(q => `<article class="qcard"><b>${(q.clinics && q.clinics.name) || ""}</b> · ${q.status}<p>${(q.message || "").replace(/</g, "&lt;")}</p>${q.reply ? `<p class="muted">${t("js.clinicReply")}: ${q.reply.replace(/</g, "&lt;")}</p>` : ""}</article>`).join("")
        : `<p class="muted">${t("js.noQuotes")}</p>`;
    } catch (e) {}

    try {
      const msgs = SCAuth.configured() ? await SCApi.listMessages() : [];
      $("#patientMsgs").innerHTML = msgs.length ? msgs.map(m => `<article class="qcard"><p>${(m.body || "").replace(/</g, "&lt;")}</p><span class="muted">${m.created_at || ""}</span></article>`).join("")
        : `<p class="muted">${t("js.noMessages")}</p>`;
    } catch (e) {}
  }

  async function adminDash() {
    const auth = await SCAuth.requireAuth(["admin"]);
    if (!auth) return;
    // also allow is_admin flag
    if (auth.profile && !(auth.profile.is_admin || auth.profile.role === "admin")) {
      location.href = SCAuth.dashboardFor(auth.profile);
      return;
    }
    const tb = $("#adminTable tbody");
    try {
      const rows = SCAuth.configured() ? await SCApi.adminListClinics() : [];
      $("#adminEmpty").hidden = rows.length > 0;
      tb.innerHTML = rows.map(c => `<tr>
        <td>${(c.name || "").replace(/</g, "&lt;")}</td>
        <td>${c.city || ""}</td>
        <td>${c.plan || "free"}</td>
        <td>${c.plan_status || ""}</td>
        <td>${c.verified ? "✓" : "—"}</td>
        <td>${c.verified
          ? `<button type="button" class="btn ghost sm" data-unverify="${c.id}">${t("js.unverify")}</button>`
          : `<button type="button" class="btn sm" data-verify="${c.id}">${t("js.verify")}</button>`}</td>
      </tr>`).join("");
      tb.querySelectorAll("[data-verify]").forEach(b => b.onclick = async () => { await SCApi.adminVerifyClinic(b.dataset.verify, true); location.reload(); });
      tb.querySelectorAll("[data-unverify]").forEach(b => b.onclick = async () => { await SCApi.adminVerifyClinic(b.dataset.unverify, false); location.reload(); });
    } catch (e) {
      $("#adminEmpty").hidden = false;
      $("#adminEmpty").textContent = e.message || e;
    }

    // Principal owner: manage administrators
    const sec = $("#adminsSection");
    if (sec && auth.profile && auth.profile.is_owner) {
      sec.hidden = false;
      const msg = $("#adminsMsg");
      const showMsg = (text, ok) => {
        if (!msg) return;
        msg.textContent = text || "";
        msg.className = "admin-msg " + (ok ? "okmsg" : (text ? "err" : ""));
      };
      const paintAdmins = async () => {
        const atb = $("#adminsTable tbody");
        try {
          const admins = SCAuth.configured() ? await SCApi.listAdmins() : [];
          $("#adminsEmpty").hidden = admins.length > 0;
          atb.innerHTML = admins.map(a => {
            const email = (a.email || "").replace(/</g, "&lt;");
            const name = (a.full_name || "—").replace(/</g, "&lt;");
            const badges = [];
            if (a.is_owner) badges.push(`<span class="badge owner-badge">${t("js.adminOwner")}</span>`);
            if (a.id === auth.user.id) badges.push(`<span class="badge you-badge">${t("js.adminYou")}</span>`);
            const canRemove = !a.is_owner && a.id !== auth.user.id;
            return `<tr>
              <td>${email}</td>
              <td>${name}</td>
              <td>${badges.join(" ") || (a.role || "admin")}</td>
              <td>${canRemove
                ? `<button type="button" class="btn ghost sm" data-remove-admin="${email}">${t("js.adminRemove")}</button>`
                : "—"}</td>
            </tr>`;
          }).join("");
          atb.querySelectorAll("[data-remove-admin]").forEach(b => b.onclick = async () => {
            if (!confirm(t("js.adminRemoveConfirm", { email: b.dataset.removeAdmin }))) return;
            showMsg("");
            try {
              await SCApi.setAdmin(b.dataset.removeAdmin, false);
              showMsg(t("js.adminRemovedOk"), true);
              await paintAdmins();
            } catch (err) {
              showMsg(err.message || String(err), false);
            }
          });
        } catch (err) {
          $("#adminsEmpty").hidden = false;
          $("#adminsEmpty").textContent = err.message || err;
        }
      };
      await paintAdmins();
      const addBtn = $("#adminAddBtn");
      if (addBtn) addBtn.onclick = async () => {
        const email = ($("#adminEmailInput").value || "").trim();
        showMsg("");
        if (!email || !email.includes("@")) {
          showMsg(t("js.adminEmailInvalid"), false);
          return;
        }
        addBtn.disabled = true;
        try {
          await SCApi.setAdmin(email, true);
          $("#adminEmailInput").value = "";
          showMsg(t("js.adminAddedOk", { email }), true);
          await paintAdmins();
        } catch (err) {
          showMsg(err.message || String(err), false);
        } finally {
          addBtn.disabled = false;
        }
      };
    }
  }

  if (page === "dashboard-clinic") clinicDash();
  if (page === "dashboard-patient") patientDash();
  if (page === "dashboard-admin") adminDash();
})();

/* SonrisaConnect runtime config.
   Fill these before go-live (see SETUP.md). Values starting with "#" mean "not configured".
   Site stays usable: demo clinics + clear setup notice. */
window.SC_CONFIG = {
  SUPABASE_URL: "https://fdtbifhgnwdsaohlqtqd.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_EFYX_D0HSPxrGcEmAF320w_QDzVLAbl",
  /* Stripe Price IDs from Dashboard → Products (test mode first). */
  STRIPE_PRICE_BASIC_MONTHLY: "price_1UYVub6dTmzoQM9T9B9sPbKH",
  STRIPE_PRICE_BASIC_ANNUAL: "price_1UYVuc6dTmzoQM9TRKVpWxPI",
  STRIPE_PRICE_GROWTH_MONTHLY: "price_1UYVuc6dTmzoQM9TA4rxrEbG",
  STRIPE_PRICE_GROWTH_ANNUAL: "price_1UYVud6dTmzoQM9TEiwezOSM",
  STRIPE_PRICE_PREMIUM_MONTHLY: "price_1UYVue6dTmzoQM9TCLeLxZ5v",
  STRIPE_PRICE_PREMIUM_ANNUAL: "price_1UYVue6dTmzoQM9TVjOSBRiG",
  SITE_URL: "https://sonrisaconnect.com",
  SUPPORT_EMAIL: "support@sonrisaconnect.com",
  /* Optional: WhatsApp digits only with country code, e.g. 573001234567 */
  WHATSAPP_NUMBER: "#whatsapp-number-pending"
};

window.SC_PLANS = {
  free: {
    id: "free",
    monthly: 0,
    annual: 0,
    annualMonthly: 0,
    trialDays: 0,
    maxPhotos: 3,
    maxQuotesPerMonth: 5,
    features: { analytics: false, featured: false, whatsapp: false, verified: false, unlimitedTreatments: false, maxTreatments: 5 }
  },
  basic: {
    id: "basic",
    monthly: 29,
    annual: 276,
    annualMonthly: 23,
    trialDays: 90,
    maxPhotos: 6,
    maxQuotesPerMonth: 50,
    features: { analytics: false, featured: false, whatsapp: false, verified: false, unlimitedTreatments: false, maxTreatments: 5 }
  },
  growth: {
    id: "growth",
    monthly: 69,
    annual: 660,
    annualMonthly: 55,
    trialDays: 90,
    maxPhotos: 20,
    maxQuotesPerMonth: 200,
    features: { analytics: true, featured: false, whatsapp: true, verified: true, unlimitedTreatments: true, maxTreatments: 999 }
  },
  premium: {
    id: "premium",
    monthly: 149,
    annual: 1428,
    annualMonthly: 119,
    trialDays: 90,
    maxPhotos: 40,
    maxQuotesPerMonth: 9999,
    features: { analytics: true, featured: true, whatsapp: true, verified: true, unlimitedTreatments: true, maxTreatments: 999 }
  }
};

window.SC_isPending = function (v) {
  return !v || String(v).charAt(0) === "#";
};

window.SC_isConfigured = function () {
  const c = window.SC_CONFIG || {};
  return !window.SC_isPending(c.SUPABASE_URL) && !window.SC_isPending(c.SUPABASE_ANON_KEY);
};

window.SC_priceId = function (plan, billing) {
  const c = window.SC_CONFIG || {};
  const map = {
    basic: { monthly: c.STRIPE_PRICE_BASIC_MONTHLY, annual: c.STRIPE_PRICE_BASIC_ANNUAL },
    growth: { monthly: c.STRIPE_PRICE_GROWTH_MONTHLY, annual: c.STRIPE_PRICE_GROWTH_ANNUAL },
    premium: { monthly: c.STRIPE_PRICE_PREMIUM_MONTHLY, annual: c.STRIPE_PRICE_PREMIUM_ANNUAL }
  };
  return (map[plan] && map[plan][billing]) || "#price-pending";
};

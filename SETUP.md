# SonrisaConnect — Setup guide (non-technical)

This turns the static GitHub Pages site into a live marketplace with **Supabase** (accounts, database, file storage, edge functions) and **Stripe** (clinic subscriptions with a 90-day free trial).

You do **not** need a developer laptop for most of this. Prefer the Supabase and Stripe websites (click-and-type). The site files stay **flat** (no folders) for GitHub Pages uploads.

Live site: https://sonrisaconnect.com

---

## What you will create

1. A free Supabase project (auth + Postgres + storage + edge functions)
2. Stripe products/prices in **test mode**, then later live mode
3. Three Edge Functions that talk to Stripe
4. Values pasted into `config.js` on the website

**You must provide:** Supabase project URL + anon key; Stripe secret key + webhook secret + six Price IDs; (optional) WhatsApp business number.

---

## A. Create the Supabase project

1. Go to https://supabase.com and sign up / log in.
2. **New project** → pick a name (e.g. `sonrisaconnect`), a strong database password (save it), and a region close to Colombia or the US.
3. Wait until the project is ready.
4. Open **Project Settings → API**.
5. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon public** key (long JWT starting with `eyJ…`)
6. Keep the **service_role** key secret (only for Edge Functions / server). Never put it in `config.js` or GitHub.

---

## B. Run the database schema

1. In Supabase, open **SQL Editor → New query**.
2. Open the file `supabase/schema.sql` from the backend zip on your computer.
3. Select all, copy, paste into the SQL Editor, click **Run**.
4. Confirm it finishes without errors (green success). This creates tables, security policies (RLS), storage buckets `clinic-photos` and `patient-records`, and plan limits.

---

## C. Auth settings (very important)

1. Supabase → **Authentication → URL configuration**.
2. **Site URL:** `https://sonrisaconnect.com`
3. **Redirect URLs** (add each):
   - `https://sonrisaconnect.com/*`
   - `https://sonrisaconnect.com/verify.html`
   - `https://sonrisaconnect.com/reset.html`
   - `https://sonrisaconnect.com/signin.html`
   - `http://localhost:8080/*` (only if you test on your PC)
4. **Authentication → Providers → Email:** enabled.
5. (Recommended) **Authentication → Email templates:** keep default “Confirm signup” and “Reset password”. These emails are sent by Supabase Auth (noted on the signup pages).
6. Optional: **Authentication → Settings** → set minimum password length to 10 to match the website checklist.

---

## D. Create Stripe products (test mode first)

1. Go to https://dashboard.stripe.com and turn **Test mode ON** (switch in the Dashboard).
2. **Product catalog → Add product** three times:

| Product name | Monthly price | Annual price (save ~20%) |
|---|---|---|
| SonrisaConnect Basic | $29 / month | $276 / year (= $23/mo) |
| SonrisaConnect Growth | $69 / month | $660 / year (= $55/mo) |
| SonrisaConnect Premium | $149 / month | $1,428 / year (= $119/mo) |

3. For each price, open it and copy the **Price ID** (`price_…`). You need **six** IDs (monthly + annual × 3).
4. **Settings → Billing → Customer portal:** enable the portal. Allow customers to cancel subscriptions and update payment methods. Save.
5. **Developers → API keys:** copy the **Secret key** (`sk_test_…`). You will paste it only into Supabase secrets (never into the website).

---

## E. Deploy Edge Functions (Dashboard editor — no CLI needed)

Supabase → **Edge Functions**.

Create these three functions. For each: **Create function** → name exactly as below → paste the code from the matching file in `supabase/functions/…/index.ts` → Deploy.

1. `create-checkout-session`  
   File: `supabase/functions/create-checkout-session/index.ts`  
   Starts Stripe Checkout with `trial_period_days: 90`, card required, metadata `clinic_id`.

2. `create-portal-session`  
   File: `supabase/functions/create-portal-session/index.ts`  
   Opens the Stripe Customer Portal (cancel / change plan anytime).

3. `stripe-webhook`  
   File: `supabase/functions/stripe-webhook/index.ts`  
   Updates `clinics.plan`, `plan_status`, `trial_end` on:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

If the Dashboard editor is unavailable, install the free Supabase CLI once and from the folder that contains `supabase/` run:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook
```

---

## F. Set Edge Function secrets

Supabase → **Edge Functions → Secrets** (or Project Settings → Edge Functions). Add:

| Secret name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` (later `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | from step G (`whsec_…`) |
| `SITE_URL` | `https://sonrisaconnect.com` |
| `STRIPE_PRICE_BASIC_MONTHLY` | `price_…` |
| `STRIPE_PRICE_BASIC_ANNUAL` | `price_…` |
| `STRIPE_PRICE_GROWTH_MONTHLY` | `price_…` |
| `STRIPE_PRICE_GROWTH_ANNUAL` | `price_…` |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_…` |
| `STRIPE_PRICE_PREMIUM_ANNUAL` | `price_…` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are usually injected automatically for Edge Functions. If a function errors about them, add them from **Project Settings → API**.

---

## G. Stripe webhook endpoint

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL (replace `xxxx` with your project ref):  
   `https://xxxx.supabase.co/functions/v1/stripe-webhook`
3. Listen to events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Create the endpoint → reveal **Signing secret** (`whsec_…`) → save it as `STRIPE_WEBHOOK_SECRET` in Supabase (step F). Redeploy the webhook function if you added the secret after the first deploy.

---

## H. Fill `config.js` on the website

Open `config.js` and replace the `#…-pending` placeholders:

```js
SUPABASE_URL: "https://xxxx.supabase.co",
SUPABASE_ANON_KEY: "eyJ…",
STRIPE_PRICE_BASIC_MONTHLY: "price_…",
STRIPE_PRICE_BASIC_ANNUAL: "price_…",
STRIPE_PRICE_GROWTH_MONTHLY: "price_…",
STRIPE_PRICE_GROWTH_ANNUAL: "price_…",
STRIPE_PRICE_PREMIUM_MONTHLY: "price_…",
STRIPE_PRICE_PREMIUM_ANNUAL: "price_…",
SITE_URL: "https://sonrisaconnect.com",
SUPPORT_EMAIL: "support@sonrisaconnect.com",
WHATSAPP_NUMBER: "#whatsapp-number-pending"  // optional, digits only e.g. 573001234567
```

Until these are set, the site shows a yellow **Setup pending** banner and keeps working with demo clinics (it does not break).

---

## I. Upload files to GitHub Pages (flat)

1. Open your GitHub repo that publishes https://sonrisaconnect.com.
2. Upload **all site files from the site zip** into the publishing branch/folder **flat** (same level as `index.html`). Do **not** upload the `supabase/` folder to GitHub Pages.
3. Keep `CNAME` as `sonrisaconnect.com`.
4. Wait 1–2 minutes for Pages to refresh.

---

## J. First admin user

1. Sign up on the site as a patient or clinic (any role).
2. In Supabase → **Table Editor → profiles**, find your row.
3. Set `role` = `admin` and `is_admin` = `true`.
4. Open https://sonrisaconnect.com/dashboard-admin.html to verify clinics.

---



---

## L. Email verification (required for all users)

SonrisaConnect blocks dashboards, quote requests, and clinic publishing until the user confirms email.

1. Supabase → **Authentication → Providers → Email**.
2. Turn **Confirm email** ON (mandatory).
3. **Authentication → Email templates**:
   - Edit **Confirm signup** and **Magic Link** / **Reset password** as needed.
   - You can keep English in the default template and add a short Spanish line, or create a second project email style. The website itself is bilingual; the email body is what Supabase sends.
4. **Redirect URLs** (again): include `https://sonrisaconnect.com/verify.html` and `https://sonrisaconnect.com/account.html`.
5. On the site, unverified users see **Check your email** with a **Resend** button (60-second cooldown).

### Custom SMTP (strongly recommended)

Supabase’s built-in email has **low rate limits** (fine for a quick test, not for real customers).

1. Create a free account at **Resend** (https://resend.com) or **Brevo** (https://www.brevo.com).
2. Verify the domain `sonrisaconnect.com` (or at least the sender) and create an API key / SMTP credentials.
3. Supabase → **Project Settings → Authentication → SMTP Settings** → Enable custom SMTP.
4. Use sender similar to: `support@sonrisaconnect.com` (or `noreply@…` if you prefer).
5. Send a test signup to yourself and confirm the message arrives.

---

## M. Phone / SMS verification (Twilio Verify)

Clinics must verify a phone before submitting a listing for admin approval. Patients can verify phone for a **Verified** badge (optional).

1. Create a Twilio account (free trial is OK to start): https://www.twilio.com
2. In Twilio, create a **Verify** service (Verify → Services → Create).
3. Copy:
   - Account SID
   - Auth Token
   - Verify Service SID
4. Supabase → **Authentication → Providers → Phone**:
   - Enable Phone.
   - Choose **Twilio Verify** (preferred) and paste the three values above.
   - Save.
5. On the site open **account.html** (or Dashboard → Verification → Verify phone):
   - Country picker defaults include **+1 US** and **+57 Colombia**.
   - Send 6-digit SMS code → enter digits → confirm.
6. After a successful OTP, the app calls the trusted RPC `sync_my_verification_flags` (and/or Edge Function `sync-verification`) so `profiles.phone_verified` is set from `auth.users.phone_confirmed_at`. Clients **cannot** set `phone_verified` themselves (blocked by a database trigger).

### SMS cost note

- Twilio charges per SMS / Verify attempt. In the US this is often on the order of about **US$0.05 per SMS**, but **prices change** and **Colombia (and other countries) differ**.
- Always check the current Twilio pricing pages for SMS / Verify in the United States and Colombia before go-live. Do not rely on guessed numbers for budgeting.
- Twilio trial accounts can only text verified destination numbers until you upgrade.

### Deploy the sync-verification function (optional but recommended)

Same method as the Stripe functions: paste `supabase/functions/sync-verification/index.ts` in the Supabase Edge Functions editor and deploy. The browser prefers the SQL RPC first; the Edge Function is a trusted fallback that uses the service role.

---

## N. Verification rules (product)

| Who | Email | Phone | Effect |
|---|---|---|---|
| All users | Required | — | No dashboard / protected actions until email confirmed |
| Patients | Required to request quotes | Optional | Phone adds a Verified badge on their side |
| Clinics | Required | Required before submit | Cannot set listing to pending/published without both; admin then verifies for the directory |
| Public cards | — | — | Show email / phone / admin-verified badges when true |

Re-run the latest `supabase/schema.sql` (or the verification section) in the SQL Editor if your project was created from an older schema.


## K. Go-live checklist

- [ ] Schema ran successfully; buckets `clinic-photos` and `patient-records` exist
- [ ] Auth Site URL + redirect URLs include sonrisaconnect.com
- [ ] Confirm email is ON; test signup requires email link before dashboard
- [ ] Resend email cooldown works on verify.html
- [ ] Custom SMTP configured (Resend or Brevo) before real traffic
- [ ] Phone provider enabled with Twilio Verify; test OTP to a US and a Colombian number if possible
- [ ] Clinic cannot submit listing until email+phone verified
- [ ] Patient cannot create quote without verified email
- [ ] Test-mode signup / login / forgot password emails arrive
- [ ] Clinic can save profile on Free plan (max 3 photos enforced)
- [ ] Upgrade to Basic/Growth/Premium opens Stripe Checkout with **90-day trial** and card required
- [ ] Webhook marks clinic `plan_status` = `trialing` after checkout
- [ ] Customer portal opens from **Manage billing**
- [ ] Cancel in portal → webhook sets plan back toward Free / canceled
- [ ] Directory shows **verified** clinics; unverified stay hidden from public
- [ ] Admin can verify a clinic
- [ ] Switch Stripe to **live mode**, create live prices, update secrets + `config.js` Price IDs, update webhook to live
- [ ] Remove or keep demo clinics as fallback (site keeps demos when DB has zero verified clinics)
- [ ] Cookie notice appears once; language EN/ES works on new pages
- [ ] Support email `support@sonrisaconnect.com` works

---

## Plans (reminder)

| Plan | Monthly | Annual (effective / mo) | Trial | Limits |
|---|---|---|---|---|
| Free | $0 | — | none | 3 photos, 5 quotes/mo; analytics / featured / WhatsApp locked |
| Basic | $29 | $23 | 90 days | 6 photos, 50 quotes/mo |
| Growth | $69 | $55 | 90 days | 20 photos, WhatsApp, analytics |
| Premium | $149 | $119 | 90 days | 40 photos, featured, full analytics |

Limits are enforced in the browser **and** in the database (RLS / triggers).

---

## Caveats

- GitHub Pages is static: secrets never live in the browser. Only the **anon** key is public (protected by RLS).
- Edge Functions need a Supabase paid or free tier that supports functions; stay within free quotas while testing.
- Patient medical files are private in Storage; still avoid uploading unnecessary sensitive documents.
- Do not publish the owner’s personal home address or personal phone on the site.
- After going live, monitor Stripe → Webhooks for failed deliveries.

Questions: support@sonrisaconnect.com

# SonrisaConnect (v5 marketplace frontend)

Static GitHub Pages site wired for **Supabase** (auth, Postgres, storage, edge functions) and **Stripe** subscriptions (90-day trial on paid plans). Fill `config.js`, run `supabase/schema.sql`, deploy functions — see **SETUP.md**.

Until keys are set, the site stays usable with demo clinics and a yellow “Setup pending” banner.

# SonrisaConnect: Dental Tourism Marketplace (v3: practice pricing and onboarding)

A static, clickable prototype that connects US patients with Colombian dental practices. It uses plain HTML, CSS and vanilla JS, with no backend and no build step. All mock data lives in `app.js`. All images are local files (AI-generated, no text in them) that sit at the repo root and are referenced by bare filename, so the site works offline. Only the Google Fonts stylesheet needs a connection; it falls back to system fonts.

## Run locally
Note: copy the 27 .jpg images and favicon.svg from your existing site next to the v3 files first (v3 only contains code files), because pages reference images by bare filename.
- Open `index.html` in a browser, **or**
- Run `python3 -m http.server 8000` in this folder and visit http://localhost:8000

## Languages (English / Spanish)
The site is bilingual. `i18n.js` (loaded before `app.js` on every page) holds all translations and the language logic.
- **Detection:** first visit uses the browser languages (`navigator.languages`): any `es*` shows Spanish, everything else English. The **EN | ES** switch in the header (and in the mobile menu) overrides it and is saved in `localStorage` (`sc_lang`), so it persists across pages. Shareable links: add `?lang=es` or `?lang=en` (this also saves the choice).
- **Markup:** English text stays in the HTML as the source. Elements carry `data-i18n="key"` (text), `data-i18n-html` (text with links/bold), `data-i18n-placeholder`, `data-i18n-aria`, `data-i18n-alt`, `data-i18n-title`; `<title>` and the meta description are tagged too. A tiny inline script in each `<head>` hides the page until Spanish is applied (2.5 s fallback) to avoid a flash of English.
- **Edit a translation:** open `i18n.js` and change the value for that key in `HTML_ES` (page text), `JS_ES` (messages built by `app.js`: validation, modals, cards) or `DATA_ES` (mock practice descriptions, reviews, city blurbs, alt text). Keep `{placeholders}` and HTML tags intact.
- **Add new text:** give the element a new `data-i18n="my_key"` and add `my_key` to both `HTML_EN` and `HTML_ES`. In `app.js` use `t("js.my_key",{name:value})` and add the key to `JS_EN` and `JS_ES`.
- **Check:** `node check-i18n.js` lists any key that is missing in either language (exit code 1 if something is missing).
- Prices stay in USD; Spanish shows `US$29/mes`, numbers and dates use `Intl` (`en-US` / `es-CO`). The WhatsApp prefilled message follows the active language (`js.waMessage`). The join form sends a `language` field.
- SEO: every page has `hreflang` alternates (`en`, `es`, `x-default`) pointing to `https://sonrisaconnect.com/...?lang=..`, plus `og:locale` (`en_US`, alternate `es_CO`; swapped when Spanish is active).
- Domain: the `CNAME` file contains `sonrisaconnect.com` (GitHub Pages custom domain). Do not delete it.

## Deploy to GitHub Pages
1. Create a new public repo on GitHub (e.g. `dental-marketplace`).
2. `git remote add origin https://github.com/<you>/dental-marketplace.git`
3. `git push -u origin main`
4. On the repo, go to **Settings > Pages > Build and deployment > Source: Deploy from a branch**, pick **main** and **/ (root)**, then click Save.
5. After about a minute the site is live at `https://<you>.github.io/dental-marketplace/`. All links are relative, so it works under that subpath.

## Files
```
index.html          Landing: full-bleed hero + search, trust strip, how it works, cost comparison, featured practices, cities, testimonials, FAQ
directory.html      Practice cards with live filters
practice.html       Profile (?id=1..8): credentials, gallery, price list, reviews
upload.html         Record upload (?id=): photos with previews, docs, message, validation
quote.html          Mock quote (?id=): plan, itemized prices, JS total, booking/message modals
for-practices.html  Hero, benefits, how listing works, links to pricing and the onboarding form
pricing.html        NEW. 3 plans with monthly/annual toggle, comparison table, FAQ, free-trial buttons
join.html           NEW. 5-step practice onboarding form (clinic, contact, treatments and USD prices, documents, plan and consent)
privacy.html        NEW. Privacy policy TEMPLATE (review with a lawyer)
terms.html          NEW. Terms of service TEMPLATE (review with a lawyer)
PRICING_RESEARCH.md NEW. Market pricing research with source URLs and the reasoning behind the tiers
help.html           FAQ
signin.html         Mock sign in
styles.css          Teal/navy responsive styles (breakpoints 980px, 820px, 560px)
i18n.js             Translations (EN/ES) and language detection/switch
check-i18n.js       Node script: lists missing translation keys
CNAME               Custom domain (sonrisaconnect.com)
app.js              Site config constants at the very top (Stripe links, form endpoint, WhatsApp), ALL mock data (8 practices, cities) and page logic
*.jpg               27 optimized photos (heroes, practices, cities, patients). In the live repo they sit at the repo root next to index.html (flat layout), and pages reference them by bare filename. They are NOT in this v3 update folder or zip.
favicon.svg         Site icon
DESIGN_NOTES.md     Layout reference notes
```

## Demo walkthrough
1. **Landing:** pick "Implants" + "Medellín", then click Search.
2. **Directory:** filters come pre-applied. Toggle checkboxes, drag the price slider, change the city, or reset. Set a low price to see the empty state.
3. **Profile:** click View Profile to see credentials, the gallery, the USD price table and reviews.
4. **Upload:** click Upload Records and submit empty to see validation. Add photos to see thumbnails, fill in the form and submit to reach the success screen, then click View my quote.
5. **Quote:** see the itemized plan and the computed total with US savings. Accept & Book opens a confirmation, and Ask a Question opens a message modal.
6. The hamburger menu appears below 820px wide. For Practices, Help and Sign In are simple mock pages.

## What changed in v2 (redesign)
- New layout inspired by the owner's Transformational Resonance site (see `DESIGN_NOTES.md`): full-bleed hero with overlay, serif headlines, alternating light/dark sections, trust strip, quote band, richer footer.
- 27 generated photos in `images/` replace every picsum.photos URL. Each of the 8 practices has its own photo, and profile galleries mix in shared clinic photos. All images have alt text.
- Home page: How it works (4 image steps), US vs Colombia cost comparison (computed from the mock data), featured practices, featured cities with photos (link to the filtered directory), technology section, patient testimonials with photos, FAQ and a closing call to action.
- Directory, profile, upload, quote, help and sign-in pages got page banners, image-rich practice cards and a profile gallery with patient avatars on reviews. For Practices has a hero, benefit cards, a how-listing-works section and the apply form.
- Subtle hover effects and scroll fade-in animations (CSS and IntersectionObserver, disabled for reduced-motion users). Fully responsive down to 375px.
- All existing behaviour is unchanged: search to filters, filters and reset, upload validation and success screen, quote total, Accept & Book and Ask modals, mock sign-in. All links are relative.
- Headline claim changed from "up to 70%" to "70%+" because the mock prices work out to roughly 75-80% below the US figures.

## Setup checklist before you take real practices (v3)
Everything below is a one-time owner task. The site already works without them: until a value is set, the pricing buttons show a "Payments open soon" window that sends visitors to the onboarding form, the onboarding form shows a visible "setup needed" screen, and the WhatsApp button explains that chat opens soon.

1. [ ] **Buy the domain** `sonrisaconnect.com` (Namecheap, Cloudflare Registrar, Google Domains successor or similar). Then connect it to GitHub Pages: repo **Settings > Pages > Custom domain**, add the DNS records GitHub shows, and tick **Enforce HTTPS**.
2. [ ] **Set up email** `support@sonrisaconnect.com` (Google Workspace, Zoho Mail free plan, Cloudflare Email Routing or similar). To receive a copy in a personal Gmail, add a forwarding rule or alias from support@ to a Gmail address **you control** (use your own inbox address, not a guessed one). To send as support@ from Gmail, use Gmail Settings > Accounts > "Send mail as". Add the SPF, DKIM and DMARC records your mail provider gives you so messages do not land in spam.
3. [ ] **Create Stripe Payment Links** (Stripe Dashboard > Payment Links). Create 6 recurring prices in USD and one link for each:
   - Basic: $29/month and $276/year
   - Growth: $69/month and $660/year
   - Premium: $149/month and $1,428/year
   For each link set **Free trial: 30 days** (on the Payment Link, under subscription options), and set **After payment: redirect to** `https://<your-domain>/join.html` or a thank-you URL. Then paste the URLs into the constants at the top of `app.js` (replace `'#stripe-link-pending'`):
   `STRIPE_LINK_BASIC`, `STRIPE_LINK_GROWTH`, `STRIPE_LINK_PREMIUM` (monthly) and `STRIPE_LINK_BASIC_ANNUAL`, `STRIPE_LINK_GROWTH_ANNUAL`, `STRIPE_LINK_PREMIUM_ANNUAL` (annual). Turn on the customer portal so practices can cancel themselves. Check with an accountant whether Stripe Tax is needed.
4. [ ] **Create a Formspree form** (formspree.io) and paste its endpoint into `FORM_ENDPOINT` in `app.js`, for example `'https://formspree.io/f/abcdwxyz'`. Notes: the free plan **does not accept file uploads**, so either use a paid plan (up to 10 files, 25 MB each per Formspree's limits) or tell practices to email documents to support@ (the form already says they can). Set Formspree to notify support@sonrisaconnect.com.
5. [ ] **Set the WhatsApp number** in `WHATSAPP_NUMBER` in `app.js`: digits only with country code, e.g. `'573001234567'`. Use a dedicated business number (WhatsApp Business app), not your personal one. Optionally edit `WHATSAPP_MESSAGE`.
6. [ ] **Legal review** (see next section) and replace the sample-data wording in the footer once real practices are live.
7. [ ] Re-test: open pricing.html and click each "Start free trial" button (monthly and annual), submit join.html with real data, and click the WhatsApp button. Do a hard refresh after each upload.

Do **not** put your home address or personal phone number on the site. If a legal page needs a postal address, use a registered-agent or business mailbox address.

## Legal templates (privacy.html and terms.html)
> **TEMPLATE ONLY. This is not legal advice. Review `privacy.html` and `terms.html` with a qualified lawyer (ideally someone who knows both Colombian data-protection law, Ley 1581 de 2012, and US/Florida law) before launch.**
> The same note is in an HTML comment at the top of each file (it is not shown to visitors). Delete the comment once reviewed.

Points for the lawyer to confirm:
- Whether SonrisaConnect must register its databases with the SIC (Superintendencia de Industria y Comercio) in Colombia, and publish a Colombian-law data treatment policy and authorization text in Spanish.
- Handling of patient health data (sensitive data under Ley 1581): authorization wording, retention, and international transfer between Colombia and the US.
- Governing law and venue (the template says Florida) and refund/cancellation terms.
- Whether a postal address, business registration (for example a Florida LLC) and a tax ID are required on the site.
- Colombian tax treatment (VAT/withholding) of US-billed subscriptions to Colombian clinics.
- The patient-facing pages (upload, quote, booking) are still demonstrations that store nothing. Update the privacy policy before turning real patient data on.

## Pricing summary
Full research with sources is in `PRICING_RESEARCH.md`. Proposed tiers (USD, proposals not market prices): Basic $29/month ($276/year), Growth $69/month ($660/year), Premium $149/month ($1,428/year). Annual billing is 20% cheaper. 30-day free trial. Optional success fee: 7% of completed managed bookings (5% on Premium). If you change a price, edit `pricing.html` (visible numbers), `PLANS` in `app.js`, the Stripe prices, and the FAQ and terms text.

## What changed in v3
- **New:** `pricing.html`, `join.html`, `privacy.html`, `terms.html`, `PRICING_RESEARCH.md`.
- **All pages:** Pricing added to the nav, new footer with Privacy and Terms links and the business line "SonrisaConnect, operated by John J Hoyos, support@sonrisaconnect.com", WhatsApp floating button, modal now works on every page.
- `for-practices.html`: calls to action now go to the onboarding form and pricing; mock form removed. `index.html`: "I run a clinic" goes to pricing. `help.html`: practice FAQ and contact entry.
- `app.js`: config constants at the top, pricing toggle and trial modal, multi-step onboarding with validation, endpoint and setup-needed handling, WhatsApp button.
- `styles.css`: appended v3 styles only (existing styles unchanged); added a global `[hidden]` rule.
- No images were added or changed. The site still uses bare image filenames at the repo root, as in v2.

## Update the live site (upload by hand)
1. Unzip `sonrisaconnect_v3_update.zip`. It contains only the changed and new files (no images).
2. In the GitHub repo, use **Add file > Upload files**, drag in every file from the zip (same folder level as `index.html`, overwriting the old ones), and commit. Your existing images stay as they are.
3. Wait about a minute, then hard-refresh the live URL (Ctrl/Cmd+Shift+R) to clear cached CSS and JS.

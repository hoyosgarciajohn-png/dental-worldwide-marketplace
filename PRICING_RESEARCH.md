# SonrisaConnect: practice pricing research (v3)

Research date: **5 November 2026** (America/New_York). All prices below were read from the cited pages on that date unless the row says otherwise. Anything marked **[ESTIMATE]** is my own arithmetic or a proposal, not a published figure. Where a source is secondary (a blog or review site rather than the platform itself), the row says so.

Exchange rate used for COP conversions: **1 USD = 3,221.19 COP** (TRM for 5 Nov 2026, https://www.trmhoy.co/). Conversions are **[ESTIMATE]** and will move with the exchange rate.

## 1. What the market charges practices

### 1a. Medical and dental tourism marketplaces (the closest comparables)

| Platform | Model | Published figure | Source |
|---|---|---|---|
| Dental Departures | Commission only, on **completed** appointments. No set-up, monthly, annual or premium listing fees. Patients pay the clinic directly, then the clinic pays DD. | Rate **not published** (disclosed at onboarding). | Partner page: https://www.partner-signup.dentaldepartures.com/ ; model confirmed by DD's CEO interview: https://www.laingbuissonnews.com/imtj/features/10-of-dental-clinics-may-either-close-or-refocus-on-domestic-patients/ |
| PlacidWay (clinic memberships) | Annual subscription **plus 15% case-management fee** on every plan | Launchpad **free**; Silver **$990/yr**; Gold **$2,150/yr**; Premium Elite **$4,300/yr**; "Search Anywhere" price on application. Monthly equivalents **[ESTIMATE]**: $82.50, $179.17, $358.33. | https://www.placidway.com/PlacidWay-Medical-Tourism-Marketing |
| PlacidWay PlacidTrack (messaging add-on) | Subscription | **$75/month** or **$750/year** (SMS, calls, chat) | https://www.placidway.com/technology-solutions/placidtrack |
| Treatment Abroad (LaingBuisson) | Annual listing fee, native currency | Silver **£200 / €230 per year**; PRO **£875 / €999 per year**; Platinum **£2,150 / €2,450 per year** | https://www.treatmentabroad.com/join/ |
| WhatClinic | Free listing; paid pay-per-lead packs | Leads "may start from **€10 per lead**", varies by clinic type and location; no public subscription found. | https://www.whatclinic.com/about/faqs/ (a US-practice review repeats it: https://edition.us.com/whatclinic-for-providers-guide/) |
| Bookimed | Commission when a referred patient receives treatment; standard listing has no membership, marketing or lead fee; promoted ("Ad") placements are billed per patient inquiry | Rate **not published**; depends on country and is given at agreement. A secondary source says 15-25% per booking, negotiable (**secondary, unverified**). | Review: https://edition.us.com/bookimed-for-providers-guide/ ; secondary range: https://medturkai.com/how-to-get-your-clinic-listed-on-the-top-medical-tourism-aggregators-and-which-ones-are-worth-it/ (fetch failed on 5 Nov; the figure comes from the search snippet) |
| Medigo | Per-referral fee, but the medical-travel platform **shut down in 2020**; the company now only does TPA services | n/a | https://www.laingbuissonnews.com/imtj/opinion/medigo-has-shut-down-their-medical-travel-platform/ |
| Patients Beyond Borders | Dental listings are partnered through Dental Departures. One secondary source claims an annual listing of $2,500-4,500, which conflicts with the DD partnership; **treat as unverified and do not rely on it**. | n/a | https://www.prweb.com/releases/patients_beyond_borders_and_dental_departures_partner_to_help_patients_find_safe_affordable_global_dentistry_options/prweb14522317.htm |

Industry commentary on commission size (secondary, summarised by MediSiam): facilitator fees run **roughly 5-30% of treatment value**, with Maria Todd's range at 7.5-30% or flat $1,500-5,000 per patient, and My 1Health publishing **5-15%**. Source: https://medisiam.com.au/insights/the-commission-arithmetic . The same article notes that listing is free almost everywhere and the rates are rarely published.

### 1b. Domestic / directory and scheduling platforms

| Platform | Model | Published figure | Source |
|---|---|---|---|
| Doctoralia Pro **Colombia** (per specialist, billed annually) | Monthly price, billed annually | Starter **COP 249,000/mo** (≈ **$77** [ESTIMATE]); Plus **COP 279,000/mo** (≈ **$87** [ESTIMATE]); VIP **COP 329,000/mo** (≈ **$102** [ESTIMATE]). Free profile version exists. Add-on "Doctoralia Practice" from COP 40,000 (≈ $12). | https://pro.doctoralia.co/precios/para-especialistas ; secondary cross-check https://revodent.ai/co/vs/doctoralia-pro/ |
| Zocdoc | No upfront or subscription fee; **one-time fee per new-patient booking**, charged at booking even if the patient no-shows | Fee varies by specialty and location and is not published now. Reported figures: **$35** and **$80** (NYC dermatology, CNBC 2019), range **$35-$110** (Crain's NY). Old model was about **$3,600/yr** per doctor. These are historical press reports, not a current rate card. | https://www.zocdoc.com/provider-help/en/articles/10859404-understanding-zocdoc-pricing-and-billing ; https://www.cnbc.com/2019/01/29/zocdoc-moves-ahead-with-its-new-business-model-change.html ; https://prod.crainsnewyork.com/health-pulse/zocdocs-new-pricing-rankles-new-york-doctors |
| Revodent (Colombian clinic software, not a marketplace) | Per dental chair | **$29, $59, $89 USD/month** | https://revodent.ai/co/vs/doctoralia-pro/ (competitor's own comparison page, so secondary) |

### 1c. Payment processing cost for us

Stripe standard pricing: **2.9% + 30¢ per successful domestic card transaction**; Payment Links carry no extra charge and there are no setup or monthly fees. Source: https://stripe.com/pricing . On a $29 charge that is about **$1.14 (3.9%)** [ESTIMATE, domestic card; international cards and currency conversion cost more, so verify in the Stripe dashboard].

## 2. What the data says

1. **Recurring "membership" pricing for travel marketplaces sits at roughly $80-360 per month-equivalent** (PlacidWay), with the cheapest Treatment Abroad tier at £200/€230 per year. Those are US/UK-facing prices.
2. **The Colombian domestic benchmark is about $77-102 per month per specialist** (Doctoralia Pro, billed annually). A Colombian clinic already knows this number, so our entry tier has to land clearly below it.
3. **Most platforms list for free and make their money on results**, usually a commission on completed treatment (Dental Departures, Bookimed, PlacidWay's 15% on top of membership). So a free or very low entry point plus an optional success fee is the norm, and a high subscription with no results guarantee would be out of step.
4. **Commission levels in public sources: PlacidWay 15% (published), 15-25% (Bookimed, secondary), 5-30% (industry commentary), 5-15% (My 1Health, published).** A commission well under 15% is therefore supportable.
5. **Pay-per-booking-regardless-of-outcome (Zocdoc) draws strong provider complaints** when patients no-show (Crain's, CNBC). That argues for charging the optional fee only on **completed** treatment.
6. **Medigo's shutdown** shows that the "Booking.com of medical travel" with a thin 10-15% take and a large support team is hard to run. We should not overbuild or promise coordinator-heavy service at launch, and the subscription gives predictable revenue while commission volume is unproven.

## 3. Proposed tiers (USD) **[all proposals; none are published market prices]**

Annual billing = **20% off** (about two months free). Prices are rounded to whole dollars.

| Tier | Monthly | Annual (per month) | Annual total | Saves vs monthly |
|---|---|---|---|---|
| **Basic** | **$29** | **$23** | **$276** | $72 |
| **Growth** (most popular) | **$69** | **$55** | **$660** | $168 |
| **Premium** | **$149** | **$119** | **$1,428** | $360 |

**30-day free trial** on every tier, cancel before day 30 and pay nothing (to be configured in Stripe, see README).

**Optional success fee ("Managed bookings"): 7% of the treatment value for treatments completed by a patient SonrisaConnect books for the clinic (5% on Premium).** Not charged on inquiries, no-shows or the clinic's own patients. Clinics may leave it off and use the listing only. Reasoning: it sits at the low end of the published/commentary range (5-15% My 1Health, 15% PlacidWay, 15-25% Bookimed secondary), is charged only on completed treatment (the Dental Departures model, not the Zocdoc complaint-prone model), and gives the platform upside only when the clinic earns. **[ESTIMATE]: 7% and 5% are my proposal; adjust after talking to 3-5 pilot clinics.**

### Why these numbers

- **Basic $29** is about **38% of Doctoralia Pro Colombia's Starter** (≈ $77) and about 28% of PlacidWay Silver's monthly equivalent ($82.50) [ESTIMATE ratios]. It sits at the same level as the cheapest clinic software in the sources (Revodent $29), so a solo dentist can say yes without a budget meeting.
- **Growth $69** is below Doctoralia Pro Starter (≈ $77) and below PlacidWay Silver (≈ $82.50/month) yet includes the quote builder, verified badge and priority placement that those entry tiers do not advertise in the sources above. At annual billing it is **$55/month**.
- **Premium $149** is below PlacidWay Gold's monthly equivalent ($179.17) and well below Premium Elite ($358.33). It is aimed at multi-dentist or implant-centred clinics in Bogotá, Medellín and Cartagena that want featured placement and analytics.
- **Break-even [ESTIMATE, illustrative only, assumes an average completed case of $1,200 which is my placeholder, not a market figure]:** on Growth, one managed completed booking costs the clinic about $84 of success fee (7%) and the subscription is $69/month, so a clinic needs roughly **one extra patient a month** for the platform to pay for itself. Validate that average case value with pilot clinics before quoting it publicly.
- **Margin check [ESTIMATE]:** Stripe takes about $1.14 on a $29 charge and about $2.30 on $69 (2.9% + 30¢), so card fees stay under 4% on every tier.

### Risks and open questions

- Competitors list clinics for free. If conversion from the 30-day trial is low, consider a permanently free "Listed" profile (name, city, phone) and keep Basic as the first paid step. This is a product decision, not a research finding.
- We have no traffic yet. The pricing page deliberately promises **no lead volume**. Founding-practice discounts are a better lever than lower list prices.
- Doctoralia prices are COP billed annually and move with the exchange rate. Re-check the page before launch.
- Zocdoc figures are 2019-era press reports. The current rate card is not public.
- Bookimed's 15-25% and Patients Beyond Borders' $2,500-4,500 come from one secondary source that I could not open; both are flagged unverified and are not used to set our prices.
- Taxes: Colombian clinics may owe withholding/IVA on a US-billed service. Ask a Colombian accountant. Stripe Tax is configurable on Payment Links.

## 4. Source list

- https://www.partner-signup.dentaldepartures.com/
- https://www.laingbuissonnews.com/imtj/features/10-of-dental-clinics-may-either-close-or-refocus-on-domestic-patients/
- https://www.placidway.com/PlacidWay-Medical-Tourism-Marketing
- https://www.placidway.com/technology-solutions/placidtrack
- https://www.treatmentabroad.com/join/
- https://www.whatclinic.com/about/faqs/
- https://edition.us.com/whatclinic-for-providers-guide/
- https://edition.us.com/bookimed-for-providers-guide/
- https://medturkai.com/how-to-get-your-clinic-listed-on-the-top-medical-tourism-aggregators-and-which-ones-are-worth-it/ (secondary, snippet only)
- https://www.laingbuissonnews.com/imtj/opinion/medigo-has-shut-down-their-medical-travel-platform/
- https://www.prweb.com/releases/patients_beyond_borders_and_dental_departures_partner_to_help_patients_find_safe_affordable_global_dentistry_options/prweb14522317.htm
- https://medisiam.com.au/insights/the-commission-arithmetic
- https://pro.doctoralia.co/precios/para-especialistas
- https://revodent.ai/co/vs/doctoralia-pro/
- https://www.zocdoc.com/provider-help/en/articles/10859404-understanding-zocdoc-pricing-and-billing
- https://www.cnbc.com/2019/01/29/zocdoc-moves-ahead-with-its-new-business-model-change.html
- https://prod.crainsnewyork.com/health-pulse/zocdocs-new-pricing-rankles-new-york-doctors
- https://stripe.com/pricing
- https://www.trmhoy.co/
- https://formspree.io/plans/ (file uploads need a paid Formspree plan; limits per https://help.formspree.io/articles/building-your-form/file-uploads)
- Colombian data protection (Ley 1581 de 2012, health data is sensitive and needs prior, express, informed authorization): https://sedeelectronica.sic.gov.co/sites/default/files/normatividad/Ley_1581_2012.pdf and https://www.sic.gov.co/content/%C2%BFqu%C3%A9-condiciones-tiene-la-autorizaci%C3%B3n-para-el-tratamiento-de-datos-sensibles

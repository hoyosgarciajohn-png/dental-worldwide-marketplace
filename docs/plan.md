# Dental Worldwide Marketplace Consolidated Plan

Version 1.0 | November 4, 2026 | Owner-approved planning choices A1–A4; Chat 06 corrections incorporated; focused closure pending

## 1. Executive decision

Build a bilingual assisted dental marketplace in bounded increments, using fictional data for all development and pre-live testing. Perform genuine real-life validation in a separately authorized live environment phase. Complete provider, privacy, clinical and commercial prerequisites before the corresponding real activity. Public launch is a separate decision.

This document consolidates scope, the commercial hypothesis, financial boundaries, responsibilities, technology, milestones and acceptance gates. John approved planning choices A1–A4 on November 4, 2026, following the summary that explicitly separated planning approval from spending and public launch and retained separate build/live gates. Chat 06's independent planning review is CONDITIONAL; professional clearance and focused correction closure remain pending. A5 implementation and A6 live/public actions are not granted by this approval.

This is now the controlling planning baseline for approved choices A1–A4. Implementation must use this baseline once separately authorized under A5 and reviewed for that purpose. Preserve the prior master as the historical decision/evidence log and detailed specifications as supporting drafts. No unresolved real-world question may be silently treated as approved.

## 2. First-release scope recommendation

| Decision | Proposed definition |
|---|---|
| Patient segment | U.S.-resident adults, 18+, English or Spanish speaking, considering self-pay planned dental care; initial acquisition experiment focused on Florida residents |
| First destination | Cali, Colombia, as a limited initial corridor; further countries/cities later under separate assessment |
| Working example | Clínica Denta SAS for research context only; not a partner, confirmed owner contact or accepted provider |
| Development dataset | At least 20 fictional patients, five fictional practices, two sites per practice, distinct staff roles and records; no copied real patient data or implied real clinic endorsement |
| Initial treatment categories | Examination/diagnostic appointment enquiries and planned restorative-care enquiries, including crowns; a practitioner determines diagnosis, suitability, alternatives and actual treatment |
| Conditional clinical scope | A qualified dental reviewer must define approved procedures and patient-selection/aftercare rules before real treatment bookings; the category label is not clinical approval |
| Deferred scope | Implants/full-arch rehabilitation, sedation, complex surgery, minors, emergency-care matching, treatment financing, insurance claims, travel packages, diagnostic AI and treatment-fund custody |
| Languages | English and Spanish with equivalent required information, actions and notices |
| Product form | Responsive web application with patient, practice, coordinator and administration workspaces |

Florida/Cali is a recommended initial operating scope, not a verified demand conclusion. Simulate the full selected corridor using fictional records first. Actual legal entity location, clinical permissions and jurisdiction-specific requirements must be determined before live intake. Patients must not receive a platform clinical recommendation based on budget or ranking.

## 3. Included product and acceptance baseline

Retain R-001–R-022 from the core requirements; the following defines the first-build behavior and its boundaries.

| Module | Required first-build behavior | Principal trace |
|---|---|---|
| Discovery and profiles | Bilingual search/filter, named site/practitioner, scope-specific checks and dates, clear verification limitations | R-001–004 |
| Comparison | Itemized preliminary estimates, currency/date, exclusions, visit count and total-trip assumptions; unknown items stay visible | R-008,009 |
| Identity and roles | Verified-contact workflow, recovery, session revocation, privileged MFA, role/site membership | R-012,013 |
| Enquiries and grants | Minimum intake; patient selects recipient practices/data categories; no broadcast sharing | R-005–007 |
| Messaging and files | Case-scoped communication; private quarantine/release file workflow, explicit scan states and authorized downloads | R-014,015 |
| Estimates and appointments | Practice-authored immutable issued versions, separate revision acceptance, appointment request/alternative/confirmation and cancellation | R-008,010,011 |
| Handoff and aftercare | Practitioner-issued records/instructions, responsible contact, delivery/acknowledgement and follow-up tasks | R-016 |
| Support and reviews | Separate financial/administrative/clinical concerns; review eligibility tied to attendance/treatment evidence and moderation appeals | R-017,018 |
| Verification administration | Evidence queue, scope acceptance, corrections, expiry, suspension, conflict disclosures and reviewer audit | Q-001–020; R-002,003 |
| Governance | Versioned consents, audit, export/deletion/hold workflows and restricted staff access | R-019 |
| Billing simulation | Fictional practice subscription invoices/statuses only; no treatment payments or live processor integration | R-020 |
| Accessibility and recovery | Mobile and keyboard flows, screen-reader sampling, proposed WCAG 2.2 AA target; backup/restore and version evidence | R-021,022 |

Use completely fictional practice names and visibly label demonstrations. Actual Clínica Denta details stay in internal research records; do not publish its profile as an approved partner or attach fabricated reviews to it.

For files, build a scanner adapter and simulate clean/malicious/timeout responses in automated tests. A real scanning method and applicable contracts must pass verification before live uploads. Mock verification demonstrates system behavior only; it never establishes actual clinic quality or legal compliance.

## 4. Business model recommendation

Patients use discovery, comparison and booking coordination without a platform charge during the controlled pilot. Participating practices receive a proposed 90-day free pilot period, starting on activation after acceptance. Following successful validation and legal review, test a fixed USD 99 per active practice site per month for platform workspace and administrative coordination tools. No treatment commission, pay-per-referral charge or custody of treatment funds in this first model.

USD 99 and 90 days are proposed commercial choices, not researched market prices or approved contracts. A fixed subscription is not automatically lawful; counsel must assess the service, jurisdiction, advertising/referral implications, taxes and contracting. Activation must require explicit practice agreement. No automatic conversion, renewal charge or card collection is assumed during the free pilot.

Patients pay treatment providers directly under provider terms after applicable live clearance. Disclose this payment boundary and the platform's commercial relationships. Subscription billing integration is deferred until the model and processor are approved; development uses synthetic invoices only.

The live pilot tests response workload, practice usefulness, patient comprehension, attendance, aftercare coordination, costs and willingness to continue at the proposed price. Survey enthusiasm is not revenue validation. Sponsored placements and additional revenue models require a later scope decision.

## 5. Budget and cost boundaries

No new spending is currently authorized. All limits below are proposals to approve, not permission to purchase.

| Phase/category | Proposed limit or estimating rule | Control |
|---|---|---|
| Planning and initial local fictional-data build | USD 0 new external charges | Existing access and local resources only; no paid API requests or procurement |
| Cloud preview with fictional data, if separately approved | USD 75/month total infrastructure envelope | Verify actual account/seat/project costs and tax; configure alerts and stop controls before activation |
| Domain, when needed | USD 20 first-year maximum proposed | Exact name/renewal price reviewed separately; no purchase now |
| Legal/privacy and clinical review | Request scoped quotes; proposed combined planning envelope USD 2,000 | No commitment without quote and owner approval; if insufficient, revise scope/budget before real activity |
| Paid marketing, payment fees, clinic travel/inspection, live support hires | USD 0 authorized | Itemized additional proposal required before each activity |
| Implementation labor | Codex-assisted work within existing access; track actual work and blockers by milestone | No contractor hired and no fixed-price labor estimate claimed |

Current published cloud reference prices are Supabase Pro from USD 25/month and Vercel Pro USD 20/month [T1,T2]. These imply a USD 45 starting reference, not a complete quote; separate environments, seats, usage, scanning, email, tax, compliance or contracts can add materially. The USD 75 envelope is for a small fictional-data preview only, not a promised production health-data budget. Vercel Hobby is restricted to personal noncommercial use [T3]; do not assume it fits this business.

The professional-review envelope is a budgeting proposal, not a claim that all required reviews can be purchased for that amount. HIPAA/other health-data obligations may require different plans, contracts or vendors. Obtain a separate actual live operating budget after applicability is resolved; if it exceeds the owner limit, keep real-data intake disabled.

Financial acceptance: measure revenue, coordinator time for all enquiries including nonconverters, verification cost, acquisition, refunds/disputes where applicable, fixed costs and contribution. Require an explicit owner decision on any negative-margin pilot subsidy. Fictional scenarios test calculations but do not forecast demand or prove profitability.

## 6. Responsibilities

| Work | Accountable role | Current assignment/status |
|---|---|---|
| Scope, budget and release decisions | Project owner | John |
| Integrated baseline, decisions and dependency queue | Chat 00 Command Center | Active coordination here |
| Implementation and automated evidence after approval | Codex engineering workstream, with owner-controlled account access | Proposed; no repository/build started |
| Market/commercial validation | Chat 01 workstream; actual participants for real findings | Planning assignment; no completed external validation |
| Quality benchmark and practice evidence | Chat 02 plus qualified dental reviewer | Professional reviewer not appointed |
| Legal/privacy/payment determinations | Chat 03 plus qualified relevant counsel | Professional reviewer not appointed |
| Product and bilingual operations | Chat 04 and a named live operations lead | Planning drafts available; live lead not appointed |
| Architecture/source/environment controls | Chat 05 engineering workstream | Technical proposal; access not verified |
| Independent acceptance | Chat 06 reviewer separate from implementation author | Handoff/review pending; not claimed independent PASS |
| Live patient support and aftercare | Named bilingual coordinator; treating practice responsible for clinical care | No staffing or provider agreement established |

Chats do not execute or share evidence automatically. Transfer versioned tasks and handoffs explicitly. A Chat 06 model review can assess requirements or code but cannot substitute for qualified clinical/legal review. No contractor, clinician or coordinator appointment is implied by listing the role.

## 7. Technical selection recommendation

| Layer | Selected proposal for approval |
|---|---|
| Web application | Next.js App Router, React, TypeScript; modular application with server-side business operations |
| Interface | Tailwind CSS, reusable accessible components and bilingual route/content resources |
| Relational data, identity and private files | Supabase PostgreSQL/Auth/Storage; start with local Supabase stack using CLI and a compatible container runtime [T4] |
| Authorization | Server checks plus database row-level policies, active organization/site membership and explicit patient grants; never browser-only controls [T5] |
| Notifications/jobs | Transactional outbox, deduplicated jobs, local captured delivery during development; real notification vendor deferred until reviewed |
| File security | Private storage, quarantine, scanner adapter, authorization-checking downloads and audit; live scanner/limits must be approved and tested |
| Source control | Private GitHub repository, development branches/PRs, AGENTS.md, versioned migrations, protected release process |
| Tests | Unit/integration tests plus Playwright browser tests; database authorization and upload failure fixtures [T6] |
| Hosting | Local development first; Vercel Pro and managed Supabase are the preferred fictional-data cloud-preview proposal, conditional on cost/access approval |
| AI and payments | No runtime diagnostic/generative AI or live payment integration required for first build |

Pin exact supported dependencies and lockfiles after checking documentation during implementation; no version is presumed installed. Use no extra Redis/microservice infrastructure until justified. Keep hosted staging and real production data separate. Verify contractual/privacy suitability before choosing a real-data environment; if the proposed vendors/plans cannot satisfy it within budget, revisit that decision without rewriting business requirements.

Secrets remain in approved environment/secret controls, never source files or chat. Staff roles must not depend on user-editable profile metadata. Real revocation must be tested across active sessions, caches, files, exports and jobs. Backup restore must reconcile subsequent access revocations before reopening sensitive access.

## 8. Milestones and measurable acceptance

No fixed delivery date is promised before repository/runtime access and first-milestone estimation. Work in bounded milestones; report actual effort, source, evidence and costs at each completion. Initial M0 feasibility must establish whether the USD 0 local path is available; if not, report the specific limitation and continue documentation/test design rather than incur costs.

Read-only feasibility checkpoint, November 4, 2026: this session has Git 2.51.1, Node v24.22.1 and npm 11.9.0. Docker, Supabase CLI, Podman, PostgreSQL server/client utilities were not found on PATH. No application package or git checkout exists at this project's scratch root. The connected GitHub account is readable, but its returned accessible repository list contains no identified dental project. No runtime was installed, repository created, service provisioned or application coded. M0 must first resolve the local-stack capability and canonical repository under explicit build authorization; do not silently substitute a paid cloud project or claim Supabase behavior tested with a mock database.

M0 execution specification, prepared before authorization:

1. After A5 is granted, identify the actual implementation host and verify that supported local Supabase prerequisites can run there without new external charges. Availability in John's computer is not assumed from this session's inventory.
2. Identify or create a private repository named dental-worldwide-marketplace under the owner's connected account, subject to actual permissions/name availability. Keep it separate from all existing business repositories. Verify access before claiming source is connected to Codex.
3. Prepare repository-owned requirements, AGENTS.md, a locked dependency manifest, development branch, migration/fixture conventions and reproducible setup instructions. Use fictional fixtures and captured communications exclusively.
4. Verify a minimal application build and actual local database/auth/storage connections before claiming foundation PASS. A UI mock or in-memory substitute cannot satisfy the approved Supabase foundation checks.
5. If local prerequisites cannot be obtained within authorized scope and the USD 0 limit, mark database/runtime-dependent work BLOCKED. Independently prepare source/specifications/tests after A5 where feasible; do not declare blocked integration tested. Present one concrete host/runtime or budget change proposal rather than silently provision paid cloud services.

M0 exit evidence: canonical repository and development commit, actual host/runtime versions, dependency lockfile, repeatable startup, minimal build result, actual local-stack checks, secret exclusion and incremental external cost USD 0. Independent planning review must evaluate this specification; it has not been executed.

| Milestone | Scope | Required evidence to finish |
|---|---|---|
| M0 Foundation | Verify private repo, runtime, local stack, AGENTS.md, migrations and CI approach | Reproducible local setup; clean build/check commands; exact commit and dependency lockfile; no secrets |
| M1 Identity and permissions | Fictional users, roles/sites, grants, MFA/recovery and audit | Cross-user/practice/site denials, inactive staff and revoked grants tested through direct operations |
| M2 Directory and verification | Fictional scope-specific profiles, evidence review, expiry and suspension | Unaccepted/suspended scope denies new affected requests and confirmations; public fields exclude private evidence |
| M3 Enquiry and communication | Minimal intake/consent, recipient sharing, messaging, conditional files | Recipient isolation, scan failure/quarantine and captured-notification tests |
| M4 Estimates and appointments | Versioned quotes, total-cost comparison, changes and booking states | Expiry/revision, unknown-cost handling, time zones, duplicate and concurrent request checks |
| M5 Operations | Handoff, follow-up, complaints, review eligibility and simulated subscription ledger | Full fictional journeys, clinical-escalation simulation and no real billing or messages |
| M6 Private automated acceptance | Automated bilingual/mobile/accessibility, security, load and recovery | All required fictional-data checks feasible without live-human participation pass on the identified candidate; no unresolved critical/high defects; independent automated evidence review recorded. Human checks remain DEFERRED TO LIVE / NOT PERFORMED in a versioned queue with requirement, scenario, reviewer and activity gate. Deferrals must be explicitly recorded and accepted under A5; private acceptance is not full accessibility conformance or live readiness. Applicable human prerequisites precede genuine activity under A6. |
| M7 Live environment validation | Authorized deployment, fictional-data smoke tests, then controlled genuine participation | Prerequisites satisfied for each actual activity; genuine results and unresolved issues preserved |
| M8 Public release | Approved pilot findings, operations and rollback | Explicit owner approval of exact release, costs, remaining risks and support capacity |

Concrete proposed test targets: required journeys in English/Spanish; 360px, 768px and 1440px viewports; keyboard and 200% zoom checks; core browser paths in Chromium, Firefox and WebKit; no unexplained serious/critical automated accessibility findings with all human/manual sampling deferred to M7. These targets do not alone establish WCAG conformance.

Proposed preview-load target: 20 concurrent fictional users for 10 minutes; core read API p95 at or below 1.5 seconds and HTTP 5xx rate below 1%, excluding documented simulated external failures. Measure against recorded hardware/environment and report limitations. This is a proposed acceptance workload, not a production capacity claim. Test fixture expected event/state counts exactly; no duplicate bookings, leaked records or silently accepted revised estimates.

Preview recovery target: proposed RPO at most 24 hours and RTO at most 8 hours including security reconciliation. Demonstrate database, objects, permissions and key/config access; never reopen sensitive access merely to meet the clock. Reassess these objectives before real data. Any requirement-level exception needs an identified owner, mitigation and explicit acceptance; no silent PASS.

### Security decision checkpoints for fictional development

M0 may inventory and specify unresolved security decisions; their absence does not block isolated M0 documentation. No checkpoint below is a live clinical/legal determination.

| Checkpoint | Required recorded decision and test oracle | Blocks if unresolved |
|---|---|---|
| Before M1 implementation | Role/site/data-category matrix; authentication, privileged MFA, recovery and session limits; revocation semantics; audit integrity/access rules; expected allow/deny results | Affected M1 operations |
| Before M3 implementation | Upload types/sizes, quarantine/release states and failure policy; rate limits; download authorization rule and explicit numeric exposure bound if applicable; expected release/deny states | Affected uploads/downloads and enquiry interfaces |
| Before M5 implementation | Fictional continuity permissions during practice suspension, staff revocation and grant withdrawal; no automatic restoration of access; expected continuing/restricted behavior | Affected support/aftercare operations |
| Before M6 recovery acceptance | Protected revocation reconciliation source; fail-closed behavior if history is missing; backup scope; measurement start/end points and expected restored permissions | Recovery acceptance |

Each decision records ID, owner, version, affected R/SEC/QA references, parameter values, rationale and automated expected results. Routine engineering/product decisions may be completed within approved build scope; material scope changes, added cost or relaxation of an approved control return to John. Do not select unapproved values implicitly in code. Real/live settings remain subject to activity-specific professional review.

Repository handoff trace: R-020 is M5's synthetic subscription ledger; real billing remains deferred. R-003 denies affected new requests as well as confirmations when service scope is unaccepted/suspended. All simulation screens and outputs must carry equivalent English/Spanish qualifiers, and automated tests must assert no real delivery or billing endpoint is invoked.

## 9. Fictional tests versus real-life validation

Owner direction recorded November 4, 2026: **all human checks are deferred to the separately authorized live phase (M7)**, including manual accessibility/screen-reader sampling, usability, human device checks, provider verification, clinical/legal review and operational rehearsals. Before live activity, execute all feasible automated checks with fictional data. Record every human check as DEFERRED TO LIVE / NOT PERFORMED with its requirement, scenario, responsible role, evidence needed and the activity it gates. Human checks do not block isolated fictional-data automated work once that work is authorized. Within M7, complete each applicable human prerequisite before enabling the corresponding real-data, provider, care, payment or public activity; begin with isolated fictional-data checks where appropriate. Deferral is not a waiver or a PASS. This sequencing decision grants neither A5 implementation nor A6 live/public authorization.

Minimum versioned live-human queue, currently queue v1.0; all rows NOT PERFORMED / DEFERRED TO LIVE:

| Queue item | Requirement/scenario | Responsible role | Evidence and activity gate |
|---|---|---|---|
| H-001 | R-001,021; QA-001,021 | Bilingual usability/accessibility reviewer | Real screen-reader/manual device/comprehension results before enabling corresponding participant journeys in M7 |
| H-002 | Q-001–020; R-002,003 | Qualified verification/clinical reviewers | Actual practitioner/site/service evidence before accepting any real practice or its scope |
| H-003 | L-001–010; R-005–007,014,019,020 | Relevant legal/privacy reviewers | Applicable role, consent, data handling and commercial determinations before each real-data/financial activity |
| H-004 | R-016,017,022; QA-016,017,022 | Named operations/clinical/recovery roles | Staffed handoff, escalation and operational rehearsals before corresponding live service |
| H-005 | Market/commercial validation | Owner/market workstream and voluntary participants | Actual feedback, participation, workload and willingness-to-pay evidence before treating business assumptions as validated |

The queue must be extended to every human-dependent scenario in the implemented scope, identify a named reviewer before execution, and preserve failed/incomplete results. These rows are a minimum, not an exhaustive waiver. The owner's deferral instruction is recorded; A5 acceptance of the exact deferral register remains pending until that build scope is authorized.

| Phase | Data | What it can establish |
|---|---|---|
| Development/private automated acceptance | Fictional people, clinics, scans, credentials, consents, incidents and synthetic money | Software calculations, permissions, workflows, recovery and expected behavior |
| Live deployment smoke test | Fictional records in isolated test scope; sandbox payments only if later included | Behavior of the exact live deployment without claiming actual clinical/market results |
| Controlled genuine validation | Consented participants and verified providers, only within approved real activities | Usability, practice interest, actual response/workload, commercial evidence and care-coordination operation |

Live validation proposal: up to five accepted practices, beginning with one accepted site, and an initial cohort of ten consenting adult patient enquiries. These are proposed controlled-pilot caps, not enrolled participants, a statistically powered safety study or proof of clinical equivalence. Live clinical scope and support capacity may require lower caps. No real treatment must occur simply to complete a software acceptance test.

Prior patient/practice interviews and direct credential checks are not prerequisites for simulating their workflows in a private fictional-data build. They remain required evidence for the corresponding real business claims/activities. Stage the proposed 15–20 patient and 8–12 practice discovery conversations over live validation as appropriate; do not fabricate results to meet counts or enable unreviewed care.

## 10. Professional and operational live gates

Before real personal/health data: decide legal entity/state/destination role; obtain applicable privacy/contract review, notices/consents, retention, transfer/subprocessor terms, security and incident ownership. No assumption that every U.S.-facing app is HIPAA-covered or that a low-price hosting plan is sufficient.

Before accepting an actual practice: verify the precise legal entity, site, practitioners, service scope, required authorizations/insurance and Q criteria through competent reviewers. Current public directory matches do not complete this gate. Do not claim Clínica Denta is participating without an agreement.

Before real booking/care: clinician-approved treatment scope, patient-selection/consent, emergency/complication route, aftercare and records handoff, named staffed support and patient-facing terms. Administrative support must not diagnose or delay appropriate local care.

Before real charges: approved permissible fees, payer/recipient, explicit agreement, taxes/invoicing, refund/dispute rules, processor acceptance and cost approval. No escrow or treatment-fund guarantee in this baseline.

Before public launch: exact tested release, required genuine validation evidence, qualified sign-offs, independent QA, service capacity, approved operating budget, monitoring and recovery/stop procedures. Suspend new affected cases for serious safety/privacy or capacity concerns; preserve qualified continuity support for existing patients.

## 11. Independent review and approval record

Author reconciliation: the plan separates fictional development from live obligations; retains requirements and evidence limits; scopes revenue, costs and clinical activities; removes escrow/AI/complex procedures from first build. Structural author checks are not independent review.

Chat 06 Independent Planning Review v1.0 has been received as the owner's attached handoff. Its verdict on stored plan version 3 is CONDITIONAL, with no critical/high planning defect identified. F-01 (medium) concerns human-check deferrals, F-02 (medium) concerns security checkpoints, and F-03 (low) concerns supporting-document precedence. Stored version 4 already clarified all human checks are deferred to M7; this revision preserves that instruction and adds the remaining queue, checkpoint and trace details. Author corrections are recorded below; they are not an independent closure verdict. The review explicitly permits presenting an M0-only authorization request now while later-module conditions remain. A5 and A6 are still ungranted; professional determinations remain separate.

| Approval item | Proposed owner decision | Current state |
|---|---|---|
| A1 Scope | Florida-focused U.S. adult demand, Cali, planned basic/restorative enquiry scope and deferred complex procedures | OWNER APPROVED FOR PLANNING — November 4, 2026 |
| A2 Revenue hypothesis | Patient-free pilot; 90-day practice trial; USD 99/site/month only after legal review and explicit agreement | OWNER APPROVED COMMERCIAL HYPOTHESIS — November 4, 2026; conditions retained |
| A3 Spend control | USD 0 new external charges for initial local fictional-data work; other stated envelopes are future proposals requiring separate approval | OWNER APPROVED CONTROL — November 4, 2026; no purchases authorized |
| A4 Technical baseline | Next.js/TypeScript with local Supabase, private GitHub and automated tests; hosted preview conditional | OWNER APPROVED TECHNICAL DIRECTION — November 4, 2026 |
| A5 Build authorization | After baseline review, authorize M0–M6 bounded fictional-data implementation with recorded exceptions; no real data or payments | NOT GRANTED |
| A6 Live/public actions | Separate explicit permissions and activity-specific prerequisites | NOT GRANTED |

Approval record: John's message “Approved” followed the summary requesting review of scope, subscription model, budget limits and technology. A1–A4 are recorded approved with their stated conditions. A5 and A6 remain separate. The next action is focused independent correction closure for any full M0–M6 authorization, or a separate bounded M0-only build-authorization decision; no professional review result, provider participation or market demand is inferred from owner approval. No spending, provisioning, messaging, implementation or release occurred while recording this decision.

## 12. Supporting specifications and sources

The older master remains the historical decision/evidence log: https://chatgpt.com/library?file_id=libfile_90466b7ab1b48191946c9d2ebd44cc39&account_id=personal

Core requirements/quality/legal questions: https://chatgpt.com/library?file_id=libfile_959b407a3a2081919ef588e05aa3c714&account_id=personal

Detailed workflows/economics: https://chatgpt.com/library?file_id=libfile_fab4351af0b481919ea59eba73f13352&account_id=personal

Traceability/architecture: https://chatgpt.com/library?file_id=libfile_3fa9d0bbad70819199dfae2fa2d5f6a8&account_id=personal

Data/security/recovery: https://chatgpt.com/library?file_id=libfile_fa33c208ba608191b3fbbdca3b0e9124&account_id=personal

Practice dossier: https://chatgpt.com/library?file_id=libfile_703fade509408191969f5023fc3590df&account_id=personal

Official technical sources reviewed November 4, 2026; refresh at implementation/procurement:

- T1 Supabase pricing: https://supabase.com/pricing
- T2 Vercel pricing: https://vercel.com/pricing
- T3 Hobby restriction: https://vercel.com/docs/plans/hobby
- T4 Local Supabase: https://supabase.com/docs/guides/local-development
- T5 Database authorization: https://supabase.com/docs/guides/database/postgres/row-level-security
- T6 Playwright: https://playwright.dev/docs/intro
- T7 Next.js App Router: https://nextjs.org/docs/app

Prior detailed documents supply the sourced legal/clinical research and unresolved applicability. This proposal does not convert them into professional approval.

## 13. Independent review correction record

Review source: Dental_Chat06_Independent_Planning_Review_v1.0(1).md, owner attachment, Library ID libfile_e0f23795581881919abd039dbbf6f074. The report applies to stored plan version 3; no running software was tested.

| Finding | Author action in this revision | Closure status |
|---|---|---|
| F-01 medium | Preserved owner instruction deferring all human checks; strengthened M6 exception/acceptance wording and added queue v1.0 with activity gates | AUTHOR ADDRESSED; independent focused closure pending |
| F-02 medium | Added M1/M3/M5/M6 security decision checkpoints, exact decision-record fields and module-scoped blocking rule | AUTHOR ADDRESSED; values must be recorded before affected implementation |
| F-03 low | Added precedence notices to core, workflows, architecture and data/security drafts; R-020/R-003 repository handoff trace explicit here | AUTHOR ADDRESSED; independent focused closure pending |

A1–A4 remain unchanged. No conditional verdict is converted to PASS by the plan author. Concrete M0-only approval scope is host/local-stack feasibility, private repository setup, repository requirements/AGENTS.md, locked foundation scaffold and minimal build/local-stack checks within USD 0 new external charges. It excludes M1–M6 feature implementation, paid services, real data, outreach, live deployment and public release. No M0 action is executed until authorized.

## M0 authorization supplement — November 4, 2026
John answered yes to the bounded M0 authorization request. M0 setup is authorized within USD 0 new external charges. M1–M6 and A6 remain ungranted. This supplement supersedes earlier statements that M0 has not been authorized, without broadening any other approval.

## Independent planning closure reconciliation — November 4, 2026
The later Chat 06 report, Dental_Chat06_Independent_Planning_Review_v1.0.md (Library libfile_0658756c98b481918e838f3bfff0fb97, stored version 2), closes F-01, F-02 and F-03 FOR PLANNING against consolidated-plan stored version 5. It supersedes the earlier pending-planning-closure status above. This is not independent M0 software acceptance; runtime/security/browser/recovery/load acceptance was NOT RUN in that report. M1 security decisions and future approvals remain required before affected implementation.

## M0 hosted-runner exception — November 4, 2026
John explicitly approved the prepared bounded GitHub-hosted test run. This permits the actual local Supabase Docker stack on a standard Ubuntu runner in the existing private repository, at most three executions of 20 minutes, fictional data only and USD 0 new external charges. Keep the account-wide USD 0 Actions block unchanged. No hosted Supabase service, deployment, paid API, real data or later milestone is authorized. Approval authorizes execution, not a PASS. See docs/m0-runtime-host-proposal.md.

## M0 independent acceptance received — November 4, 2026
Chat 06's acceptance/M1 package v1.0 accepts baseline `5d975f5` using tested source `5eb647e`. The later `31fb04e`/`ba6bca5` test-hardening delta has successful runtime evidence and now completed/success provider job metadata, but needs focused independent closure. Preserve baseline acceptance and exact source boundaries. See `docs/m0-acceptance-reconciliation.md` for findings and the concrete M1 approval scope. M1 remains prepared, not authorized; no additional runner allowance, merge or deployment is implied. Human checks remain deferred to live M7.

## M1 authorization — November 4, 2026
John subsequently answered "Yes I approve M1 package" to the bounded M1 decision and three 20-minute $0 hosted test runs. This supersedes earlier M1-not-authorized wording only within docs/m1-authorization.md. M2–M7, merges, charges and deployments remain excluded. Security decisions are recorded in docs/m1-security-decisions.md before affected implementation.

## M1 implementation checkpoint — November 4, 2026
M1 authorized and implemented on draft PR #2; M1 overall acceptance BLOCKED. Third hosted candidate passes actual database/Auth authorization suite and M0 regression, but API/mail stopped at request-origin validation and browser tests were not reached. Origin defect corrected and locally verified after that run. All three approved hosted attempts consumed; active runner removed. See m1-validation-followup.md and m1-execution-evidence.json for exact tested source, evidence, limitations and concrete further-runtime proposal. No fourth execution, merge, deployment or M2 work authorized.

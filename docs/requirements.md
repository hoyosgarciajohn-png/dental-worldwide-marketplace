# Marketplace requirements and traceability

## Current scope — November 5, 2026

John's autonomous implementation authority supersedes the historical M0/M1-only boundary below. M2–M6 code is implemented as a fictional-data candidate; actual integration, recovery, load and exact-candidate acceptance remain pending until recorded in `market-execution-evidence.json` and `market-independent-review.md`.

| Requirement | Candidate implementation | Automated evidence |
|---|---|---|
| R-001–004: discovery, scope checks, expiry and suspension | Bilingual directory; profile review and current scope checks | market-services-test; market-connected; market-demo |
| R-005–007: selected recipient and sharing categories | Enquiries, versioned consent, coordinator assignment plus patient grant | market-services-test; market-api-test |
| R-008–011: estimates and appointment lifecycle | Immutable revisions, visible unknowns, current acceptance, alternative times, serialized confirmation and cancellation | market-services-test; market-connected; market-demo |
| R-012–013: identity and permissions | Preserved M1 Auth, sessions, membership, MFA and audit | Original M1 suites followed by market-service checks |
| R-014–015: conversation and protected files | Scoped messages, captured outbox, private quarantine, hash-bound simulated scanner, current authorized download | market-services-test; market-api-test; market-connected |
| R-016: handoff and follow-up | Attendance-gated handoff, responsible contact/date and acknowledgement | market-services-test; market-demo |
| R-017–018: support and review | Separate concern categories, qualified clinical closure, attendance eligibility, moderation and appeal | market-services-test; market-demo |
| R-019: governance | Owner export, review-only deletion/holds, metadata administration, append-only audit | market-services-test; market-api-test |
| R-020: subscription simulation | Synthetic practice-site/month invoice, USD0 or proposed USD99, no treatment payments | market-services-test; market-demo |
| R-021: accessibility | English/Spanish, keyboard, responsive layout, five browser/viewport projects, automated Axe | market-accessibility; market-connected; market-demo; human checks deferred |
| R-022: recovery and operations | Closed gate, independent authorization history, Auth security-state reconciliation, real local database/object restore and readiness | market-recovery-test; market-load-test |

Professional checks Q-001–Q-020 remain live operational prerequisites. Simulated acceptance does not establish actual clinic quality. Real malware scanning, real notifications, legal retention/deletion decisions, external payments, live staffing and production disaster recovery are not claimed. The private static preview is browser-local demonstration; the connected application is separately tested with actual local Supabase services.

## Historical M0/M1 baseline

Authority: docs/plan.md. Bounded M0 and M1 are authorized as of November 4, 2026. M1 authority and security decisions are recorded in docs/m1-authorization.md and docs/m1-security-decisions.md.

| ID | Requirement | Evidence required |
|---|---|---|
| M0-01 | Private canonical repository with owner access and develop branch | GitHub metadata and commit |
| M0-02 | Pinned foundation dependencies and repeatable install | package-lock.json, npm ci |
| M0-03 | Minimal Next.js App Router build | typecheck and production build |
| M0-04 | Actual local Supabase database, Auth and Storage | CLI status, real DB query and auth/storage round trip |
| M0-05 | Exclude secrets and runtime data | tracked-file inspection, git ignore checks |
| M0-06 | Record approvals, limits and truthful blockers | checkpoint report |

M0-04 cannot pass using mocks or a remote cloud service. The original M0 had no application entities. M1 now includes synthetic account/site/grant/record fixtures only; no clinical or payment module is implemented. R-001–R-022 and Q-001–Q-020 remain later-module requirements. R-003 must deny affected new requests and confirmations; R-020 synthetic subscription ledger belongs to M5.

## M1 acceptance groups
M1-01 actual account/verification/recovery lifecycle; M1-02 role/site/category isolation with permitted positive controls; M1-03 self-promotion/mass assignment/forgery denial; M1-04 grants and immediate revocation with old sessions; M1-05 session boundaries/recovery/TOTP; M1-06 scoped append-only audit and rollback on audit failure; M1-07 regression, fictional reset, cleanup failure paths and secret screening. Use >=20 fictional patients and 5 fictional practices/2 sites each. No real clinical workflow is implied by minimal authorization fixtures. Independent acceptance and human deferrals remain explicit.

Approved host exception, November 4, 2026: M0-04 may be executed using actual Supabase services local to the bounded GitHub-hosted runner described in docs/m0-runtime-host-proposal.md. Mocks and remote hosted database services still cannot satisfy it.

# M0/M1 requirements and traceability

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

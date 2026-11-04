# M0 requirements and traceability

Authority: docs/plan.md. Only M0 is authorized as of November 4, 2026.

| ID | Requirement | Evidence required |
|---|---|---|
| M0-01 | Private canonical repository with owner access and develop branch | GitHub metadata and commit |
| M0-02 | Pinned foundation dependencies and repeatable install | package-lock.json, npm ci |
| M0-03 | Minimal Next.js App Router build | typecheck and production build |
| M0-04 | Actual local Supabase database, Auth and Storage | CLI status, real DB query and auth/storage round trip |
| M0-05 | Exclude secrets and runtime data | tracked-file inspection, git ignore checks |
| M0-06 | Record approvals, limits and truthful blockers | checkpoint report |

M0-04 cannot pass using mocks or a remote cloud service. No application patient, practice or payment entities are implemented here. R-001–R-022 and Q-001–Q-020 remain later-module requirements. R-003 must deny affected new requests and confirmations; R-020 synthetic subscription ledger belongs to M5.

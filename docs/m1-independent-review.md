# M1 independent review — recovered evidence

Review date: 2026-11-05. Reviewer: independent delegated review agent in the current implementation session. Verdict: **PASS for the recorded M1 fictional-data foundation and its bounded automated evidence**. This is not a new execution of the full M1 service suite, a claim that a separate Chat 06 conversation ran, or production approval.

## Source identity and recovery

The surviving GitHub handoff is `16fbd7f4d88a0030a724b9cb4a1b8df0e11c4205`, tree `856671950b44bde76e628c4243549af3bf1710ea`. The local restoration commit `49e7e02` has that exact tree and 64 tracked files. The current marketplace work has subsequently changed the working tree; this M1 verdict does not cover those additions.

The original service test executed source `1f6de519f7f59a0ef4b713cea91fab6ae84824fa`, tree `fba306870e621d6d1f400b46e7fe6ef80964d0ca`. A fresh GitHub comparison confirms the handoff is one commit ahead and changes only documentation/evidence, AGENTS, the proposed workflow document and removal of the active workflow. Executable implementation and lockfile did not change between the tested source and handoff.

The prior delegated review in this session reported PASS and 12 passing local unit tests. Its local report was lost during workspace pruning. This document reconstructs the review from surviving source, raw logs, manifest and current independent checks; it does not present lost text as an intact historical artifact.

## Independently checked evidence

The GitHub provider was queried again for run `41903522909`, job `126831935371`: completed / success, including build/HTTP checks, actual local database/Auth/mail/browser checks, cleanup and sanitized evidence publication. The historical run completed on 2026-11-04; no hosted job was started by this review.

All five retained raw logs match the SHA256 values in `docs/m1-execution-evidence.json`:

| File under `docs/evidence/` | SHA256 |
| --- | --- |
| `m1-run1-job.txt` | `53c44d55f8753f1f44c62db23dae1d8f266b42502c71aa7fbd67713754ac5601` |
| `m1-run2-job.txt` | `5d14acb2734139418098a8ec159bf0a271f69d876311f416356ecc26df319b47` |
| `m1-run3-job.txt` | `9f7523dc5d5fa6abe074c5d19e468a5b10aa8a424690f6fcea82b178bd77b6fd` |
| `m1-run4-job.txt` | `81622bf7b80c6b789e79a347fdc9c2c3bb5e3ea4e8dfd600f2fd95a5770f0f30` |
| `m1-run5-job.txt` | `d2c4274f0a87150fb8b7df30f50213f7013890db64dd274fb5aeac3a81052590` |

The baseline lockfile hash is `580079e7240d3117fe796b5125bf012e177a31a8356a6078feeab07169b130b2`, matching the manifest. The first four unsuccessful attempts remain preserved, including the initial CLI-template incompatibility, an unresolved provider-level first SQL failure, loopback-origin normalization and the recovery authentication-method correction. The fifth run is the passing run. Five of the six historically authorized attempts were used; this is historical accounting, not fresh billing verification.

The current reviewer ran `node --test scripts/m0-denial-assertions.test.mjs scripts/m1-origin.test.mjs scripts/runtime-cleanup.test.mjs` against the restored unchanged M1 files: **12 tests, 12 passed, 0 failed or skipped**. These are unit/regression checks, not a substitute for the recorded actual-service execution.

## Source review and bounded coverage

Read the M1 server boundary, API and PKCE callback, both M1 SQL migrations, the execution manifest and surviving passing-log results. The implementation uses the loopback-only server configuration, original Host plus exact Origin checks for mutations, bounded JSON input, allowlisted API fields, server-side provider verification, HttpOnly cookies and fixed same-provider fetch destinations. Recovery uses the dedicated `recovery` authentication method after the corrective migration, and changing a password invalidates prior application sessions.

Private tables have RLS enabled and direct ordinary-role privileges revoked. Public entry points use invoker wrappers; privileged functions have a fixed empty search path and restricted execute privileges. Authorization reads current account/session, role, site membership, grants and assignment state. Staff access requires verified MFA. Audit rows contain metadata and have update/delete rejection; database mutations and their audit insertion share a transaction.

The retained service evidence covers 40 fictional identities, 20 patients, five practices, ten sites and 200 staff/record combinations; real local signup verification and password recovery through captured mail; TOTP; current membership/grant denial and old-token denial after revocation; idle/absolute expiration; global signout; metadata audit and injected audit failure; and cleanup. Browser evidence is six Chromium cases across desktop and mobile, not a complete browser/accessibility matrix. The cleanup unit tests include nonzero exits, timeout, process spawn failure and log-write failure.

## Limits and handoff

M1 is an access foundation. Its fictional fixture authorization does not prove later marketplace workflows, attachment scanning, booking concurrency, restore safety or real clinical operations. Those require a separate exact-candidate review and actual service results. The expanded M2–M6 review must also assess revocation races, action-specific idempotent retries and recovery replay across the new data model.

No human usability, assistive-technology, clinical, legal, operational or owner acceptance checks are recorded as passed. They remain deferred to M7. No real patient data, external mail, paid infrastructure, public deployment or production readiness is authorized by this verdict.

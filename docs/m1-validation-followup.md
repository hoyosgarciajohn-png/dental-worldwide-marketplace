# M1 review handoff and remaining validation — November 4, 2026

**M1 overall acceptance: BLOCKED. Implementation is reviewable in draft PR #2.** The original three hosted executions are consumed. John subsequently approved up to three additional executions (attempts 4–6), at most 20 minutes each and USD 0 new charges. No merge, deployment, real data, external mail, paid services or M2 implementation.

## What is implemented

- Bilingual responsive account workspace; signup/contact verification/recovery through local captured email and server-side PKCE; HttpOnly session cookies.
- Seven roles, site membership and current database authorization; positive and negative patient/practice/site access; explicit recipient/category/action grants and assigned staff.
- Immediate deactivation, role/grant withdrawal and session revocation; 30-minute idle and 12-hour absolute session limits; privileged TOTP and lost-factor reset.
- Scoped metadata-only append-only audit, denial events, and fail-closed mutation rollback when audit insertion fails.
- Minimal fictional record, export and queued-job fixtures solely to exercise access controls. They are not a clinical, messaging, scheduling or production-data module.

## Evidence boundary

| Area | Actual evidence | Current status |
|---|---|---|
| Last hosted source | `46205d34c49d64bbe0153e0afe3b72711c463efd`, tree `7413cc05e6bf9dd8d2a63c7f7ea1ec82d02760e8` | Run 41891201967 / job 126788754220 completed/failure |
| Build/static/foundation HTTP | Locked installation, eight then-current unit cases, typecheck, production build, foundation HTTP | PASS on hosted candidate |
| Database/Auth authorization | 40 identities, 20 fictional patients, five practices, ten sites; 200 staff/record combinations; membership/consent/assignment revocation; MFA/session/audit tests | PASS on hosted candidate |
| M0 service regression | All nine actual Auth/private Storage/cleanup checks; security advisors returned no findings | PASS on hosted candidate |
| API and captured mail | First unauthenticated request returned origin_rejected/403 rather than 401 | FAIL; remainder not performed |
| Desktop/mobile browser suite | Six configured cases, including bilingual/keyboard and seven-role scope | NOT PERFORMED |
| Cleanup | Database reset, no Auth users/fixture records/Storage objects, project stop, credential-file removal | PASS |
| Post-run correction | Original Host/scheme verification; strict POST Origin preserved; callback shares authority check | 12 unit cases, typecheck/build, foundation HTTP and actual HTTP guard regression PASS locally |
| Full corrected candidate | Database, captured mail, recovery, rate limits, BFF MFA and browser flows | NOT RETESTED |
| Independent review | Chat 06; also retain focused closure of later M0 test-hardening delta | PENDING |
| Human validation | Live M7 only | DEFERRED / NOT PERFORMED |

The original service PASS belongs to the recorded hosted source. The post-run correction changes the API/callback authority guard, adds regression tests and improves safe test diagnostics. It does not change the migration or database test suite. Reviewers must not treat those local tests as a full corrected-candidate PASS.

## Defect ledger

1. CLI 3.0.0 experimental stack rejects custom email-template content_path. Confirmed locally. Switched to default captured templates plus server-side PKCE; startup subsequently passed. Actual verification/recovery is still pending.
2. First fixture SQL write failed in a multi-statement batch. Raw provider reason was not retained in public logs. Splitting those calls was followed by a complete database suite PASS; do not claim a verified original provider error.
3. Next.js 16.4.5 normalizes loopback hosts in NextRequest.url. Confirmed by local reproduction and installed framework source. Corrected with original Host, scheme and exact POST Origin checks; malicious authority and forwarded-header cases remain denied. Local production HTTP regression PASS.

Raw downloaded job logs are saved in docs/evidence/m1-run1-job.txt through m1-run3-job.txt. SHA-256 values, sources, jobs and results are in m1-execution-evidence.json. Logs and source scanned for JWTs, provider key formats and private-key blocks; no matches. Pattern scans are not an exhaustive secret audit.

## Additional-runtime scope — approved November 4, 2026

John approved **up to three additional standard Ubuntu hosted executions, each capped at 20 minutes, USD 0 new external charges**, solely to finish M1 validation and necessary corrections. Preserve the account-wide USD 0 Actions spending block, pinned actions, read-only workflow permissions, local Docker Supabase, captured local mail, fictional records and cleanup. No cache/artifact upload or live services. Count every additional execution, including failures; stop at the limit. Remove the workflow after validation.

Execute within this allowance: activate the dormant template once with an exact source; run the early origin regression, then actual M0/M1 services, signup/recovery/mail, BFF MFA/rate limits and six browser cases. Correct only evidenced M1 defects within the remaining allowance. Preserve each failed and passing result. Remove the workflow, reconcile provider status and billing, and deliver the exact candidate/evidence to Chat 06 for independent acceptance. Do not infer acceptance, required-check compliance or merge permission from author tests.

No seventh execution is authorized. If the additional allowance is exhausted without complete validation, preserve the corrected implementation and evidence; M1 stays BLOCKED.

## Financial check

Post-run GitHub UI: USD 0 billable; USD 0.28 of USD 12.00 included compute used, 0 GB of 0.5 GB Actions storage. Actions budget remains USD 0.00/0.00, Usage blocked. Billing data may lag; no billing settings changed.

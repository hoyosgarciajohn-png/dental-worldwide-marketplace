# M1 automated validation and independent review handoff

November 4, 2026. **Automated validation: PASS. Independent M1 acceptance: PENDING CHAT 06.**

## Exact evidence

- Tested source: 1f6de519f7f59a0ef4b713cea91fab6ae84824fa; tree fba306870e621d6d1f400b46e7fe6ef80964d0ca.
- Run 41903522909 / job 126831935371: provider completed/success, one attempt. November 4, 3:07–3:12 p.m. America/New_York.
- Run: https://github.com/hoyosgarciajohn-png/dental-worldwide-marketplace/actions/runs/41903522909
- Draft PR #2: https://github.com/hoyosgarciajohn-png/dental-worldwide-marketplace/pull/2 . No merge/deployment.
- Exact downloaded log: docs/evidence/m1-run5-job.txt; SHA-256 d2c4274f0a87150fb8b7df30f50213f7013890db64dd274fb5aeac3a81052590.
- Execution ledger: docs/m1-execution-evidence.json, preserving all five runs and failures. Package lock and dependency audit evidence retained.
- Application, migrations and test scripts are unchanged after this passing source. Final handoff changes only documentation/evidence and removes the active workflow; compare the PR head with the tested source.

## What actually passed

| Area | Verified behavior |
|---|---|
| Foundation | Locked installation, all 12 unit cases, typecheck, production build, foundation HTTP and production request-origin regression |
| Actual services | Supabase local Docker startup, two migrations, security advisors with no reported findings, all nine M0 Auth/private Storage/cleanup checks |
| Accounts | Signup and mandatory captured-mail verification; neutral password recovery, actual dedicated recovery method, single use, 15-minute expiry, old-session denial after reset; password-session substitution rejected |
| Isolation | 40 fictional identities, 20 patients, five practices, ten sites; 200 staff/record combinations; own-scope positives and cross-patient/practice/site/anonymous/direct-table denials |
| Permissions/grants | Trusted current membership/site/action/category; no profile/JWT/owner self-elevation; immediate revocation with old tokens; listings, exports and queued fixtures recheck authorization |
| Sessions/MFA | Deactivation/reactivation; idle 30-minute and absolute 12-hour boundaries; global sign-out and refresh replay denial; privileged TOTP/enrollment-only denial; restricted lost-factor reset; recovery cannot open an application session |
| Abuse/audit | Actual 5/account and 20/loopback-peer limits per 15 minutes, window reset and spoofed forwarding-header resistance; scoped append-only metadata audit and rollback when audit insertion fails |
| Browser | Six passing Chromium cases across desktop 1280×900 and mobile 390×844: bilingual/keyboard/forms/width, actual patient login/scope/logout and visible controls for all seven roles |
| Cleanup | Fictional DB reset; no Auth users, fixture records or Storage objects; project stopped; connection and fixture credential files removed; five injected cleanup-failure unit cases passed |

The database evidence contains 16 named entries, including its completion summary; API/mail evidence contains eight named entries. These are grouped checks, not a claim that only 24 assertions ran. No mocks establish service or identity-provider PASS.

## Defects preserved and resolved

1. Attempt 1: CLI 3.0.0 rejects custom email-template content paths. Use default captured templates and server-side PKCE. Actual signup and recovery both passed in the final candidate.
2. Attempt 2: first fixture SQL write failed in a multi-statement batch; exact original provider error was not exposed. Split statements; later complete DB suites passed. Do not invent the original error.
3. Attempt 3: NextRequest loopback normalization rejected legitimate API requests. Exact original Host/scheme and strict POST Origin checks fixed it; positive/negative production HTTP and full application tests passed.
4. Attempt 4: recovery-password update rejected a valid PKCE session because the predicate required otp. A new migration requires the documented recovery method, retaining all session/account/audit logic. Actual provider claims, reset, replay/expiry and password-session substitution tests passed in attempt 5. Reference: https://supabase.com/docs/guides/auth/jwt-fields .

## Chat 06 review task

Independently compare the tested source with the final PR head; verify raw-log hashes, provider success and the structured evidence. Review both migrations, least-privilege RPC/RLS enforcement, current session and consent checks, recovery/PKCE/cookie handling, role/site matrix, rate limits, audit rollback and cleanup paths. Confirm the six browser cases' actual scope; identify any acceptance group still lacking evidence. Carry forward focused closure of later M0 test-hardening findings without rewriting the originally accepted M0 baseline. Record PASS, CONDITIONAL or FAIL with exact sources and unresolved findings. Author tests do not supply the independent verdict.

Human usability, accessibility, physical-device, provider and professional checks remain **DEFERRED TO LIVE M7 / NOT PERFORMED**. The two automated viewports are not real-device or WCAG certification. Local default captured emails use provider templates; production delivery, trusted proxy boundaries, clinical/privacy approvals and deployment remain future gates. No real personal/health data or external delivery was used.

## Runtime and cost control

John approved up to three additional 20-minute standard Ubuntu executions at USD 0 new external charges. Two were used (attempts 4 and 5); five total M1 runs, one unused. Testing stops after success. Active workflow removed; dormant template retained. No background test schedule.

GitHub billing observed USD 0 billable, USD 0.35 / USD 12.00 included compute and 0 GB / 0.5 GB storage during the final run. Existing Actions spending block remained USD 0.00 / USD 0.00, Usage blocked; no settings changed. Provider usage may lag. No seventh run, paid service, merge, deployment or M2 implementation is authorized.

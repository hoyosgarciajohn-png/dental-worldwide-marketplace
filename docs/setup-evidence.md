# M0 setup evidence — November 4, 2026

Latest: corrected M0 technical checks PASS from attempt 3's complete execution log. Attempt 2's provider-status discrepancy is resolved. Attempt 3 provider status and independent M0 acceptance remain pending; see the final section. Earlier BLOCKED entries describe historical host limits.

Overall: BLOCKED. Current prerequisite is a host with a usable non-root UID/GID or Docker; artifact download is now resolved. Foundation checks passed; actual Supabase DB/Auth/Storage acceptance has not run. This is not an M0 PASS or live-readiness verdict.

## Authorization
John authorized bounded M0 setup with fictional data and USD 0 new external charges. M1–M6 features, paid services and live deployment are excluded.

## Verified environment and results
- Git 2.51.1; Node 24.22.1; npm 11.9.0; Next.js 16.4.5; Supabase CLI 3.0.0.
- Private repository created: hoyosgarciajohn-png/dental-worldwide-marketplace. GitHub reports private visibility and admin/push access. Develop branch starts from d80e6ceb7beb2a467a1051959f68b9d6586908c7. Main preserved.
- Exact direct dependency versions and package-lock.json committed. npm ci completed (68 packages, exit 0).
- npm run typecheck: exit 0.
- npm run build: exit 0, minimal App Router static page compiled and generated.
- Production HTTP smoke: exit 0; HTTP 200, English/Spanish fictional disclosures, noindex metadata, absent x-powered-by header, unknown route 404.
- No browser/accessibility/user acceptance is inferred from HTTP checks. Human checks remain deferred to M7.

## Database blocker
No Docker executable/socket or supported container engine found. Native CLI path verified against official docs and installed CLI help. Experimental stack enabled in config.toml; no application migrations/fixtures or schema created.

Native command: `supabase start --runtime native --eager --exclude studio,functions,realtime,analytics,pooler,mail`.
Root startup rejected as expected. Creating a dedicated account failed because the host could not open its audit interface. Existing nobody account rejected by CLI (uid 65534). Existing oai account uid 1001 was accepted through SUPABASE_NATIVE_POSTGRES_USER=oai, with SUPABASE_HOME pointing to ignored .supabase-local.

Final attempt failed preparing database artifact: unable to download the slim-services PostgreSQL 17.11.0.011-r0 archive/manifest from GitHub releases (transport error). No working database, Auth or Storage was established. M0-04 BLOCKED; actual DB query, Auth sign-in and private object round trip NOT PERFORMED. No mock or cloud fallback used. The documented alternate archive host is supabase-cli-artifacts.s3.us-east-1.amazonaws.com; archive access must work before retrying.

Concrete $0 continuation: use an environment with supported Docker and local Supabase, or this Linux native runtime with its official download hosts reachable. Repeat setup and actual DB/Auth/Storage smoke checks there before M0 acceptance. This does not authorize a paid host.

## Automatic review restriction
The telemetry-disable command was rejected by automatic approval review because it attempted external PostHog contact that could disclose environment/usage metadata. It was not retried or bypassed. No further telemetry-management command is required for this scaffold. Next.js local telemetry preference was disabled successfully.

## Limits
No hosted database, paid API, messaging, subscriptions, real records, clinical claims, public deployment, cloud CI jobs or payments created. New external charges initiated: USD 0. Native runtime files/logs, credentials, node_modules and build output are ignored. Framework dependency audit, browser QA, and later-module security tests are not claimed complete.

## Documentation consulted
- https://nextjs.org/docs/app/getting-started/installation
- https://supabase.com/docs/guides/local-development
- https://supabase.com/docs/guides/local-development/docker-and-native-runtimes
- https://supabase.com/docs/guides/local-development/running-multiple-local-projects


## Runtime recovery attempt — November 4, 2026

The original download blocker is RESOLVED. curl through the configured host proxy downloaded all five required Linux service archives and manifests from the official Supabase release URLs. Every archive and manifest matched supabase/supabase.lock SHA-256 pins. Supabase's unmodified CLI consumed these bytes through its source-supported SUPABASE_INTERNAL_SLIM_RELEASES_URL setting on a loopback-only static mirror and performed its own integrity checks. No package code, checksum verification, TLS setting, network policy or PostgreSQL root check was disabled.

Native startup then hit two host prerequisites. First, /workspace is world-writable; a dedicated /var/lib runtime home avoided changing those shared permissions. Next, chown failed when handing the database directory to the configured non-root account. An isolated identity probe returned errno 22. Both /proc/self/uid_map and gid_map contain only `0 0 1`: the host exposes only uid/gid 0 in this process namespace. The named oai account exists in passwd but uid/gid 1001 cannot be selected here. There is no Docker executable or socket. Running the official PostgreSQL executable with --version succeeded (PostgreSQL 17.11); starting its database as root remains unsupported. Failed local stack was stopped successfully.

**Current verdict: M0 BLOCKED by host identity/runtime capability, not artifact availability.** Actual SQL query, Auth login and Storage object acceptance remain NOT PERFORMED. No smoke implementation is counted as executed. Historical build/TypeScript/HTTP PASS remains scoped to the prior verified source.

Prepared test automation (syntax-checked only):
- scripts/m0-artifact-cache.py downloads only selected official service artifacts and rejects any pinned digest mismatch.
- scripts/m0-local-runtime.py checks the non-root prerequisite, uses a loopback artifact mirror, runs actual SQL and Auth/Storage checks after startup, and stops only this project's stack. On this host its guard exits 2 BLOCKED before any service check. Requires Python 3.11+ and Linux; root hosts also require a suitable non-root account and trusted M0_SUPABASE_HOME.
- scripts/m0-docker-smoke.mjs provides the corresponding automated path for an existing supported Docker development host, including Windows. It has not run here because Docker is absent.
- scripts/m0-services-smoke.mjs creates an isolated fictional identity without sending email; checks bad/good password, server validation, refresh and sign-out refresh-token rejection; creates a private fictional bucket/object; checks byte equality, denied anonymous/public/ungranted-user access, signed download, and cleanup. These remain NOT PERFORMED. It rejects non-loopback targets and keeps keys in ignored files. No application roles or tenant policy is implemented.

@supabase/supabase-js 2.119.0 added as an exact test-only development dependency, with updated lockfile. JS syntax checks and Python compilation passed. No M1–M6 feature development, cloud provisioning, telemetry-disable retry, real data or external charges. No test credential printed or committed.

Required environment change: run the same source on an already available Docker-capable development host, or a supported Linux host with a usable non-root UID/GID and safe runtime directories. The automated checks then run without patient/provider participation. Host access is a development prerequisite; human acceptance checks remain deferred to M7.

## Supported-host proposal — November 4, 2026

A fresh host check confirms the same UID/GID limitation and absent Docker engine. A user-namespace mapping probe also failed with Operation not permitted. No integration checks ran. Read-only GitHub billing inspection found unused included compute and an existing USD 0 Actions blocking budget. A bounded standard-runner workflow is prepared outside .github/workflows, with a 20-minute limit, read-only permissions, pinned actions, no artifact/cache upload and sanitized evidence output. No job has been activated. See docs/m0-runtime-host-proposal.md for the exact host exception and maximum three correction attempts. Approval is required because AGENTS.md excludes cloud provisioning under the currently local-only M0 scope. This is a host-change proposal, not an M0 PASS. No budget or billing setting changed; new charges initiated USD 0.

## Approved hosted runtime execution — November 4, 2026

John approved the bounded host exception. Attempt 1 was rejected before runner allocation because runner.temp is unavailable in job env. Replaced it with github.workspace; attempt 2 source 5eb647e4b3eaf007c9b2c14844d5da392ccee6aa executed on Ubuntu 24.04.5 / Node 24.22.1 / Docker 28.0.4. The complete job log reports locked install, TypeScript, build, HTTP smoke, actual SQL, nine Auth/Storage/cleanup checks, project stack stop and success summary. See docs/m0-hosted-runtime-evidence.json for exact evidence and log digest.

Technical checks PASS from actual execution. Current run/job metadata and browser still show queued despite the completed job log. Final provider conclusion and independent acceptance are not yet verified; formal M0 acceptance remains pending. The original workspace restriction remains, but the approved runner supplied a working local Docker stack. No third run is needed for the successful tests. Temporary active workflow is removed after collecting results to prevent new executions. Billable Actions usage displayed USD 0; the USD 0 hard stop remains unchanged. Human checks remain deferred to M7; later implementation and live activity remain unapproved.

## Final authorized validation and review handoff — November 4, 2026

Author review found that several negative service tests accepted any error, which could mistake an outage for an access denial. Tests now require expected Auth codes/status and Storage denial/masked-not-found responses, reject service/transport/throttling failures, disable redirects, and explicitly check Docker shutdown before reporting cleanup. Three focused offline regression tests pass. Official Storage error behavior: https://supabase.com/docs/guides/storage/debugging/error-codes ; installed SDK 2.119.0 exposes status/statusCode/code. Positive login and exact-byte Storage round trips remain required.

The third and final approved execution tested source `31fb04effd239a7661bc6769b2fa6080fd7cdf12`, tree `ac49615094bf2c4a9f2baa644ea6cf6339007d61`. Run `41880262397`, job `126750559309`, logged 17:45:52–17:46:57 UTC. Clean npm install, the three regression tests, TypeScript, production build, HTTP smoke, Docker startup/status, real SQL, all nine Auth/Storage/fixture checks and explicit stack/credential cleanup PASS. Full log SHA-256: `fb63a8e5b12d5e222c458a83494c8b123b08d034e25cacb37a18f5a9c8af49ba`. Local regression/typecheck/build/HTTP checks also pass. No application feature changed.

Fresh metadata confirms attempt 2 completed/success, resolving its earlier queued discrepancy. Attempt 3's complete log contains success and post-job cleanup, while its latest metadata still says queued. Record technical execution PASS without asserting a verified final provider conclusion. Formal independent M0 acceptance remains pending. The prepared task is `docs/m0-independent-acceptance-handoff.md`; this is author work, not a Chat 06 verdict.

All three authorized attempts are now used. Active workflow removed; dormant template retained for reference and must not be reactivated under the exhausted run authorization. Read-only review and documentation remain permitted. Main is preserved and PR #1 remains draft. Pre-run billing showed USD 0 billable Actions usage, USD 0.27 of USD 12 included compute used, and the unchanged account-wide USD 0 spending block. Billing may lag. No new external charges authorized or initiated.

Chat 06's existing planning report stored version 2 closes F-01/F-02/F-03 FOR PLANNING. Its software tests were NOT RUN; that closure does not supply M0 acceptance. No human testing, real records, messages, paid services or deployment occurred. Human checks stay deferred to M7; M1 implementation remains unauthorized.

# Dental Worldwide Marketplace

Bilingual fictional marketplace candidate, with a separate owner-private browser-local preview. No real patient service is enabled.

## Current implementation
M1 accounts and sessions underpin practice verification, scoped enquiries and sharing, messages/private files, immutable estimates, appointments, follow-up, support, moderation, synthetic practice subscriptions and governance. The private preview demonstrates these interactions in browser-local fictional state. Connected mode uses the local Supabase stack and current authenticated authorization; it is not hosted by the static preview.

For current results and exact source, read `docs/market-execution-evidence.json` and `docs/market-independent-review.md`. Historical M0 limitations below are preserved as setup context; they do not replace current evidence.

## Marketplace validation
On an authorized Docker development host, use the pinned Node/npm versions, `npm ci`, `npm run build`, and install the pinned Playwright Chromium, Firefox and WebKit engines. Then `MARKET_PHASE=full npm run test:market:docker` executes actual isolated services, original foundation/account regression, marketplace browser/API checks and recovery. `MARKET_PHASE=load npm run test:market:docker` executes the separate ten-minute authenticated read load phase. Each phase creates only fictional fixtures and resets/stops its project. Keep connection, fixture, snapshot and credential files private; only sanitized evidence survives cleanup.

The scanner bridge is deliberately simulated and enabled only in isolated tests with `MARKET_ALLOW_SIMULATED_SCAN=1`. Never treat this as malware protection. External notifications and payment processing are disabled. Human, professional, live-provider and production recovery checks remain deferred.

## Setup
Use Node 24.22.1 and npm 11.9.0. Run `npm ci`, `npm run preflight`, `npm run typecheck`, and `npm run build`. Start the local app with `npm run dev`; it binds to 127.0.0.1:3000. No external fonts, analytics, AI or paid services are configured.

## Local Supabase
The CLI is pinned as a development dependency. `npx --no-install supabase init` creates configuration when absent; do not overwrite an existing configuration. A Docker-compatible runtime is normally required by `supabase start`. For supported Linux sandboxes without Docker, use the experimental native runtime only after checking CLI help and enabling its documented configuration. See docs/setup-evidence.md for the exact supported command and actual result from this host. Do not substitute a remote Supabase project.

M0 database acceptance requires an actual DB query and Auth/Storage round trip with a disposable fictional identity and object. M0 actual-services acceptance is recorded in the historical evidence. Current fictional application authority is documented in AGENTS.md; real data remains unauthorized.

## Source and acceptance
See AGENTS.md, docs/requirements.md, docs/plan.md and docs/setup-evidence.md. Keep working changes on develop/task branches, with review before main. Human checks are deferred to M7 and retain NOT PERFORMED status. Only the explicitly bounded validation workflow is enabled while testing; it is removed after acceptance. Preserve the unchanged USD0 spending block.

## M0 runtime recovery
Official artifacts are now reachable and verified; this sandbox cannot start PostgreSQL because only uid/gid 0 is mapped and Docker is absent. This local host cannot provide service acceptance; the approved standard Ubuntu Docker runner provides actual isolated evidence. Do not patch PostgreSQL to run as root.

On an existing supported Docker development host: `npm ci` then `npm run test:m0:docker`. This starts only a local stack, queries the real DB, runs the fictional Auth/private Storage checks, cleans its fixtures and stops that stack. Initial image downloads require Internet access. Review `.supabase-local/service-smoke-evidence.json`; do not share credentials from connection.json or raw CLI logs. This path is prepared, not verified on Windows or Docker here.

Linux native path: `python3 scripts/m0-artifact-cache.py`, then `python3 scripts/m0-local-runtime.py`. Python 3.11+, curl, system tar and the supported native platform are required. Run as a real non-root OS user where possible. A root host additionally needs M0_POSTGRES_USER and a trusted M0_SUPABASE_HOME; the runner fails when identity switching is unavailable. The internal mirror setting is version-specific to pinned CLI 3.0.0. See docs/setup-evidence.md for the exact limitation.

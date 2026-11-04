# Dental Worldwide Marketplace

Private M0 foundation. Fictional data only. No live website or patient service.

## Setup
Use Node 24.22.1 and npm 11.9.0. Run `npm ci`, `npm run preflight`, `npm run typecheck`, and `npm run build`. Start the local app with `npm run dev`; it binds to 127.0.0.1:3000. No external fonts, analytics, AI or paid services are configured.

## Local Supabase
The CLI is pinned as a development dependency. `npx --no-install supabase init` creates configuration when absent; do not overwrite an existing configuration. A Docker-compatible runtime is normally required by `supabase start`. For supported Linux sandboxes without Docker, use the experimental native runtime only after checking CLI help and enabling its documented configuration. See docs/setup-evidence.md for the exact supported command and actual result from this host. Do not substitute a remote Supabase project.

M0 database acceptance requires an actual DB query and Auth/Storage round trip with a disposable fictional identity and object. Until those run successfully, M0 is BLOCKED. No application features, live data or clinical schema are authorized.

## Source and acceptance
See AGENTS.md, docs/requirements.md, docs/plan.md and docs/setup-evidence.md. Keep working changes on develop/task branches, with review before main. Human checks are deferred to M7 and retain NOT PERFORMED status. No cloud CI/deploy workflow is enabled, preventing unapproved usage charges.

## M0 runtime recovery
Official artifacts are now reachable and verified; this sandbox cannot start PostgreSQL because only uid/gid 0 is mapped and Docker is absent. M0 remains BLOCKED. Do not patch PostgreSQL to run as root.

On an existing supported Docker development host: `npm ci` then `npm run test:m0:docker`. This starts only a local stack, queries the real DB, runs the fictional Auth/private Storage checks, cleans its fixtures and stops that stack. Initial image downloads require Internet access. Review `.supabase-local/service-smoke-evidence.json`; do not share credentials from connection.json or raw CLI logs. This path is prepared, not verified on Windows or Docker here.

Linux native path: `python3 scripts/m0-artifact-cache.py`, then `python3 scripts/m0-local-runtime.py`. Python 3.11+, curl, system tar and the supported native platform are required. Run as a real non-root OS user where possible. A root host additionally needs M0_POSTGRES_USER and a trusted M0_SUPABASE_HOME; the runner fails when identity switching is unavailable. The internal mirror setting is version-specific to pinned CLI 3.0.0. See docs/setup-evidence.md for the exact limitation.

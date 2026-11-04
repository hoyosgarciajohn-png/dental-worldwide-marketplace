# Dental Worldwide Marketplace

Private M0 foundation. Fictional data only. No live website or patient service.

## Setup
Use Node 24.22.1 and npm 11.9.0. Run `npm ci`, `npm run preflight`, `npm run typecheck`, and `npm run build`. Start the local app with `npm run dev`; it binds to 127.0.0.1:3000. No external fonts, analytics, AI or paid services are configured.

## Local Supabase
The CLI is pinned as a development dependency. `npx --no-install supabase init` creates configuration when absent; do not overwrite an existing configuration. A Docker-compatible runtime is normally required by `supabase start`. For supported Linux sandboxes without Docker, use the experimental native runtime only after checking CLI help and enabling its documented configuration. See docs/setup-evidence.md for the exact supported command and actual result from this host. Do not substitute a remote Supabase project.

M0 database acceptance requires an actual DB query and Auth/Storage round trip with a disposable fictional identity and object. Until those run successfully, M0 is BLOCKED. No application features, live data or clinical schema are authorized.

## Source and acceptance
See AGENTS.md, docs/requirements.md, docs/plan.md and docs/setup-evidence.md. Keep working changes on develop/task branches, with review before main. Human checks are deferred to M7 and retain NOT PERFORMED status. No cloud CI/deploy workflow is enabled, preventing unapproved usage charges.

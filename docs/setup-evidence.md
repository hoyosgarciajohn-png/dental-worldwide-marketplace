# M0 setup evidence — November 4, 2026

Overall: BLOCKED. Foundation checks passed; actual Supabase DB/Auth/Storage acceptance has not run. This is not an M0 PASS or live-readiness verdict.

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

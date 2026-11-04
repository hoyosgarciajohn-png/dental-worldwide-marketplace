# Dental Worldwide Marketplace

## Authorized scope
M0 foundation only, approved by John on November 4, 2026. M1–M6 features and M7 live activity are not authorized. Use fictional data exclusively. New external charges: USD 0. Never deploy, provision cloud resources, contact others, make paid API requests, or process real patients or payments under M0.

## Workflow
Use develop and task branches; prepare reviewable changes. Preserve main. Read docs/plan.md and docs/requirements.md before edits. Install from package-lock.json with npm ci. Run typecheck, build, and appropriate setup checks. Report commands, actual output, source commit and blockers. Missing dependencies or mocks never establish integration PASS. Do not silently broaden scope to close a blocker.

## Security and data
Never commit credentials, .env files, runtime DB/object files or patient data. Bind local services to loopback. Use .env.example with empty keys. Do not create clinical tables, roles, uploads or billing modules during M0. Database migrations and fixtures require matching authorization and security decisions. Do not put privileged keys in NEXT_PUBLIC_ variables or browser code.

## Decisions and acceptance
Human checks stay NOT PERFORMED until live M7. Author corrections are not independent review. Before M1: record role/session/recovery/audit/revocation decisions. Before M3: file limits, rates, quarantine/download rules. Before M5: continuity permissions. Before M6 recovery: revocation reconciliation and fail-closed decisions. Preserve plan precedence and approval history.

## Framework documentation
Use version-matched official Next.js and Supabase documentation. Supabase CLI native runtime is experimental; verify installed help before use. No automatic deployment is configured. The bounded M0 runner exception below is the only authorized hosted CI.

## Approved M0 hosted-runner exception — November 4, 2026
John answered "yes, approve" to docs/m0-runtime-host-proposal.md. Use only the existing private GitHub repository and standard Ubuntu test runner, actual Supabase local Docker services, fictional data, no new external charges, unchanged USD 0 Actions spending block, at most three executions and 20 minutes each. This narrow exception supersedes the no-cloud-provisioning sentence above only for these tests. No deployment, hosted Supabase project, paid runner, billing change or later milestone is authorized. Remove the active workflow after testing; preserve evidence.

# M0 runtime host change — prepared, not activated

November 4, 2026. M0 remains BLOCKED; SQL, Auth and Storage checks remain NOT PERFORMED.

## Established blocker

This workspace has no Docker engine and maps only uid/gid 0. The official PostgreSQL executable is available, but the kernel rejects changing to the required non-root account. A fresh user-namespace mapping probe also returned Operation not permitted. Repeating startup cannot fix this host prerequisite. Do not weaken the host or PostgreSQL restrictions.

## Concrete proposed change

Use an ephemeral standard Ubuntu 24.04 GitHub Actions test runner in the existing private repository. Run the actual Supabase Docker stack locally on that runner, with fictional test data, then stop it. This changes the execution host; it does not create a hosted Supabase project or deploy the application. It does not resolve this ChatGPT workspace's UID limitation.

The exact dormant workflow is `docs/m0-runtime-workflow.proposed.yml`. It is outside `.github/workflows`, so committing it does not start any job. After authorization, record the bounded host exception, copy it to `.github/workflows/m0-runtime-validation.yml` on the dedicated `m0-runtime-validation-20261104` branch, and push. Main stays unchanged. The trigger is restricted to that branch and changes to that workflow file; there is no schedule or ordinary develop/PR trigger.

Scope: one job at a time, maximum 20 minutes per execution and three executions total for necessary corrections. Each additional execution requires a concrete correction or diagnosed transient failure. Stop after the third failure and report the evidence. After testing, remove the active workflow from the temporary branch. Retain the dormant template and results for review.

The job pins checkout and Node setup actions to verified release commit hashes, installs from package-lock.json, builds the scaffold, checks HTTP behavior, and runs the existing SQL/Auth/Storage test runner. GitHub token permission is read-only and checkout credentials are not persisted. No repository secrets, paid APIs, real records, external messaging, deployment, cache, or artifact upload is configured. Sanitized results and the exact tested commit appear in the job summary/log. Raw status files and credentials are not uploaded.

## Cost controls observed, not changed

The owner's GitHub billing UI showed GitHub Free, included compute USD 0 used of USD 12 included, Actions storage 0 GB of 0.5 GB, and an account-wide Actions budget USD 0 / USD 0 with Usage blocked. No billing setting was changed. Official GitHub documentation distinguishes included usage from billable overage; the USD 0 hard stop must remain enabled. The UI's Usage blocked label does not establish that a free job will start.

Recheck allowance and the existing blocking budget immediately before activation. If GitHub refuses the run, keep it blocked; do not raise the budget, add payment details, make the repository public, or substitute a paid runner. Maximum authorized new external charge remains USD 0. Recheck billable usage after the runs.

## Required owner decision

Approve only this bounded GitHub-hosted test-runner exception to M0's local-host scope and AGENTS.md's no-cloud-provisioning rule. All existing M0 data, cost and release boundaries remain. Approval would authorize executing these prepared checks, not declare them passed. Until approval, no workflow is activated and no cloud runner is requested.

## Acceptance evidence

Required: exact source SHA; successful locked install/build/HTTP results; real SQL proving auth/storage schemas; good/bad login, server validation, refresh and sign-out checks; private object byte round trip; denial for anonymous/public/ungranted users; signed download; fixture cleanup and stack stop. Any failed/missing check keeps M0 blocked. Service PASS alone cannot override an earlier failed build or cleanup. Human acceptance remains deferred to M7 and independent review is not inferred.

## Sources checked

- GitHub billing overview and Budgets and alerts for the authenticated repository owner, read only, November 4, 2026.
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/billing/how-tos/set-up-budgets
- https://github.com/actions/checkout/releases/tag/v7.0.1
- https://github.com/actions/setup-node/releases/tag/v7.1.0

Prepared validation: YAML parsed and trigger/permission/timeout/action-pin controls inspected. This validates the proposal's structure, not GitHub execution or Supabase integration.

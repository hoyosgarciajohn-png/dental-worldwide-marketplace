# Marketplace independent review — in progress

Review date: 2026-11-05. Status: **PENDING — no exact-candidate acceptance verdict yet.** M1 recovery is separately documented in `m1-independent-review.md`.

This review covers the new M2–M6 fictional marketplace candidate. Implementation is still changing. No service-run evidence, candidate hash, broad browser result or production readiness is implied by this interim record. Human owner, clinical, legal, usability and assistive-technology acceptance remain deferred to M7.

## Findings raised during implementation

| Finding | Evidence | Status |
| --- | --- | --- |
| Valid maximum-size upload rejected by validator | Independently called `inspectFictionalFile` with a 5MiB buffer, correct PDF prefix, fictional filename and valid base64: `RangeError: Maximum call stack size exceeded`; repeated base64 regex is the trigger. 1MiB succeeds. | Fixed in source: linear alphabet/padding check plus canonical base64 round trip. Independently reran file unit suite:3/3 PASS including exact5MiB and malformed padding. Final candidate binding pending. |
| Demo accepts unknown estimate prices | `lib/market-demo.ts` accepts the latest estimate even when an item has `amount:null`. | Fixed in reducer and UI; independent local call confirms unknown-price acceptance denied. Final browser/candidate binding pending. |
| Expiry uses transaction-start clock | Draft `market.scope` and `market.quote_current` compare expiry with `now()`, so a transaction waiting on a lock can use stale eligibility. | Source now uses volatile helpers with clock_timestamp after site/case locks. Actual-service confirmation pending. |
| Booking concurrency test uses one session | Both confirmation requests use the same application session and thus serialize on M1 session lock, hiding a missing cross-session site lock. | Test now uses a second login/MFA session; actual-service concurrency result pending. |
| Recovery omits access-bearing state | Initial journal omitted `market.clinical_reviewers` qualification and `market.profiles.services`; restoring an old row could broaden current permission/scope. | Source now journals qualification and services, and test restores/replays both. Actual-service result pending. |
| Recovery does not drain in-flight transactions | Unlocked runtime-gate reads can pass before `recovery_begin` disables capture, then write during restore without journaling. | Market dispatch, M1 wrapper and scanner now acquire shared runtime-row lock before protected work; recovery takes exclusive lock. Runtime result pending. |
| Recovery history completeness is unproven | Reconciliation sets replayed watermark after iterating available rows; MAX alone cannot detect missing journal entries. | Recovery begin now retains expected row count/digest; replay/open validate it, and test removes/restores one expected journal row. This detects loss after begin with retained checkpoint; whole-host/durable journal recovery is not established. |
| Owner outgoing writes bypass withdrawal | Owner branch of access helper always permits, so message/file/outbox retries can continue after patient grant withdrawal. | Owner writes now require active consent/category plus scope or continuity while reads preserve owner history. Actual-service denial pending. |
| Auth backup can resurrect old credentials | Restoring old Auth password hashes permits a new session with an obsolete password; M1 session version replay alone does not prevent new logins. Old deleted factors can also return. | Critical: authoritative credential/factor reconciliation and old-password/new-login regression requested before recovery acceptance. |
| Connected UI confuses role with ownership | All accounts receive patient membership; staff appointment proposals selected patient request action. | Frontend now derives case ownership from authenticated user ID. Final connected browser verification pending. |
| Persisted demo state can crash views | Independent calls confirm malformed nested estimates and invoice references pass restoreDemo validation. | Reported to frontend; bounded nested validation/reset and regression pending. |
| Connected stale response protection | openCase keeps prior aggregate visible while selection changes and async loaders lack generation guards. | Requested clear-before-load plus late-response protection; verification pending. |
| BFF/RPC contract alignment incomplete | Draft BFF action names, file bucket/authorize action and scanner error handling differ from new backend contract. | Action names, private bucket and scanner states aligned in current source; final connected journey test pending. |

## Acceptance evidence required

Review will bind its conclusion to an immutable candidate and recorded lockfile hash. Source inspection and observed tests must establish current authorization before idempotent retries; exact category/recipient and current site membership/MFA; stale-session denial; quarantine isolation and service-only scan transitions; immutable quote revisions and current patient acceptance; serialized booking conflicts and rereads after locking; realtime profile expiry/suspension; qualified clinical support closure; metadata-only append-only audit with rollback on failure; and recovery that cannot restore withdrawn grants, assignments, memberships or stale sessions.

Actual-service evidence must exercise database/Auth/object boundaries, not only a browser-local simulation. Database/object restore checks must demonstrate closed access while restoration/revocation reconciliation is incomplete. Browser checks must distinguish connected behavior from explicit demo simulation and cover the agreed languages, relevant viewports, keyboard/zoom and automated accessibility without labelling human acceptance as passed.

## Recovery coverage limit

The recovery script has been expanded from selected-row restoration to actual local PostgreSQL data dump/restore of Auth and application tables plus all registered private object bytes and bucket configuration. Schema/roles and the gate, current journal/checkpoint, and audit remain retained independently in the local environment. The broader script has not yet executed. It does not establish whole-host reconstruction, offsite durability, PITR or production recovery. Restoring Auth makes credential/factor reconciliation mandatory; the old-password finding above remains a blocker until fixed and exercised.

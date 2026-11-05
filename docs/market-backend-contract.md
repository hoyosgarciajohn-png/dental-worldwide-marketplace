# Marketplace RPC contract

Fictional development only. Public RPC `market_dispatch(p_action text,p_payload jsonb)` returns `{ok:true,data}` or `{ok:false,code}`. BFF uses POST `/api/market` with `{action,payload}`. UUID identifiers and ISO timestamps; integer optimistic `version` is required on state changes. User identity always comes from the current M1 session. All text fields below must start with `FICTIONAL` unless they are enumerations, identifiers, currency, timezone, language or item labels specified below. Current policy consent version is `2026-11-04`. Unknown payload fields are rejected. Optional fields are marked `?`.

## Read actions

| Action | Payload | Data |
|---|---|---|
| `directory.list` | `{}` | array of accepted, unexpired safe profile projections; public |
| `session.me` | `{}` | M1 `{user_id,display_name,mfa_verified,factor_reset_pending,memberships:[{id,role,organization_id,site_id,permissions}],sites:[{id,organization_id,label}]}` |
| `profile.list` | `{}` | own practice profiles, or all profiles for verification reviewer; private evidence included only here |
| `enquiry.list` | `{}` | accessible enquiry rows with `id,patient_id,site_id,service,summary,categories,grant_active,consent_version,continuity,version,created_at` (summary requires care access) |
| `enquiry.read` | `{id}` | `{enquiry,messages,files,estimates,acceptances,appointments,handoffs,support,reviews,coordinators}`; category-filtered; no blanket admin clinical access |
| `file.authorize` | `{id}` | current file row, only clean files and current files-category access; BFF only returns bytes after rechecking |
| `export.create` | `{}` | `{generated_at,profile,enquiries:[aggregates],deletion_requests}` owner-only current snapshot |
| `governance.list` | `{}` | owner's requests or metadata-only platform admin requests |

Directory rows: `site_id,name,summary_en,summary_es,practitioner,languages,services,status,checked_at,expires_at,version`. Staff profile rows also contain `evidence,submitted_by,reviewed_by,check_summary,updated_at`. Expiry is evaluated at read and at new enquiry/confirmation.

## Profile actions

| Action | Payload |
|---|---|
| `profile.save` | `{site_id,version,name,summary_en,summary_es,practitioner,languages:["en","es"],services:["examination","crown"],evidence}`; version 0 creates; editing resets to draft |
| `profile.submit` | `{site_id,version}` |
| `profile.review` | `{site_id,version,decision:"accepted"\|"rejected",check_summary,expires_at}`; independent verification reviewer, future expiry <=1 year |
| `profile.suspend` | `{site_id,version,reason}`; reviewer or platform admin, no site affiliation |

All return current profile row. Practice profile writes require exact-site practice_admin membership with write permission, MFA and no pending reset. Reviewer decisions require active verification_reviewer, MFA and no own-site affiliation. Suspension immediately blocks directory/new enquiries/booking confirmation; history remains with owner.

## Case access and communication

| Action | Payload | Result |
|---|---|---|
| `enquiry.create` | `{key,site_id,service,summary,categories:["contact","care","files"],consent_version}` | enquiry row |
| `consent.set` | `{id,version,active,categories,consent_version}` | enquiry row; owner only |
| `coordinator.assign` | `{id,user_id,active}` | coordinator row; platform admin metadata action |
| `coordinator.grant` | `{id,user_id,active,categories}` | coordinator row; patient owner only |
| `continuity.set` | `{id,version,active}` | enquiry row; platform admin metadata action authorizes suspended-site continuity only |
| `message.send` | `{key,enquiry_id,category:"contact"\|"care",body}` | message row; captured outbox, no real message |
| `outbox.list` | `{}` | actor-owned metadata with current original message write/category access |
| `outbox.process` | `{id}` | actor-owned queued→captured transition; every retry rechecks original message write/category access; never sends externally |
| `file.register` | `{key,enquiry_id,name,mime,size,sha256}` | file row `{id,enquiry_id,uploader_id,name,mime,size,sha256,bucket,object_path,state,scan_method,created_at}` |

Case staff access requires exact current site membership, read/write permission, active consent with requested category, MFA, accepted unexpired scope or explicit continuity. Coordinators additionally require both current assignment AND patient grant, matching categories, active coordinator role and MFA. Patient ownership allows history even after withdrawal. Platform admin can assign/authorize continuity but cannot read case content. Coordinator may communicate/upload, never issue estimates or perform practice clinical transitions. `name` is a filename starting `FICTIONAL` with pdf/png/jpg/jpeg extension. MIME PDF/JPEG/PNG, max5MiB, lowercase 64-hex sha256. Database creates `market-private/<enquiry_id>/<file_id>`; quarantine cannot be cleared by a client. BFF validates actual bytes/signature and hash, then trusted service upload and scan. Failed/quarantined files cannot download.

## Estimates and appointment workflow

| Action | Payload | Result |
|---|---|---|
| `estimate.issue` | `{key,enquiry_id,currency:"USD"\|"COP",items:[{label,amount_cents:number\|null}],exclusions,visits,trip_assumptions,expires_at}` | immutable estimate row with revision and `complete` flag |
| `estimate.accept` | `{id}` | immutable acceptance row; owner, latest complete unexpired revision only |
| `appointment.request` | `{key,enquiry_id,estimate_id,starts_at,timezone}` | requested appointment; owner, current accepted estimate, future time and IANA zone |
| `appointment.propose` | `{id,version,starts_at,timezone}` | proposed appointment; staff; resets patient acceptance |
| `appointment.accept` | `{id,version}` | proposed appointment with `patient_accepted:true`; owner |
| `appointment.confirm` | `{id,version}` | confirmed appointment; staff; current quote, owner acceptance, active consent and scope, future time and serialized 60-minute slot |
| `appointment.cancel` | `{id,version}` | cancelled appointment; owner or staff |
| `appointment.attend` | `{id,version}` | attended appointment; staff, confirmed and scheduled time reached |

Appointment rows: `id,enquiry_id,estimate_id,starts_at,timezone,state,patient_accepted,version,created_at`. Initial request records patient acceptance of that requested time. Proposing a new time always requires a fresh patient `appointment.accept`. Issue a new revision to correct an estimate; rows/acceptances cannot update or delete. Any new estimate invalidates booking against older revisions. Exclusions/trip assumptions are fictional text; items' labels begin FICTIONAL. `visits` integer1–20. Unknown amounts are null and cannot be accepted.

## Handoff, support, review, synthetic billing and governance

| Action | Payload | Result |
|---|---|---|
| `handoff.create` | `{key,enquiry_id,body,contact,followup_at}` | handoff row; staff, attended appointment required |
| `handoff.ack` | `{id,version}` | acknowledged row; owner |
| `support.create` | `{key,enquiry_id,category:"administrative"\|"financial"\|"clinical",body}` | open support row; owner or practice staff |
| `support.close` | `{id,version,resolution}` | closed support row; staff; clinical requires separate current qualification |
| `clinical.assign` | `{site_id,user_id,active}` | qualification metadata; platform admin, target current site practice staff/admin; no self assignment |
| `review.create` | `{key,enquiry_id,rating,body,conflict_declared}` | pending review; owner after attendance, rating1–5 and explicit boolean |
| `review.moderate` | `{id,version,decision:"published"\|"rejected",reason}` | moderated row; independent verification reviewer, no affiliated site |
| `review.appeal` | `{id,version,body}` | appealed row; owner after rejected decision; moderator can review again |
| `invoice.create` | `{key,site_id,period:"YYYY-MM",amount_cents:0\|9900,currency:"USD"}` | synthetic practice subscription ledger; platform admin only; zero-dollar pilot or proposed99USD/site/month, no treatment billing |
| `invoice.list` | `{}` | subscription ledger metadata; exact-site practice admin or platform admin, MFA |
| `review.list` | `{}` | independent verification reviewer queue; excludes affiliated sites |
| `deletion.request` | `{key,reason}` | request with state `pending_review`; owner metadata only |
| `deletion.review` | `{id,version,decision:"held"\|"reviewed",reason}` | request metadata; platform admin, no clinical contents/no erasure claims |

Child state rows carry `id,enquiry_id,version,created_at` plus submitted fields and state. No physical deletion is implemented. Export includes owner data only; admin governance view is metadata only. Review conflict declaration is displayed, does not create verified claims. Subscription invoices always `synthetic:true`, `state:"unpaid"`; they contain site/period/amount and never reference patients, estimates or treatment. No payment processing.

## Operational contracts

All creates with `key` require a client-generated UUID. Retry requires identical payload and current original action write permission/category; revoked consent, removed membership, revoked coordinator grant/assignment, suspended scope and stale session are checked before return. Retry returns the CURRENT referenced row (including file scan state). Reusing key with altered payload returns `idempotency_conflict`. Non-create changes use optimistic versions; stale writes return `stale_version`. Read arrays can be empty. Errors include `invalid_request`, `forbidden`, `session_expired`, `rate_limited`, `recovery_locked`, `not_found`, `stale_version`, `invalid_state`, `scope_unavailable`, `quote_unavailable`, `slot_conflict`, `file_unavailable`, `idempotency_conflict`.

Rate:120 authenticated market operations/minute, with an additional10/minute for file.register; buckets in `market.rate_buckets`. Private tables all have RLS and no direct client privileges. Private bucket `market-private` has no client policies. `public.market_scan_result(p_file_id uuid,p_sha256 text,p_state text,p_method text default 'simulated')` is service_role-only and accepts `clean`, `rejected` or `error`; it checks matching hash, current gate and stored object existence. `public.market_health()` is service_role-only, returns `{ready}` based on runtime gate. No public client scan action.

`market.runtime_state(id boolean primary key,protected_access_enabled boolean,recovery_recording boolean)` singleton id=true. Gate closes all market access including directory and trusted scan. Recovery agent owns metadata journal/reconciliation functions. Lock order for site/case mutations: advisory site lock using `pg_advisory_xact_lock(hashtextextended(site_id::text,0))`, then enquiry row lock, then reselect child. Tables: profiles, enquiries, coordinators, messages, files, estimates, acceptances, appointments, handoffs, support, clinical_reviewers, reviews, invoices, deletion_requests, outbox, mutations, rate_buckets, runtime_state. Recovery may snapshot/restore these names. Audit writes use append-only M1 metadata events; any audit failure rolls back operation.

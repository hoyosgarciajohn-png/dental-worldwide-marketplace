-- Fictional M2–M5 marketplace. No clinical production service, payments or external delivery.
-- Supabase docs: database/functions, database/postgres/row-level-security, storage/security/access-control.
create schema market;
revoke all on schema market from public,anon,authenticated;
grant usage on schema market to authenticated;
alter default privileges in schema market revoke all on tables from public,anon,authenticated;
alter default privileges in schema market revoke execute on functions from public,anon,authenticated;

create table market.runtime_state(id boolean primary key default true check(id),protected_access_enabled boolean not null default true,recovery_recording boolean not null default true);
insert into market.runtime_state(id) values(true);
create table market.profiles(
 site_id uuid primary key references m1.sites(id),name text not null,summary_en text not null,summary_es text not null,practitioner text not null,languages text[] not null,services text[] not null,evidence text not null,
 status text not null default 'draft' check(status in('draft','submitted','accepted','rejected','suspended')),submitted_by uuid references m1.accounts(id),reviewed_by uuid references m1.accounts(id),check_summary text,checked_at timestamptz,expires_at timestamptz,version bigint not null default 1,updated_at timestamptz not null default now());
create table market.enquiries(
 id uuid primary key default gen_random_uuid(),patient_id uuid not null references m1.accounts(id),site_id uuid not null references m1.sites(id),service text not null check(service in('examination','crown')),summary text not null,categories text[] not null,grant_active boolean not null default true,consent_version text not null,continuity boolean not null default false,version bigint not null default 1,created_at timestamptz not null default now());
create index enquiries_site on market.enquiries(site_id); create index enquiries_owner on market.enquiries(patient_id);
create table market.coordinators(enquiry_id uuid references market.enquiries(id),user_id uuid references m1.accounts(id),assigned boolean not null default false,granted boolean not null default false,categories text[] not null default '{}',version bigint not null default 1,primary key(enquiry_id,user_id));
create table market.messages(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),author_id uuid not null references m1.accounts(id),category text not null check(category in('contact','care')),body text not null,created_at timestamptz not null default now());
create table market.files(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),uploader_id uuid not null references m1.accounts(id),name text not null,mime text not null,size integer not null check(size>0 and size<=5242880),sha256 text not null check(sha256~'^[0-9a-f]{64}$'),bucket text not null default 'market-private' check(bucket='market-private'),object_path text not null unique,state text not null default 'quarantine' check(state in('quarantine','clean','rejected','error')),scan_method text,created_at timestamptz not null default now());
create table market.estimates(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),author_id uuid not null references m1.accounts(id),revision integer not null,currency text not null check(currency in('USD','COP')),items jsonb not null,complete boolean not null,total_cents bigint,exclusions text not null,visits integer not null check(visits between 1 and 20),trip_assumptions text not null,expires_at timestamptz not null,created_at timestamptz not null default now(),unique(enquiry_id,revision));
create table market.acceptances(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),estimate_id uuid not null references market.estimates(id) unique,patient_id uuid not null references m1.accounts(id),created_at timestamptz not null default now());
create table market.appointments(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),estimate_id uuid not null references market.estimates(id),starts_at timestamptz not null,timezone text not null,state text not null default 'requested' check(state in('requested','proposed','confirmed','attended','cancelled')),patient_accepted boolean not null default true,version bigint not null default 1,created_at timestamptz not null default now());
create index appointments_slot on market.appointments(starts_at) where state='confirmed';
create table market.handoffs(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),author_id uuid not null references m1.accounts(id),body text not null,contact text not null,followup_at timestamptz not null,state text not null default 'pending' check(state in('pending','acknowledged')),version bigint not null default 1,created_at timestamptz not null default now());
create table market.support(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id),author_id uuid not null references m1.accounts(id),category text not null check(category in('administrative','financial','clinical')),body text not null,state text not null default 'open' check(state in('open','closed')),resolution text,closed_by uuid references m1.accounts(id),version bigint not null default 1,created_at timestamptz not null default now());
create table market.clinical_reviewers(site_id uuid references m1.sites(id),user_id uuid references m1.accounts(id),active boolean not null default true,primary key(site_id,user_id));
create table market.reviews(id uuid primary key default gen_random_uuid(),enquiry_id uuid not null references market.enquiries(id) unique,patient_id uuid not null references m1.accounts(id),rating integer not null check(rating between 1 and 5),body text not null,conflict_declared boolean not null,state text not null default 'pending' check(state in('pending','published','rejected','appealed')),reason text,appeal text,moderated_by uuid references m1.accounts(id),version bigint not null default 1,created_at timestamptz not null default now());
create table market.invoices(id uuid primary key default gen_random_uuid(),site_id uuid not null references m1.sites(id),period text not null check(period~'^20[0-9]{2}-(0[1-9]|1[0-2])$'),amount_cents integer not null check(amount_cents in(0,9900)),currency text not null default 'USD' check(currency='USD'),synthetic boolean not null default true check(synthetic),state text not null default 'unpaid' check(state='unpaid'),created_at timestamptz not null default now(),unique(site_id,period));
create table market.deletion_requests(id uuid primary key default gen_random_uuid(),patient_id uuid not null references m1.accounts(id),reason text not null,state text not null default 'pending_review' check(state in('pending_review','held','reviewed')),review_reason text,reviewed_by uuid references m1.accounts(id),version bigint not null default 1,created_at timestamptz not null default now());
create table market.outbox(id uuid primary key default gen_random_uuid(),actor_id uuid not null references m1.accounts(id),enquiry_id uuid not null references market.enquiries(id),message_id uuid not null references market.messages(id) unique,category text not null,state text not null default 'queued' check(state in('queued','captured')),created_at timestamptz not null default now(),captured_at timestamptz);
create table market.mutations(actor_id uuid references m1.accounts(id),key uuid,action text not null,payload jsonb not null,kind text not null,object_id uuid not null,created_at timestamptz not null default now(),primary key(actor_id,key));
create table market.rate_buckets(key text primary key,started_at timestamptz not null,attempts integer not null);

-- Foreign-key lookup indexes keep aggregate authorization and recovery workload bounded.
create index messages_case on market.messages(enquiry_id); create index files_case on market.files(enquiry_id);
create index appointments_case on market.appointments(enquiry_id); create index handoffs_case on market.handoffs(enquiry_id);
create index support_case on market.support(enquiry_id); create index coordinators_user on market.coordinators(user_id);
create index outbox_actor on market.outbox(actor_id); create index deletion_owner on market.deletion_requests(patient_id);
do $$declare t record;begin for t in select tablename from pg_tables where schemaname='market' loop execute format('alter table market.%I enable row level security',t.tablename);end loop;end$$;
revoke all on all tables in schema market from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('market-private','market-private',false,5242880,array['application/pdf','image/jpeg','image/png']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
-- This bucket stays unavailable to ordinary clients even if another application adds a broad permissive Storage policy.
create policy market_private_direct_deny on storage.objects as restrictive for all to anon,authenticated using(bucket_id<>'market-private') with check(bucket_id<>'market-private');

create function market.require(p_ok boolean,p_code text default 'forbidden') returns void language plpgsql set search_path='' as $$begin if not coalesce(p_ok,false) then raise exception using errcode='MQ001',message=p_code;end if;end$$;
create function market.fictional(p_text text,p_limit integer default 2000) returns boolean language sql immutable set search_path='' as $$select p_text like 'FICTIONAL%' and length(p_text) between 9 and p_limit$$;
create function market.privileged(p_user uuid,p_role text) returns boolean language sql stable set search_path='' as $$select m1.has_role(p_user,p_role) and m1.has_mfa(p_user) and exists(select 1 from m1.accounts where id=p_user and active and not factor_reset_pending)$$;
create function market.staff(p_user uuid,p_site uuid,p_write boolean default false,p_admin boolean default false) returns boolean language sql stable set search_path='' as $$select m1.has_mfa(p_user) and exists(select 1 from m1.accounts where id=p_user and active and not factor_reset_pending) and exists(select 1 from m1.memberships m join m1.sites s on s.id=m.site_id and s.organization_id=m.organization_id where m.user_id=p_user and m.site_id=p_site and m.active and m.role=any(case when p_admin then array['practice_admin'] else array['practice_admin','practice_staff'] end) and (case when p_write then 'write' else 'read' end)=any(m.permissions))$$;
create function market.affiliated(p_user uuid,p_site uuid) returns boolean language sql stable set search_path='' as $$select exists(select 1 from m1.memberships m join m1.sites s on s.id=p_site where m.user_id=p_user and m.active and m.role in('practice_admin','practice_staff') and (m.site_id=p_site or m.organization_id=s.organization_id))$$;
create function market.scope(p_site uuid,p_service text default null) returns boolean language sql volatile set search_path='' as $$select exists(select 1 from market.profiles where site_id=p_site and status='accepted' and expires_at>clock_timestamp() and (p_service is null or p_service=any(services)))$$;
create function market.access(p_user uuid,p_id uuid,p_category text,p_write boolean default false) returns boolean language sql volatile set search_path='' as $$
 select exists(select 1 from market.enquiries e where e.id=p_id and ((e.patient_id=p_user and (not p_write or (e.grant_active and p_category=any(e.categories) and (market.scope(e.site_id,e.service) or e.continuity)))) or (e.grant_active and p_category=any(e.categories) and (market.scope(e.site_id,e.service) or e.continuity) and (market.staff(p_user,e.site_id,p_write) or (market.privileged(p_user,'coordinator') and exists(select 1 from market.coordinators c where c.enquiry_id=e.id and c.user_id=p_user and c.assigned and c.granted and p_category=any(c.categories)))))))$$;
create function market.case_staff(p_user uuid,p_id uuid,p_category text,p_write boolean default true) returns boolean language sql volatile set search_path='' as $$select exists(select 1 from market.enquiries e where e.id=p_id and market.staff(p_user,e.site_id,p_write) and market.access(p_user,e.id,p_category,p_write))$$;
create function market.quote_current(p_id uuid,p_estimate uuid) returns boolean language sql volatile set search_path='' as $$select exists(select 1 from market.estimates q where q.id=p_estimate and q.enquiry_id=p_id and q.complete and q.expires_at>clock_timestamp() and q.revision=(select max(revision) from market.estimates where enquiry_id=p_id) and exists(select 1 from market.acceptances a where a.estimate_id=q.id))$$;
create function market.safe_profile(p market.profiles) returns jsonb language sql stable set search_path='' as $$select to_jsonb(p)-array['evidence','submitted_by','reviewed_by','check_summary','updated_at']$$;
create function market.aggregate(p_user uuid,p_id uuid) returns jsonb language sql volatile set search_path='' as $$
 select jsonb_build_object('enquiry',case when market.access(p_user,p_id,'care') then to_jsonb(e) else to_jsonb(e)-'summary' end,
 'messages',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at) from market.messages x where x.enquiry_id=e.id and market.access(p_user,e.id,x.category)),'[]'),
 'files',coalesce((select jsonb_agg(to_jsonb(x)-'object_path' order by x.created_at) from market.files x where x.enquiry_id=e.id and market.access(p_user,e.id,'files')),'[]'),
 'estimates',coalesce((select jsonb_agg(to_jsonb(x) order by x.revision) from market.estimates x where x.enquiry_id=e.id and market.access(p_user,e.id,'care')),'[]'),
 'acceptances',coalesce((select jsonb_agg(to_jsonb(x)) from market.acceptances x where x.enquiry_id=e.id and market.access(p_user,e.id,'care')),'[]'),
 'appointments',coalesce((select jsonb_agg(to_jsonb(x)) from market.appointments x where x.enquiry_id=e.id and market.access(p_user,e.id,'care')),'[]'),
 'handoffs',coalesce((select jsonb_agg(to_jsonb(x)) from market.handoffs x where x.enquiry_id=e.id and market.access(p_user,e.id,'care')),'[]'),
 'support',coalesce((select jsonb_agg(to_jsonb(x)) from market.support x where x.enquiry_id=e.id and market.access(p_user,e.id,case when x.category='clinical' then 'care' else 'contact' end)),'[]'),
 'reviews',coalesce((select jsonb_agg(to_jsonb(x)) from market.reviews x where x.enquiry_id=e.id and (e.patient_id=p_user or market.case_staff(p_user,e.id,'contact',false))),'[]'),
 'coordinators',case when e.patient_id=p_user then coalesce((select jsonb_agg(to_jsonb(x)) from market.coordinators x where x.enquiry_id=e.id),'[]') else '[]'::jsonb end)
 from market.enquiries e where e.id=p_id and (market.access(p_user,p_id,'contact') or market.access(p_user,p_id,'care') or market.access(p_user,p_id,'files'))$$;
create function market.current_entity(p_kind text,p_id uuid) returns jsonb language plpgsql stable set search_path='' as $$declare d jsonb;begin
 case p_kind
 when 'enquiry' then select to_jsonb(t) into d from market.enquiries t where id=p_id;
 when 'message' then select to_jsonb(t) into d from market.messages t where id=p_id;
 when 'file' then select to_jsonb(t) into d from market.files t where id=p_id;
 when 'estimate' then select to_jsonb(t) into d from market.estimates t where id=p_id;
 when 'appointment' then select to_jsonb(t) into d from market.appointments t where id=p_id;
 when 'handoff' then select to_jsonb(t) into d from market.handoffs t where id=p_id;
 when 'support' then select to_jsonb(t) into d from market.support t where id=p_id;
 when 'review' then select to_jsonb(t) into d from market.reviews t where id=p_id;
 when 'invoice' then select to_jsonb(t) into d from market.invoices t where id=p_id;
 when 'deletion' then select to_jsonb(t) into d from market.deletion_requests t where id=p_id;
 else perform market.require(false,'invalid_request');end case;return d;end$$;
create function market.replay(p_user uuid,p_action text,p_payload jsonb) returns jsonb language plpgsql set search_path='' as $$declare r market.mutations%rowtype; k uuid;begin
 k:=(p_payload->>'key')::uuid;perform market.require(k is not null,'invalid_request');
 select * into r from market.mutations where actor_id=p_user and key=k;
 if not found then return null;end if;
 perform market.require(r.action=p_action and r.payload=p_payload-'key','idempotency_conflict');return market.current_entity(r.kind,r.object_id);end$$;
create function market.remember(p_user uuid,p_action text,p_payload jsonb,p_kind text,p_id uuid) returns void language sql set search_path='' as $$insert into market.mutations(actor_id,key,action,payload,kind,object_id) values(p_user,(p_payload->>'key')::uuid,p_action,p_payload-'key',p_kind,p_id)$$;
create function market.limit(p_user uuid,p_files boolean) returns boolean language plpgsql set search_path='' as $$declare k text;n integer;begin
 k:=p_user::text||case when p_files then ':files' else ':all' end;
 insert into market.rate_buckets(key,started_at,attempts) values(k,clock_timestamp(),1) on conflict(key) do update set started_at=case when market.rate_buckets.started_at<clock_timestamp()-interval '1 minute' then clock_timestamp() else market.rate_buckets.started_at end,attempts=case when market.rate_buckets.started_at<clock_timestamp()-interval '1 minute' then 1 else market.rate_buckets.attempts+1 end returning attempts into n;
 return n<=case when p_files then 10 else 120 end;end$$;
create function market.immutable() returns trigger language plpgsql set search_path='' as $$begin raise exception 'immutable_record';end$$;
create trigger immutable_estimates before update or delete on market.estimates for each row execute function market.immutable();
create trigger immutable_acceptances before update or delete on market.acceptances for each row execute function market.immutable();
create trigger immutable_invoices before update or delete on market.invoices for each row execute function market.immutable();

create function market.dispatch(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); d jsonb; auth_result jsonb; keys text[]; oid uuid; eid uuid; sid uuid; target uuid; qid uuid; org uuid; ver bigint; k text; cats text[]; langs text[]; svcs text[];
 p market.profiles%rowtype;e market.enquiries%rowtype;q market.estimates%rowtype;ap market.appointments%rowtype;su market.support%rowtype;rv market.reviews%rowtype;f market.files%rowtype;h market.handoffs%rowtype;o market.outbox%rowtype;dr market.deletion_requests%rowtype;
 total bigint;complete boolean;rev integer;ts timestamptz;expiry timestamptz;item jsonb;kind text;reason text;
begin
 perform 1 from market.runtime_state where id for share;
 if not coalesce((select protected_access_enabled from market.runtime_state where id),false) then return jsonb_build_object('ok',false,'code','recovery_locked');end if;
 if p_action='directory.list' then
  if p_payload<>'{}'::jsonb then return jsonb_build_object('ok',false,'code','invalid_request');end if;
  select coalesce(jsonb_agg(market.safe_profile(x) order by x.name),'[]') into d from market.profiles x where market.scope(x.site_id);
  return jsonb_build_object('ok',true,'data',d);
 end if;
  keys:=case p_action
   when 'session.me' then array[]::text[] when 'profile.list' then array[]::text[] when 'enquiry.list' then array[]::text[] when 'export.create' then array[]::text[] when 'governance.list' then array[]::text[] when 'outbox.list' then array[]::text[] when 'invoice.list' then array[]::text[] when 'review.list' then array[]::text[] when 'operations.list' then array[]::text[] when 'coordinator.list' then array[]::text[]
   when 'profile.save' then array['site_id','version','name','summary_en','summary_es','practitioner','languages','services','evidence']
   when 'profile.submit' then array['site_id','version'] when 'profile.review' then array['site_id','version','decision','check_summary','expires_at'] when 'profile.suspend' then array['site_id','version','reason']
   when 'enquiry.create' then array['key','site_id','service','summary','categories','consent_version']
   when 'enquiry.read' then array['id'] when 'file.authorize' then array['id'] when 'estimate.accept' then array['id'] when 'outbox.process' then array['id']
   when 'consent.set' then array['id','version','active','categories','consent_version']
   when 'coordinator.assign' then array['id','user_id','active'] when 'coordinator.grant' then array['id','user_id','active','categories'] when 'continuity.set' then array['id','version','active']
   when 'message.send' then array['key','enquiry_id','category','body'] when 'file.register' then array['key','enquiry_id','name','mime','size','sha256']
   when 'estimate.issue' then array['key','enquiry_id','currency','items','exclusions','visits','trip_assumptions','expires_at']
   when 'appointment.request' then array['key','enquiry_id','estimate_id','starts_at','timezone'] when 'appointment.propose' then array['id','version','starts_at','timezone']
   when 'appointment.accept' then array['id','version'] when 'appointment.confirm' then array['id','version'] when 'appointment.cancel' then array['id','version'] when 'appointment.attend' then array['id','version']
   when 'handoff.create' then array['key','enquiry_id','body','contact','followup_at'] when 'handoff.ack' then array['id','version']
   when 'support.create' then array['key','enquiry_id','category','body'] when 'support.close' then array['id','version','resolution']
   when 'clinical.assign' then array['site_id','user_id','active'] when 'review.create' then array['key','enquiry_id','rating','body','conflict_declared']
   when 'review.moderate' then array['id','version','decision','reason'] when 'review.appeal' then array['id','version','body']
   when 'invoice.create' then array['key','site_id','period','amount_cents','currency'] when 'deletion.request' then array['key','reason'] when 'deletion.review' then array['id','version','decision','reason']
   else null end;
 k:=case when keys is null then 'request.invalid' else p_action end;
 auth_result:=m1.dispatch('session.me','{}');if not coalesce((auth_result->>'ok')::boolean,false) then return auth_result;end if;
 if not market.limit(u,false) or (p_action='file.register' and not market.limit(u,true)) then perform m1.audit(u,k,null,null,false);return jsonb_build_object('ok',false,'code','rate_limited');end if;
 begin
  perform market.require(jsonb_typeof(p_payload)='object' and octet_length(p_payload::text)<=65536,'invalid_request');
  perform market.require(keys is not null and not exists(select 1 from jsonb_object_keys(p_payload) x where not(x=any(keys))) and p_payload ?& keys,'invalid_request');
  if p_payload ? 'key' then perform pg_advisory_xact_lock(hashtextextended(u::text||':'||(p_payload->>'key')::uuid::text,1));end if;
  oid:=(p_payload->>'id')::uuid;eid:=(p_payload->>'enquiry_id')::uuid;sid:=(p_payload->>'site_id')::uuid;target:=(p_payload->>'user_id')::uuid;qid:=(p_payload->>'estimate_id')::uuid;ver:=(p_payload->>'version')::bigint;
  if p_action in('enquiry.read','consent.set','coordinator.assign','coordinator.grant','continuity.set') then eid:=oid;
  elsif p_action in('file.authorize') then select enquiry_id into eid from market.files where id=oid;
  elsif p_action='estimate.accept' then select enquiry_id into eid from market.estimates where id=oid;
  elsif p_action like 'appointment.%' and p_action<>'appointment.request' then select enquiry_id into eid from market.appointments where id=oid;
  elsif p_action='handoff.ack' then select enquiry_id into eid from market.handoffs where id=oid;
  elsif p_action='support.close' then select enquiry_id into eid from market.support where id=oid;
  elsif p_action in('review.moderate','review.appeal') then select enquiry_id into eid from market.reviews where id=oid;
  elsif p_action='outbox.process' then select enquiry_id into eid from market.outbox where id=oid;end if;
  if eid is not null then select site_id into sid from market.enquiries where id=eid;end if;
  if sid is not null then
   perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
   select organization_id into org from m1.sites where id=sid;
   select * into p from market.profiles where site_id=sid for update;
  end if;
  if eid is not null then select * into e from market.enquiries where id=eid for update;end if;
  -- Child rows are deliberately read after site/case locks, including support and review transitions.
  if p_action='file.authorize' then select * into f from market.files where id=oid;
  elsif p_action='estimate.accept' then select * into q from market.estimates where id=oid;
  elsif p_action like 'appointment.%' and p_action<>'appointment.request' then select * into ap from market.appointments where id=oid for update;
  elsif p_action='handoff.ack' then select * into h from market.handoffs where id=oid for update;
  elsif p_action='support.close' then select * into su from market.support where id=oid for update;
  elsif p_action in('review.moderate','review.appeal') then select * into rv from market.reviews where id=oid for update;
  elsif p_action='outbox.process' then select * into o from market.outbox where id=oid for update;
  elsif p_action='deletion.review' then select * into dr from market.deletion_requests where id=oid for update;end if;

  if p_action='session.me' then d:=auth_result->'data';
  elsif p_action='coordinator.list' then
   select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'label',a.display_name) order by a.display_name),'[]') into d from m1.accounts a where a.active and m1.has_role(a.id,'coordinator');
  elsif p_action='operations.list' then
   perform market.require(market.privileged(u,'platform_admin'));
   select jsonb_build_object(
    'enquiries',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'site_id',x.site_id,'version',x.version,'grant_active',x.grant_active,'continuity',x.continuity) order by x.created_at) from market.enquiries x),'[]'),
    'sites',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'organization_id',x.organization_id,'label',x.label) order by x.label) from m1.sites x),'[]'),
    'organizations',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'label',x.label) order by x.label) from m1.organizations x),'[]'),
    'accounts',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'label',x.display_name) order by x.display_name) from m1.accounts x where x.active),'[]'),
    'coordinators',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'label',x.display_name) order by x.display_name) from m1.accounts x where x.active and m1.has_role(x.id,'coordinator')),'[]'),
    'practitioners',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'label',x.display_name,'site_id',m.site_id,'role',m.role) order by x.display_name) from m1.accounts x join m1.memberships m on m.user_id=x.id where x.active and m.active and m.role in('practice_admin','practice_staff') and 'write'=any(m.permissions)),'[]'),
    'profiles',coalesce((select jsonb_agg(market.safe_profile(x) order by x.name) from market.profiles x),'[]')) into d;
  elsif p_action='profile.list' then
   perform market.require(market.privileged(u,'verification_reviewer') or exists(select 1 from m1.sites where market.staff(u,id,false,true)));
   select coalesce(jsonb_agg(to_jsonb(x) order by x.name),'[]') into d from market.profiles x where market.privileged(u,'verification_reviewer') or market.staff(u,x.site_id,false,true);
  elsif p_action='profile.save' then
   perform market.require(market.staff(u,sid,true,true));perform market.require(ver=coalesce(p.version,0),'stale_version');
   select array_agg(x) into langs from jsonb_array_elements_text(p_payload->'languages') x;select array_agg(x) into svcs from jsonb_array_elements_text(p_payload->'services') x;
   perform market.require(market.fictional(p_payload->>'name',160) and market.fictional(p_payload->>'summary_en') and market.fictional(p_payload->>'summary_es') and market.fictional(p_payload->>'practitioner',200) and market.fictional(p_payload->>'evidence') and cardinality(langs)>0 and langs<@array['en','es'] and cardinality(svcs)>0 and svcs<@array['examination','crown'],'invalid_request');
   insert into market.profiles(site_id,name,summary_en,summary_es,practitioner,languages,services,evidence) values(sid,p_payload->>'name',p_payload->>'summary_en',p_payload->>'summary_es',p_payload->>'practitioner',langs,svcs,p_payload->>'evidence') on conflict(site_id) do update set name=excluded.name,summary_en=excluded.summary_en,summary_es=excluded.summary_es,practitioner=excluded.practitioner,languages=excluded.languages,services=excluded.services,evidence=excluded.evidence,status='draft',submitted_by=null,reviewed_by=null,check_summary=null,checked_at=null,expires_at=null,version=market.profiles.version+1,updated_at=clock_timestamp() returning to_jsonb(market.profiles.*) into d;
  elsif p_action='profile.submit' then
   perform market.require(market.staff(u,sid,true,true));perform market.require(p.version=ver,'stale_version');perform market.require(p.status in('draft','rejected'),'invalid_state');
   update market.profiles set status='submitted',submitted_by=u,version=version+1,updated_at=clock_timestamp() where site_id=sid returning to_jsonb(market.profiles.*) into d;
  elsif p_action='profile.review' then
   perform market.require(market.privileged(u,'verification_reviewer') and not market.affiliated(u,sid) and p.submitted_by<>u);perform market.require(p.version=ver,'stale_version');perform market.require(p.status='submitted','invalid_state');
   expiry:=(p_payload->>'expires_at')::timestamptz;perform market.require(p_payload->>'decision' in('accepted','rejected') and market.fictional(p_payload->>'check_summary') and expiry>clock_timestamp() and expiry<=clock_timestamp()+interval '1 year','invalid_request');
   update market.profiles set status=p_payload->>'decision',check_summary=p_payload->>'check_summary',reviewed_by=u,checked_at=clock_timestamp(),expires_at=expiry,version=version+1,updated_at=clock_timestamp() where site_id=sid returning to_jsonb(market.profiles.*) into d;
  elsif p_action='profile.suspend' then
   perform market.require((market.privileged(u,'verification_reviewer') or market.privileged(u,'platform_admin')) and not market.affiliated(u,sid));perform market.require(p.version=ver,'stale_version');perform market.require(market.fictional(p_payload->>'reason'),'invalid_request');
   update market.profiles set status='suspended',check_summary=p_payload->>'reason',reviewed_by=u,checked_at=clock_timestamp(),version=version+1,updated_at=clock_timestamp() where site_id=sid returning to_jsonb(market.profiles.*) into d;
  elsif p_action='enquiry.list' then
   select coalesce(jsonb_agg(case when market.access(u,x.id,'care') then to_jsonb(x) else to_jsonb(x)-'summary' end order by x.created_at desc),'[]') into d from market.enquiries x where market.access(u,x.id,'contact') or market.access(u,x.id,'care') or market.access(u,x.id,'files');
  elsif p_action='enquiry.read' then
   d:=market.aggregate(u,eid);perform market.require(d is not null);
  elsif p_action='enquiry.create' then
   perform market.require(m1.has_role(u,'patient'));perform market.require(market.scope(sid,p_payload->>'service'),'scope_unavailable');
   select array_agg(x) into cats from jsonb_array_elements_text(p_payload->'categories') x;
   perform market.require(cardinality(cats)>0 and cats<@array['contact','care','files'] and p_payload->>'consent_version'='2026-11-04' and market.fictional(p_payload->>'summary'),'invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then
    insert into market.enquiries(patient_id,site_id,service,summary,categories,consent_version) values(u,sid,p_payload->>'service',p_payload->>'summary',cats,p_payload->>'consent_version') returning id,to_jsonb(market.enquiries.*) into oid,d;perform market.remember(u,p_action,p_payload,'enquiry',oid);
   end if;
  elsif p_action='consent.set' then
   perform market.require(e.patient_id=u);perform market.require(e.version=ver,'stale_version');select coalesce(array_agg(x),'{}') into cats from jsonb_array_elements_text(p_payload->'categories') x;
   perform market.require(cats<@array['contact','care','files'] and p_payload->>'consent_version'='2026-11-04' and jsonb_typeof(p_payload->'active')='boolean' and (not (p_payload->>'active')::boolean or cardinality(cats)>0),'invalid_request');
   update market.enquiries set categories=cats,grant_active=(p_payload->>'active')::boolean,consent_version=p_payload->>'consent_version',version=version+1 where id=eid returning to_jsonb(market.enquiries.*) into d;
  elsif p_action in('coordinator.assign','coordinator.grant') then
   perform market.require(e.id is not null and case when p_action='coordinator.assign' then market.privileged(u,'platform_admin') else e.patient_id=u end);
   perform market.require(target<>e.patient_id and m1.has_role(target,'coordinator') and exists(select 1 from m1.accounts where id=target and active) and jsonb_typeof(p_payload->'active')='boolean','invalid_request');
   if p_action='coordinator.grant' then select coalesce(array_agg(x),'{}') into cats from jsonb_array_elements_text(p_payload->'categories') x;perform market.require(cats<@array['contact','care','files'] and (not (p_payload->>'active')::boolean or cardinality(cats)>0),'invalid_request');end if;
   insert into market.coordinators(enquiry_id,user_id) values(eid,target) on conflict do nothing;
   if p_action='coordinator.assign' then update market.coordinators set assigned=(p_payload->>'active')::boolean,version=version+1 where enquiry_id=eid and user_id=target returning to_jsonb(market.coordinators.*) into d;
   else update market.coordinators set granted=(p_payload->>'active')::boolean,categories=cats,version=version+1 where enquiry_id=eid and user_id=target returning to_jsonb(market.coordinators.*) into d;end if;
  elsif p_action='continuity.set' then
   perform market.require(e.id is not null and market.privileged(u,'platform_admin'));perform market.require(e.version=ver,'stale_version');perform market.require(jsonb_typeof(p_payload->'active')='boolean','invalid_request');
   update market.enquiries set continuity=(p_payload->>'active')::boolean,version=version+1 where id=eid returning to_jsonb(market.enquiries.*) into d;
  elsif p_action='message.send' then
   perform market.require(p_payload->>'category' in('contact','care') and market.fictional(p_payload->>'body'),'invalid_request');perform market.require(market.access(u,eid,p_payload->>'category',true));
   d:=market.replay(u,p_action,p_payload);if d is null then
    insert into market.messages(enquiry_id,author_id,category,body) values(eid,u,p_payload->>'category',p_payload->>'body') returning id,to_jsonb(market.messages.*) into oid,d;
    insert into market.outbox(actor_id,enquiry_id,message_id,category) values(u,eid,oid,p_payload->>'category');perform market.remember(u,p_action,p_payload,'message',oid);
   end if;
  elsif p_action='outbox.list' then
   select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at),'[]') into d from market.outbox x where x.actor_id=u and market.access(u,x.enquiry_id,x.category,true);
  elsif p_action='outbox.process' then
   perform market.require(o.actor_id=u and market.access(u,eid,o.category,true));
   update market.outbox set state='captured',captured_at=coalesce(captured_at,clock_timestamp()) where id=oid returning to_jsonb(market.outbox.*) into d;
  elsif p_action='file.register' then
   perform market.require(market.access(u,eid,'files',true));
   perform market.require(p_payload->>'name'~'^FICTIONAL[^/\\]{0,180}\.(pdf|png|jpg|jpeg)$' and (p_payload->>'size')::integer between 1 and 5242880 and p_payload->>'sha256'~'^[0-9a-f]{64}$' and ((p_payload->>'mime'='application/pdf' and p_payload->>'name'~'\.pdf$') or (p_payload->>'mime'='image/png' and p_payload->>'name'~'\.png$') or (p_payload->>'mime'='image/jpeg' and p_payload->>'name'~'\.(jpg|jpeg)$')),'invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then oid:=gen_random_uuid();insert into market.files(id,enquiry_id,uploader_id,name,mime,size,sha256,object_path) values(oid,eid,u,p_payload->>'name',p_payload->>'mime',(p_payload->>'size')::integer,p_payload->>'sha256',eid::text||'/'||oid::text) returning to_jsonb(market.files.*) into d;perform market.remember(u,p_action,p_payload,'file',oid);end if;
  elsif p_action='file.authorize' then
   perform market.require(market.access(u,eid,'files'));perform market.require(f.state='clean','file_unavailable');d:=to_jsonb(f);
  elsif p_action='estimate.issue' then
   perform market.require(market.case_staff(u,eid,'care'));perform market.require(market.scope(sid,e.service),'scope_unavailable');
   expiry:=(p_payload->>'expires_at')::timestamptz;
   perform market.require(p_payload->>'currency' in('USD','COP') and jsonb_typeof(p_payload->'items')='array' and jsonb_array_length(p_payload->'items') between 1 and 30 and market.fictional(p_payload->>'exclusions') and market.fictional(p_payload->>'trip_assumptions') and (p_payload->>'visits')::integer between 1 and 20 and expiry>clock_timestamp() and expiry<=clock_timestamp()+interval '1 year','invalid_request');
   total:=0;complete:=true;
   for item in select value from jsonb_array_elements(p_payload->'items') loop
    perform market.require(jsonb_typeof(item)='object' and item ?& array['label','amount_cents'] and not exists(select 1 from jsonb_object_keys(item) x where x not in('label','amount_cents')) and market.fictional(item->>'label',160) and (item->'amount_cents'='null'::jsonb or (jsonb_typeof(item->'amount_cents')='number' and item->>'amount_cents'~'^[0-9]+$' and (item->>'amount_cents')::bigint<=100000000000)),'invalid_request');
    if item->'amount_cents'='null'::jsonb then complete:=false;else total:=total+(item->>'amount_cents')::bigint;end if;
   end loop;
   d:=market.replay(u,p_action,p_payload);if d is null then
    select coalesce(max(revision),0)+1 into rev from market.estimates where enquiry_id=eid;
    insert into market.estimates(enquiry_id,author_id,revision,currency,items,complete,total_cents,exclusions,visits,trip_assumptions,expires_at) values(eid,u,rev,p_payload->>'currency',p_payload->'items',complete,case when complete then total else null end,p_payload->>'exclusions',(p_payload->>'visits')::integer,p_payload->>'trip_assumptions',expiry) returning id,to_jsonb(market.estimates.*) into oid,d;perform market.remember(u,p_action,p_payload,'estimate',oid);
   end if;
  elsif p_action='estimate.accept' then
   perform market.require(e.patient_id=u and e.grant_active and 'care'=any(e.categories));
   perform market.require(q.complete and q.expires_at>clock_timestamp() and q.revision=(select max(revision) from market.estimates where enquiry_id=eid),'quote_unavailable');
   insert into market.acceptances(enquiry_id,estimate_id,patient_id) values(eid,oid,u) on conflict(estimate_id) do nothing;
   select to_jsonb(x) into d from market.acceptances x where estimate_id=oid;
  elsif p_action='appointment.request' then
   perform market.require(e.patient_id=u and e.grant_active and 'care'=any(e.categories));perform market.require(market.scope(sid,e.service),'scope_unavailable');
   perform market.require(market.quote_current(eid,qid),'quote_unavailable');
   ts:=(p_payload->>'starts_at')::timestamptz;perform market.require(ts>clock_timestamp() and exists(select 1 from pg_timezone_names where name=p_payload->>'timezone'),'invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then
    insert into market.appointments(enquiry_id,estimate_id,starts_at,timezone) values(eid,qid,ts,p_payload->>'timezone') returning id,to_jsonb(market.appointments.*) into oid,d;perform market.remember(u,p_action,p_payload,'appointment',oid);
   end if;
  elsif p_action in('appointment.propose','appointment.accept','appointment.confirm','appointment.cancel','appointment.attend') then
   if p_action='appointment.accept' then perform market.require(e.patient_id=u and e.grant_active and 'care'=any(e.categories));
   elsif p_action='appointment.cancel' then perform market.require(e.patient_id=u or market.case_staff(u,eid,'care'));
   else perform market.require(market.case_staff(u,eid,'care'));end if;
   perform market.require(ap.version=ver,'stale_version');
   if p_action='appointment.propose' then
    perform market.require(ap.state in('requested','proposed'),'invalid_state');ts:=(p_payload->>'starts_at')::timestamptz;
    perform market.require(ts>clock_timestamp() and exists(select 1 from pg_timezone_names where name=p_payload->>'timezone'),'invalid_request');
    perform market.require(market.quote_current(eid,ap.estimate_id),'quote_unavailable');
    update market.appointments set starts_at=ts,timezone=p_payload->>'timezone',state='proposed',patient_accepted=false,version=version+1 where id=oid;
   elsif p_action='appointment.accept' then
    perform market.require(ap.state='proposed' and not ap.patient_accepted and ap.starts_at>clock_timestamp(),'invalid_state');perform market.require(market.quote_current(eid,ap.estimate_id),'quote_unavailable');
    update market.appointments set patient_accepted=true,version=version+1 where id=oid;
   elsif p_action='appointment.confirm' then
    perform market.require(ap.state in('requested','proposed') and ap.patient_accepted and ap.starts_at>clock_timestamp(),'invalid_state');
    perform market.require(market.scope(sid,e.service),'scope_unavailable');perform market.require(e.grant_active and 'care'=any(e.categories));perform market.require(market.quote_current(eid,ap.estimate_id),'quote_unavailable');
    perform market.require(not exists(select 1 from market.appointments x join market.enquiries ce on ce.id=x.enquiry_id where ce.site_id=sid and x.id<>oid and x.state in('confirmed','attended') and x.starts_at<ap.starts_at+interval '60 minutes' and x.starts_at+interval '60 minutes'>ap.starts_at),'slot_conflict');
    update market.appointments set state='confirmed',version=version+1 where id=oid;
   elsif p_action='appointment.attend' then
    perform market.require(ap.state='confirmed' and ap.starts_at<=clock_timestamp(),'invalid_state');update market.appointments set state='attended',version=version+1 where id=oid;
   else perform market.require(ap.state in('requested','proposed','confirmed'),'invalid_state');update market.appointments set state='cancelled',version=version+1 where id=oid;end if;
   d:=market.current_entity('appointment',oid);
  elsif p_action='handoff.create' then
   perform market.require(market.case_staff(u,eid,'care') and market.case_staff(u,eid,'contact'));perform market.require(exists(select 1 from market.appointments where enquiry_id=eid and state='attended'),'invalid_state');
   ts:=(p_payload->>'followup_at')::timestamptz;perform market.require(market.fictional(p_payload->>'body') and market.fictional(p_payload->>'contact') and ts>clock_timestamp(),'invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then
    insert into market.handoffs(enquiry_id,author_id,body,contact,followup_at) values(eid,u,p_payload->>'body',p_payload->>'contact',ts) returning id,to_jsonb(market.handoffs.*) into oid,d;perform market.remember(u,p_action,p_payload,'handoff',oid);
   end if;
  elsif p_action='handoff.ack' then
   perform market.require(e.patient_id=u);perform market.require(h.version=ver,'stale_version');perform market.require(h.state='pending','invalid_state');update market.handoffs set state='acknowledged',version=version+1 where id=oid returning to_jsonb(market.handoffs.*) into d;
  elsif p_action='support.create' then
   perform market.require(p_payload->>'category' in('administrative','financial','clinical') and market.fictional(p_payload->>'body'),'invalid_request');
   perform market.require(e.patient_id=u or market.case_staff(u,eid,case when p_payload->>'category'='clinical' then 'care' else 'contact' end));
   d:=market.replay(u,p_action,p_payload);if d is null then
    insert into market.support(enquiry_id,author_id,category,body) values(eid,u,p_payload->>'category',p_payload->>'body') returning id,to_jsonb(market.support.*) into oid,d;perform market.remember(u,p_action,p_payload,'support',oid);
   end if;
  elsif p_action='support.close' then
   perform market.require(market.case_staff(u,eid,case when su.category='clinical' then 'care' else 'contact' end) and (su.category<>'clinical' or exists(select 1 from market.clinical_reviewers where site_id=sid and user_id=u and active)));
   perform market.require(su.version=ver,'stale_version');perform market.require(su.state='open','invalid_state');perform market.require(market.fictional(p_payload->>'resolution'),'invalid_request');
   update market.support set state='closed',resolution=p_payload->>'resolution',closed_by=u,version=version+1 where id=oid returning to_jsonb(market.support.*) into d;
  elsif p_action='clinical.assign' then
   perform market.require(market.privileged(u,'platform_admin') and target<>u);
   perform market.require(jsonb_typeof(p_payload->'active')='boolean' and exists(select 1 from m1.memberships where user_id=target and site_id=sid and role in('practice_admin','practice_staff') and active and 'write'=any(permissions)),'invalid_request');
   insert into market.clinical_reviewers(site_id,user_id,active) values(sid,target,(p_payload->>'active')::boolean) on conflict(site_id,user_id) do update set active=excluded.active returning to_jsonb(market.clinical_reviewers.*) into d;
  elsif p_action='review.create' then
   perform market.require(e.patient_id=u);perform market.require(exists(select 1 from market.appointments where enquiry_id=eid and state='attended'),'invalid_state');
   perform market.require((p_payload->>'rating')::integer between 1 and 5 and market.fictional(p_payload->>'body') and jsonb_typeof(p_payload->'conflict_declared')='boolean','invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then perform market.require(not exists(select 1 from market.reviews where enquiry_id=eid),'invalid_state');
    insert into market.reviews(enquiry_id,patient_id,rating,body,conflict_declared) values(eid,u,(p_payload->>'rating')::integer,p_payload->>'body',(p_payload->>'conflict_declared')::boolean) returning id,to_jsonb(market.reviews.*) into oid,d;perform market.remember(u,p_action,p_payload,'review',oid);
   end if;
  elsif p_action='review.list' then
   perform market.require(market.privileged(u,'verification_reviewer'));select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at),'[]') into d from market.reviews x join market.enquiries ce on ce.id=x.enquiry_id where not market.affiliated(u,ce.site_id);
  elsif p_action='review.moderate' then
   perform market.require(market.privileged(u,'verification_reviewer') and not market.affiliated(u,sid) and rv.patient_id<>u);perform market.require(rv.version=ver,'stale_version');perform market.require(rv.state in('pending','appealed'),'invalid_state');
   perform market.require(p_payload->>'decision' in('published','rejected') and market.fictional(p_payload->>'reason'),'invalid_request');
   update market.reviews set state=p_payload->>'decision',reason=p_payload->>'reason',moderated_by=u,version=version+1 where id=oid returning to_jsonb(market.reviews.*) into d;
  elsif p_action='review.appeal' then
   perform market.require(e.patient_id=u);perform market.require(rv.version=ver,'stale_version');perform market.require(rv.state='rejected','invalid_state');perform market.require(market.fictional(p_payload->>'body'),'invalid_request');
   update market.reviews set state='appealed',appeal=p_payload->>'body',version=version+1 where id=oid returning to_jsonb(market.reviews.*) into d;
  elsif p_action='invoice.create' then
   perform market.require(market.privileged(u,'platform_admin'));
   perform market.require(org is not null and p_payload->>'period'~'^20[0-9]{2}-(0[1-9]|1[0-2])$' and (p_payload->>'amount_cents')::integer in(0,9900) and p_payload->>'currency'='USD','invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then perform market.require(not exists(select 1 from market.invoices where site_id=sid and period=p_payload->>'period'),'invalid_state');
    insert into market.invoices(site_id,period,amount_cents,currency) values(sid,p_payload->>'period',(p_payload->>'amount_cents')::integer,p_payload->>'currency') returning id,to_jsonb(market.invoices.*) into oid,d;perform market.remember(u,p_action,p_payload,'invoice',oid);
   end if;
  elsif p_action='invoice.list' then
   perform market.require(market.privileged(u,'platform_admin') or exists(select 1 from m1.sites where market.staff(u,id,false,true)));
   select coalesce(jsonb_agg(to_jsonb(x) order by x.period),'[]') into d from market.invoices x where market.privileged(u,'platform_admin') or market.staff(u,x.site_id,false,true);
  elsif p_action='deletion.request' then
   perform market.require(market.fictional(p_payload->>'reason'),'invalid_request');
   d:=market.replay(u,p_action,p_payload);if d is null then insert into market.deletion_requests(patient_id,reason) values(u,p_payload->>'reason') returning id,to_jsonb(market.deletion_requests.*) into oid,d;perform market.remember(u,p_action,p_payload,'deletion',oid);end if;
  elsif p_action='deletion.review' then
   perform market.require(market.privileged(u,'platform_admin') and dr.patient_id<>u);perform market.require(dr.version=ver,'stale_version');perform market.require(p_payload->>'decision' in('held','reviewed') and market.fictional(p_payload->>'reason'),'invalid_request');
   update market.deletion_requests set state=p_payload->>'decision',review_reason=p_payload->>'reason',reviewed_by=u,version=version+1 where id=oid returning to_jsonb(market.deletion_requests.*)-'reason' into d;
  elsif p_action='governance.list' then
   select coalesce(jsonb_agg(case when x.patient_id=u then to_jsonb(x) else to_jsonb(x)-'reason' end order by x.created_at),'[]') into d from market.deletion_requests x where x.patient_id=u or market.privileged(u,'platform_admin');
  elsif p_action='export.create' then
   select jsonb_build_object('generated_at',clock_timestamp(),'profile',jsonb_build_object('user_id',u,'display_name',display_name),'enquiries',coalesce((select jsonb_agg(market.aggregate(u,x.id)) from market.enquiries x where x.patient_id=u),'[]'),'deletion_requests',coalesce((select jsonb_agg(to_jsonb(x)) from market.deletion_requests x where x.patient_id=u),'[]')) into d from m1.accounts where id=u;
  end if;
  perform m1.audit(u,k,coalesce(oid,eid,sid),org,true);
  return jsonb_build_object('ok',true,'data',d);
 exception
  when sqlstate 'MQ001' then get stacked diagnostics reason=message_text;
   perform m1.audit(u,k,coalesce(oid,eid,sid),org,false);return jsonb_build_object('ok',false,'code',reason);
  when invalid_text_representation or numeric_value_out_of_range or invalid_datetime_format or datetime_field_overflow or invalid_parameter_value or check_violation or not_null_violation then
   perform m1.audit(u,k,coalesce(oid,eid,sid),org,false);return jsonb_build_object('ok',false,'code','invalid_request');
 end;
end$$;

create function public.market_dispatch(p_action text,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select market.dispatch(p_action,p_payload)$$;
create function public.market_scan_result(p_file_id uuid,p_sha256 text,p_state text,p_method text default 'simulated') returns jsonb language plpgsql security definer set search_path='' as $$
declare f market.files%rowtype;sid uuid;begin
 perform 1 from market.runtime_state where id for share;
 if not coalesce((select protected_access_enabled from market.runtime_state where id),false) then return jsonb_build_object('ok',false,'code','recovery_locked');end if;
 if auth.role()<>'service_role' then return jsonb_build_object('ok',false,'code','forbidden');end if;
 select e.site_id into sid from market.files x join market.enquiries e on e.id=x.enquiry_id where x.id=p_file_id;
 perform pg_advisory_xact_lock(hashtextextended(sid::text,0));
 select * into f from market.files where id=p_file_id for update;
 if f.id is null or p_sha256 is distinct from f.sha256 or p_state not in('clean','rejected','error') or p_method is distinct from 'simulated' or not exists(select 1 from storage.objects where bucket_id=f.bucket and name=f.object_path) then return jsonb_build_object('ok',false,'code','invalid_request');end if;
 if f.state<>'quarantine' then return jsonb_build_object('ok',f.state=p_state,'data',to_jsonb(f),'code','invalid_state');end if;
 update market.files set state=p_state,scan_method=p_method where id=p_file_id returning * into f;
 perform m1.audit(null,'file.scan',p_file_id,(select organization_id from m1.sites where id=sid),true);
 return jsonb_build_object('ok',true,'data',to_jsonb(f));end$$;
create function public.market_health() returns jsonb language sql security definer set search_path='' as $$select jsonb_build_object('ready',coalesce((select protected_access_enabled from market.runtime_state where id),false))$$;
revoke all on all functions in schema market from public,anon,authenticated;
grant usage on schema market to anon;
grant execute on function market.dispatch(text,jsonb) to anon,authenticated;
revoke all on function public.market_dispatch(text,jsonb) from public,anon,authenticated;
grant execute on function public.market_dispatch(text,jsonb) to anon,authenticated;
revoke all on function public.market_scan_result(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.market_scan_result(uuid,text,text,text) to service_role;
revoke all on function public.market_health() from public,anon,authenticated;
grant execute on function public.market_health() to service_role;

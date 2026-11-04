-- M1 fictional account/access foundation. No clinical or payment workflow.
create schema if not exists m1;
revoke all on schema m1 from public, anon, authenticated;
create table m1.accounts (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'FICTIONAL account' check(display_name like 'FICTIONAL%'),
 active boolean not null default true, security_version bigint not null default 0,
 valid_after timestamptz not null default 'epoch', factor_reset_pending boolean not null default false, blocked_factor_ids uuid[] not null default '{}'::uuid[]
);
create table m1.organizations (id uuid primary key default gen_random_uuid(), label text not null check(label like 'FICTIONAL%'));
create table m1.sites (id uuid primary key default gen_random_uuid(), organization_id uuid not null references m1.organizations(id), label text not null check(label like 'FICTIONAL%'));
create table m1.memberships (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references m1.accounts(id) on delete cascade,
 role text not null check(role in ('patient','practice_admin','practice_staff','coordinator','verification_reviewer','platform_admin','security_auditor')),
 organization_id uuid references m1.organizations(id), site_id uuid references m1.sites(id), active boolean not null default true,
 permissions text[] not null default array['read']::text[] check(permissions <@ array['read','write']::text[]),
 check ((role in ('practice_admin','practice_staff') and organization_id is not null and site_id is not null) or (role not in ('practice_admin','practice_staff') and site_id is null))
);
create unique index membership_identity on m1.memberships(user_id,role,coalesce(organization_id,'00000000-0000-0000-0000-000000000000'::uuid),coalesce(site_id,'00000000-0000-0000-0000-000000000000'::uuid));
create table m1.sessions (
 id uuid primary key, user_id uuid not null references m1.accounts(id) on delete cascade,
 opened_at timestamptz not null, last_seen_at timestamptz not null default clock_timestamp(), security_version bigint not null,
 revoked boolean not null default false
);
create table m1.fixture_records (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references m1.accounts(id), site_id uuid not null references m1.sites(id),
 category text not null check(category in ('contact','care','verification')),
 body text not null check(body like 'FICTIONAL%' and length(body)<=200), version integer not null default 1
);
create table m1.grants (
 id uuid primary key default gen_random_uuid(), record_id uuid not null references m1.fixture_records(id) on delete cascade,
 recipient_organization uuid references m1.organizations(id), recipient_user uuid references m1.accounts(id), category text not null,
 actions text[] not null default array['read']::text[] check(actions <@ array['read','write']::text[]), active boolean not null default true,
 check ((recipient_organization is not null)::int + (recipient_user is not null)::int = 1)
);
create table m1.assignments (record_id uuid references m1.fixture_records(id) on delete cascade, user_id uuid references m1.accounts(id) on delete cascade, active boolean not null default true, primary key(record_id,user_id));
create table m1.fixture_jobs (id uuid primary key default gen_random_uuid(), user_id uuid not null references m1.accounts(id), record_id uuid not null references m1.fixture_records(id) on delete cascade, state text not null default 'queued' check(state in ('queued','completed','denied')));
create table m1.audit_events (
 id bigint generated always as identity primary key, actor_id uuid, action text not null,
 object_id uuid, organization_id uuid, outcome text not null check(outcome in ('allow','deny')),
 occurred_at timestamptz not null default clock_timestamp(), correlation_id uuid not null default gen_random_uuid()
);
create table m1.rate_buckets (key text primary key, started_at timestamptz not null, attempts integer not null);
-- No direct data-plane access. RLS is defense in depth; audited RPCs are the supported API.
do $$ declare t record; begin for t in select tablename from pg_tables where schemaname='m1' loop
 execute format('alter table m1.%I enable row level security',t.tablename);
 execute format('revoke all on m1.%I from public, anon, authenticated',t.tablename);
end loop; end $$;

create function m1.audit(p_actor uuid,p_action text,p_object uuid,p_org uuid,p_allowed boolean) returns void
language sql set search_path='' as $$
 insert into m1.audit_events(actor_id,action,object_id,organization_id,outcome) values(p_actor,p_action,p_object,p_org,case when p_allowed then 'allow' else 'deny' end);
$$;
create function m1.immutable_audit() returns trigger language plpgsql set search_path='' as $$begin raise exception 'audit_is_append_only'; end$$;
create trigger audit_immutable before update or delete on m1.audit_events for each row execute function m1.immutable_audit();

create function m1.account_created() returns trigger language plpgsql security definer set search_path='' as $$begin
 insert into m1.accounts(id) values(new.id);
 insert into m1.memberships(user_id,role) values(new.id,'patient');
 perform m1.audit(new.id,'account.created',new.id,null,true); return new;
end$$;
create trigger m1_account_created after insert on auth.users for each row execute function m1.account_created();
create function m1.password_changed() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.encrypted_password is distinct from old.encrypted_password then
  update m1.accounts set security_version=security_version+1,valid_after=clock_timestamp() where id=new.id;
  update m1.sessions set revoked=true where user_id=new.id;
  perform m1.audit(new.id,'account.password_changed',new.id,null,true);
 end if; return new;
end$$;
create trigger m1_password_changed after update of encrypted_password on auth.users for each row execute function m1.password_changed();

create function m1.has_role(p_user uuid,p_role text) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from m1.memberships where user_id=p_user and role=p_role and active);
$$;
create function m1.has_mfa(p_user uuid) returns boolean language sql stable set search_path='' as $$
 select coalesce(auth.jwt()->>'aal','')='aal2' and exists(select 1 from auth.mfa_factors where user_id=p_user and status='verified' and factor_type='totp');
$$;
create function m1.allowed_fixture(p_user uuid,p_record uuid,p_action text) returns boolean language sql stable set search_path='' as $$
 select exists(select 1 from m1.fixture_records r join m1.sites s on s.id=r.site_id where r.id=p_record and (
  r.owner_id=p_user or (m1.has_mfa(p_user) and exists(select 1 from m1.accounts where id=p_user and active and not factor_reset_pending) and exists(select 1 from m1.grants g where g.record_id=r.id and g.active and g.category=r.category and p_action=any(g.actions) and (
   (g.recipient_organization=s.organization_id and exists(select 1 from m1.memberships m where m.user_id=p_user and m.active and m.site_id=s.id and m.organization_id=s.organization_id and m.role in ('practice_admin','practice_staff') and p_action=any(m.permissions)))
   or (g.recipient_user=p_user and p_action='read' and exists(select 1 from m1.assignments a where a.record_id=r.id and a.user_id=p_user and a.active) and (
     (m1.has_role(p_user,'coordinator') and r.category in ('contact','care')) or (m1.has_role(p_user,'verification_reviewer') and r.category='verification')
   ))
  )))
 ));
$$;

create function m1.dispatch(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); sid uuid; a m1.accounts%rowtype; sess m1.sessions%rowtype; auth_created timestamptz;
 object_id uuid; org uuid; target uuid; site uuid; desired_role text; r m1.fixture_records%rowtype;
 allowed boolean:=false; data jsonb:='{}'::jsonb; reason text:='forbidden'; perms text[];
begin
 if u is null then return jsonb_build_object('ok',false,'code','unauthenticated'); end if;
 if p_action not in ('recovery.check','session.open','session.me','session.revoke','mfa.complete','access.directory','grant.list','membership.list','fixture.list','fixture.read','fixture.export','fixture.enqueue','fixture.run','fixture.create','fixture.update','grant.set','grant.withdraw','membership.set','assignment.set','account.state','factor.reset','audit.list') then
  perform m1.audit(u,'request.invalid',null,null,false); return jsonb_build_object('ok',false,'code','invalid_request');
 end if;
 select * into a from m1.accounts where id=u;
 if not found or not a.active or not exists(select 1 from auth.users where id=u and email_confirmed_at is not null) then
  perform m1.audit(u,p_action,null,null,false); return jsonb_build_object('ok',false,'code','account_unavailable');
 end if;
 begin sid:=(auth.jwt()->>'session_id')::uuid; exception when invalid_text_representation then sid:=null; end;
 select created_at into auth_created from auth.sessions where id=sid and user_id=u;
 if auth_created is null or auth_created<a.valid_after then
  perform m1.audit(u,p_action,null,null,false); return jsonb_build_object('ok',false,'code','session_expired');
 end if;
 if p_action='recovery.check' then
  allowed:=exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) x where x->>'method'='otp');
  perform m1.audit(u,p_action,u,null,allowed); return jsonb_build_object('ok',allowed,'data','{}'::jsonb,'code','link_invalid');
 end if;
 if p_action='session.open' then
  if not exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) x where x->>'method'='password') then
   perform m1.audit(u,p_action,null,null,false); return jsonb_build_object('ok',false,'code','password_login_required');
  end if;
  insert into m1.sessions(id,user_id,opened_at,security_version) values(sid,u,auth_created,a.security_version) on conflict do nothing;
 end if;
 select * into sess from m1.sessions where id=sid and user_id=u for update;
 if not found or sess.revoked or sess.security_version<>a.security_version or clock_timestamp()>=sess.opened_at+interval '12 hours' or clock_timestamp()>=sess.last_seen_at+interval '30 minutes' then
  perform m1.audit(u,p_action,null,null,false); return jsonb_build_object('ok',false,'code','session_expired');
 end if;
 -- Values are explicit, fixed schema casts; no dynamic SQL or profile metadata.
 begin
  object_id:=nullif(p_payload->>'id','')::uuid; target:=nullif(p_payload->>'user_id','')::uuid;
  site:=nullif(p_payload->>'site_id','')::uuid; org:=nullif(p_payload->>'organization_id','')::uuid;
 exception when invalid_text_representation then
  perform m1.audit(u,'request.invalid',null,null,false); return jsonb_build_object('ok',false,'code','invalid_request');
 end;
 if p_action in ('session.open','session.me') then
  allowed:=true;
  select jsonb_build_object('user_id',u,'display_name',a.display_name,'mfa_verified',m1.has_mfa(u),'factor_reset_pending',a.factor_reset_pending,
   'memberships',coalesce((select jsonb_agg(jsonb_build_object('id',id,'role',role,'organization_id',organization_id,'site_id',site_id,'permissions',permissions)) from m1.memberships where user_id=u and active),'[]'::jsonb),
   'sites',coalesce((select jsonb_agg(jsonb_build_object('id',id,'organization_id',organization_id,'label',label)) from m1.sites),'[]'::jsonb)) into data;
 elsif p_action='session.revoke' then
  allowed:=true; update m1.accounts set security_version=security_version+1,valid_after=clock_timestamp() where id=u;
  update m1.sessions set revoked=true where user_id=u;
 elsif p_action='mfa.complete' then
  allowed:=m1.has_mfa(u) and exists(select 1 from auth.mfa_factors where user_id=u and status='verified' and factor_type='totp' and not(id=any(a.blocked_factor_ids))); if allowed then update m1.accounts set factor_reset_pending=false,blocked_factor_ids='{}'::uuid[] where id=u; end if;
 elsif p_action='access.directory' then
  allowed:=true;
  select coalesce(jsonb_agg(jsonb_build_object('id',ac.id,'label',ac.display_name)),'[]'::jsonb) into data from m1.accounts ac where (ac.active or (m1.has_role(u,'platform_admin') and m1.has_mfa(u) and not a.factor_reset_pending)) and (ac.id=u or (m1.has_role(u,'platform_admin') and m1.has_mfa(u) and not a.factor_reset_pending) or exists(select 1 from m1.memberships m where m.user_id=ac.id and m.active and m.role in ('coordinator','verification_reviewer')) or (m1.has_mfa(u) and exists(select 1 from m1.memberships own join m1.memberships other on other.site_id=own.site_id where own.user_id=u and own.role='practice_admin' and own.active and other.user_id=ac.id and other.active)));
 elsif p_action='grant.list' then
  allowed:=true; select coalesce(jsonb_agg(to_jsonb(g)),'[]'::jsonb) into data from m1.grants g join m1.fixture_records f on f.id=g.record_id where f.owner_id=u and g.active;
 elsif p_action='membership.list' then
  allowed:=m1.has_mfa(u) and not a.factor_reset_pending and (m1.has_role(u,'platform_admin') or m1.has_role(u,'practice_admin'));
  if allowed then select coalesce(jsonb_agg(to_jsonb(m)),'[]'::jsonb) into data from m1.memberships m where m1.has_role(u,'platform_admin') or exists(select 1 from m1.memberships own where own.user_id=u and own.role='practice_admin' and own.site_id=m.site_id and own.active); end if;
 elsif p_action='fixture.list' then
  allowed:=true;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'owner_id',owner_id,'site_id',site_id,'category',category,'body',body,'version',version)),'[]'::jsonb) into data from m1.fixture_records where m1.allowed_fixture(u,id,'read');
 elsif p_action in ('fixture.read','fixture.export','fixture.enqueue','fixture.update') then
  select * into r from m1.fixture_records where id=object_id;
  select organization_id into org from m1.sites where id=r.site_id;
  allowed:=m1.allowed_fixture(u,object_id,case when p_action='fixture.update' then 'write' else 'read' end);
  if allowed and p_action='fixture.update' then
   if p_payload ?| array['owner_id','site_id','category','user_id','organization_id'] or coalesce(p_payload->>'body','') not like 'FICTIONAL%' or length(p_payload->>'body')>200 then allowed:=false; reason:='invalid_request';
   else update m1.fixture_records set body=p_payload->>'body',version=version+1 where id=object_id returning * into r; end if;
  end if;
  if allowed then
   if p_action='fixture.enqueue' then insert into m1.fixture_jobs(user_id,record_id) values(u,r.id) returning id into object_id; data:=jsonb_build_object('id',object_id);
   else data:=to_jsonb(r); end if;
  end if;
 elsif p_action='fixture.run' then
  select f.* into r from m1.fixture_jobs j join m1.fixture_records f on f.id=j.record_id where j.id=object_id and j.user_id=u and j.state='queued';
  allowed:=r.id is not null and m1.allowed_fixture(u,r.id,'read');
  update m1.fixture_jobs set state=case when allowed then 'completed' else 'denied' end where id=object_id and user_id=u and state='queued';
  if allowed then data:=to_jsonb(r); end if;
 elsif p_action='fixture.create' then
  allowed:=m1.has_role(u,'patient') and site is not null and not(p_payload ? 'owner_id') and coalesce(p_payload->>'body','') like 'FICTIONAL%' and length(p_payload->>'body')<=200 and p_payload->>'category' in ('contact','care','verification') and exists(select 1 from m1.sites where id=site);
  if allowed then insert into m1.fixture_records(owner_id,site_id,category,body) values(u,site,p_payload->>'category',p_payload->>'body') returning id into object_id; data:=jsonb_build_object('id',object_id); select organization_id into org from m1.sites where id=site; end if;
 elsif p_action='grant.set' then
  select * into r from m1.fixture_records where id=object_id;
  select array_agg(v) into perms from jsonb_array_elements_text(coalesce(p_payload->'actions','["read"]'::jsonb)) v;
  allowed:=r.owner_id=u and (org is not null)::int+(target is not null)::int=1 and perms<@array['read','write']::text[] and cardinality(perms)>0 and coalesce(p_payload->>'category','')=r.category;
  if allowed and org is not null then allowed:=exists(select 1 from m1.sites where id=r.site_id and organization_id=org); end if;
  if allowed and target is not null then allowed:=exists(select 1 from m1.accounts where id=target and active) and target<>u; end if;
  if allowed then insert into m1.grants(record_id,recipient_organization,recipient_user,category,actions) values(object_id,org,target,r.category,perms) returning id into object_id; data:=jsonb_build_object('id',object_id); end if;
 elsif p_action='grant.withdraw' then
  allowed:=exists(select 1 from m1.grants g join m1.fixture_records f on f.id=g.record_id where g.id=object_id and f.owner_id=u);
  if allowed then update m1.grants set active=false where id=object_id; end if;
 elsif p_action='membership.set' then
  desired_role:=p_payload->>'role';
  select array_agg(v) into perms from jsonb_array_elements_text(coalesce(p_payload->'permissions','["read"]'::jsonb)) v;
  allowed:=target is not null and target<>u and exists(select 1 from m1.accounts where id=target and active) and m1.has_mfa(u) and not a.factor_reset_pending and desired_role in ('practice_admin','practice_staff','coordinator','verification_reviewer','platform_admin','security_auditor') and perms<@array['read','write']::text[];
  allowed:=allowed and (m1.has_role(u,'platform_admin') or (desired_role='practice_staff' and exists(select 1 from m1.memberships where user_id=u and role='practice_admin' and active and organization_id=org and site_id=site)));
  if allowed and desired_role in ('practice_admin','practice_staff') then allowed:=exists(select 1 from m1.sites where id=site and organization_id=org);
  elsif allowed then allowed:=site is null and (org is null or desired_role='security_auditor'); end if;
  if allowed then
   select id into object_id from m1.memberships where user_id=target and role=desired_role and organization_id is not distinct from org and site_id is not distinct from site;
   if object_id is null then insert into m1.memberships(user_id,role,organization_id,site_id,active,permissions) values(target,desired_role,org,site,coalesce((p_payload->>'active')::boolean,true),perms) returning id into object_id;
   else update m1.memberships set active=coalesce((p_payload->>'active')::boolean,true),permissions=perms where id=object_id; end if;
   data:=jsonb_build_object('id',object_id);
  end if;
 elsif p_action='assignment.set' then
  allowed:=m1.has_role(u,'platform_admin') and m1.has_mfa(u) and not a.factor_reset_pending and (m1.has_role(target,'coordinator') or m1.has_role(target,'verification_reviewer')) and exists(select 1 from m1.fixture_records where id=object_id);
  if allowed then insert into m1.assignments(record_id,user_id,active) values(object_id,target,coalesce((p_payload->>'active')::boolean,true)) on conflict(record_id,user_id) do update set active=excluded.active; end if;
 elsif p_action='account.state' then
  allowed:=target<>u and m1.has_role(u,'platform_admin') and m1.has_mfa(u) and not a.factor_reset_pending and exists(select 1 from m1.accounts where id=target);
  if allowed then update m1.accounts set active=coalesce((p_payload->>'active')::boolean,false),security_version=security_version+1,valid_after=clock_timestamp() where id=target; update m1.sessions set revoked=true where user_id=target; object_id:=target; end if;
 elsif p_action='factor.reset' then
  allowed:=target<>u and m1.has_role(u,'platform_admin') and m1.has_mfa(u) and not a.factor_reset_pending and exists(select 1 from m1.accounts where id=target and active);
  if allowed then update m1.accounts set factor_reset_pending=true,blocked_factor_ids=coalesce((select array_agg(id) from auth.mfa_factors where user_id=target),'{}'::uuid[]),security_version=security_version+1,valid_after=clock_timestamp() where id=target; update m1.sessions set revoked=true where user_id=target; object_id:=target; data:=jsonb_build_object('reset_target',target); end if;
 elsif p_action='audit.list' then
  allowed:=m1.has_role(u,'security_auditor') and m1.has_mfa(u) and not a.factor_reset_pending;
  if allowed then select coalesce(jsonb_agg(to_jsonb(e)),'[]'::jsonb) into data from (select * from m1.audit_events e where exists(select 1 from m1.memberships m where m.user_id=u and m.role='security_auditor' and m.active and (m.organization_id is null or m.organization_id=e.organization_id)) order by e.id desc limit 200) e; end if;
 end if;
 allowed:=coalesce(allowed,false);
 perform m1.audit(u,p_action,object_id,org,allowed);
 if allowed then update m1.sessions set last_seen_at=clock_timestamp() where id=sid; return jsonb_build_object('ok',true,'data',data); end if;
 return jsonb_build_object('ok',false,'code',reason);
end$$;

create function m1.auth_attempt(p_account text,p_ip text) returns boolean language plpgsql security definer set search_path='' as $$
declare k text; b m1.rate_buckets%rowtype; limit_n int; accepted boolean:=true;
begin
 if (auth.jwt()->>'role') is distinct from 'service_role' then raise exception 'forbidden'; end if;
 if p_account !~ '^[a-f0-9]{64}$' or p_ip !~ '^[a-f0-9]{64}$' then raise exception 'invalid_request'; end if;
 for k in select x from unnest(array['a:'||p_account,'i:'||p_ip]) x order by x loop
  perform pg_advisory_xact_lock(hashtextextended(k,0));
  select * into b from m1.rate_buckets where key=k;
  if not found or clock_timestamp()>=b.started_at+interval '15 minutes' then
   insert into m1.rate_buckets(key,started_at,attempts) values(k,clock_timestamp(),1) on conflict(key) do update set started_at=excluded.started_at,attempts=1; b.attempts:=1;
  else update m1.rate_buckets set attempts=attempts+1 where key=k returning attempts into b.attempts; end if;
  limit_n:=case when left(k,2)='a:' then 5 else 20 end; accepted:=accepted and b.attempts<=limit_n;
 end loop;
 perform m1.audit(null,'auth.attempt',null,null,accepted); return accepted;
end$$;
create function m1.auth_event(p_action text,p_actor uuid,p_allowed boolean) returns void language plpgsql security definer set search_path='' as $$begin
 if (auth.jwt()->>'role') is distinct from 'service_role' or p_action not in ('auth.signup','auth.signin','auth.recovery','auth.verify','auth.password','auth.mfa','auth.signout','request.rejected') then raise exception 'forbidden'; end if;
 perform m1.audit(p_actor,p_action,null,null,p_allowed);
end$$;
create function public.m1_dispatch(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select m1.dispatch(p_action,p_payload)$$;
create function public.m1_auth_attempt(p_account text,p_ip text) returns boolean language sql security invoker set search_path='' as $$select m1.auth_attempt(p_account,p_ip)$$;
create function public.m1_auth_event(p_action text,p_actor uuid,p_allowed boolean) returns void language sql security invoker set search_path='' as $$select m1.auth_event(p_action,p_actor,p_allowed)$$;
revoke all on all functions in schema m1 from public,anon,authenticated;
revoke all on function public.m1_dispatch(text,jsonb),public.m1_auth_attempt(text,text),public.m1_auth_event(text,uuid,boolean) from public,anon,authenticated;
grant usage on schema m1 to authenticated,service_role;
grant execute on function m1.dispatch(text,jsonb),public.m1_dispatch(text,jsonb) to authenticated;
grant execute on function m1.auth_attempt(text,text),m1.auth_event(text,uuid,boolean),public.m1_auth_attempt(text,text),public.m1_auth_event(text,uuid,boolean) to service_role;

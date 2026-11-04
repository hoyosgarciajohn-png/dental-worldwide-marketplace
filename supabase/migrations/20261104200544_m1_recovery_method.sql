-- PKCE recovery JWTs use the dedicated recovery authentication method.
-- Keep all current-account/session revocation checks and existing function grants.
-- Official reference: https://supabase.com/docs/guides/auth/jwt-fields
create or replace function m1.dispatch(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb
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
  allowed:=exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) x where x->>'method'='recovery');
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

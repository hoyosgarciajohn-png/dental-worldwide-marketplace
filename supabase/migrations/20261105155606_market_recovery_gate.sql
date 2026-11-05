-- Bounded recovery protection. No client can open the gate or alter the journal.
-- Journal and singleton must remain OUTSIDE a restored backup; take an independent
-- durable copy before production recovery. This local migration does not provide PITR.
create table market.recovery_journal (
 seq bigint generated always as identity primary key,
 table_name text not null check(table_name in ('m1.accounts','m1.memberships','m1.grants','m1.assignments','m1.sessions','market.profiles','market.enquiries','market.coordinators','market.clinical_reviewers')),
 row_key jsonb not null, security_state jsonb, deleted boolean not null,
 recorded_at timestamptz not null default clock_timestamp()
);
alter table market.recovery_journal enable row level security;
revoke all on market.recovery_journal from public,anon,authenticated,service_role;
create trigger recovery_journal_immutable before update or delete on market.recovery_journal for each row execute function m1.immutable_audit();
create trigger recovery_journal_no_truncate before truncate on market.recovery_journal for each statement execute function m1.immutable_audit();
create table market.recovery_checkpoint (
 id boolean primary key default true check(id), snapshot_seq bigint not null default 0,
 target_seq bigint not null default 0,replayed_seq bigint not null default 0,expected_entries bigint not null default 0,expected_digest text,auth_security_digest text,
 started_at timestamptz, reconciled_at timestamptz
);
insert into market.recovery_checkpoint(id) values(true);
alter table market.recovery_checkpoint enable row level security;
revoke all on market.recovery_checkpoint from public,anon,authenticated,service_role;
create function market.capture_recovery_state() returns trigger language plpgsql security definer set search_path='' as $$
declare r jsonb; oldr jsonb; keys jsonb; state jsonb; oldstate jsonb; columns text[];
begin
 if not coalesce((select recovery_recording from market.runtime_state where id),false) then return coalesce(new,old); end if;
 r:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 oldr:=case when tg_op='UPDATE' then to_jsonb(old) else '{}'::jsonb end;
 if tg_table_name='assignments' then keys:=jsonb_build_object('record_id',r->'record_id','user_id',r->'user_id');
 elsif tg_table_name='clinical_reviewers' then keys:=jsonb_build_object('site_id',r->'site_id','user_id',r->'user_id');
 elsif tg_table_name='coordinators' then keys:=jsonb_build_object('enquiry_id',r->'enquiry_id','user_id',r->'user_id');
 elsif tg_table_name='profiles' then keys:=jsonb_build_object('site_id',r->'site_id');
 else keys:=jsonb_build_object('id',r->'id'); end if;
 columns:=case tg_table_name
 when 'accounts' then array['active','security_version','valid_after','factor_reset_pending','blocked_factor_ids']
 when 'memberships' then array['active','permissions','role','site_id','organization_id']
 when 'grants' then array['active','actions','category','recipient_organization','recipient_user']
 when 'assignments' then array['active']
 when 'sessions' then array['revoked','security_version']
 when 'profiles' then array['name','summary_en','summary_es','practitioner','languages','services','evidence','status','submitted_by','reviewed_by','check_summary','checked_at','expires_at','version','updated_at']
 when 'clinical_reviewers' then array['active']
 when 'enquiries' then array['grant_active','categories','continuity','consent_version','version']
 when 'coordinators' then array['assigned','granted','categories','version'] end;
 select jsonb_object_agg(k,v) into state from jsonb_each(r) x(k,v) where k=any(columns);
 select jsonb_object_agg(k,v) into oldstate from jsonb_each(oldr) x(k,v) where k=any(columns);
 if tg_op<>'UPDATE' or state is distinct from oldstate then
  insert into market.recovery_journal(table_name,row_key,security_state,deleted) values(tg_table_schema||'.'||tg_table_name,keys,state,tg_op='DELETE');
 end if;return coalesce(new,old);
end$$;
do $$declare t text;begin foreach t in array array['m1.accounts','m1.memberships','m1.grants','m1.assignments','m1.sessions','market.profiles','market.enquiries','market.coordinators','market.clinical_reviewers'] loop
 execute format('create trigger recovery_capture after insert or update or delete on %s for each row execute function market.capture_recovery_state()',t);
end loop;end$$;
-- Wrapper closes M1 as well as the marketplace during a stale security restore.
alter function m1.dispatch(text,jsonb) rename to dispatch_before_market_recovery;
create function m1.dispatch(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$begin
 perform 1 from market.runtime_state where id for share;
 if not coalesce((select protected_access_enabled from market.runtime_state where id),false) then return jsonb_build_object('ok',false,'code','recovery_locked');end if;
 return m1.dispatch_before_market_recovery(p_action,p_payload);
end$$;
revoke all on function m1.dispatch_before_market_recovery(text,jsonb) from public,anon,authenticated,service_role;
revoke all on function m1.dispatch(text,jsonb) from public,anon,authenticated,service_role;
grant execute on function m1.dispatch(text,jsonb) to authenticated;
-- Auth APIs bypass the application BFF. Quiesce their security writes too.
-- Shared locks drain in-flight writes before recovery_begin obtains its exclusive
-- lock. Only the privileged restore's explicit session_replication_role=replica
-- bypasses these ordinary triggers; service-role Auth API calls remain blocked.
create function market.auth_recovery_write_guard() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform 1 from market.runtime_state where id for share;
 if not coalesce((select protected_access_enabled from market.runtime_state where id),false) then raise exception 'auth_recovery_locked';end if;
 if tg_level='STATEMENT' then return null;end if;return coalesce(new,old);
end$$;
do $$declare t record;begin
 for t in select tablename from pg_tables where schemaname='auth' and tablename not in('schema_migrations','audit_log_entries') order by tablename loop
  execute format('create trigger auth_recovery_write_gate before insert or update or delete on auth.%I for each row execute function market.auth_recovery_write_guard()',t.tablename);
  execute format('create trigger auth_recovery_truncate_gate before truncate on auth.%I for each statement execute function market.auth_recovery_write_guard()',t.tablename);
 end loop;
end$$;
-- Current Auth security state must be retained independently at gate closure.
-- A stale Auth backup cannot reopen access merely by replaying application grants.
create function market.auth_security_digest() returns text language plpgsql security definer set search_path='' as $$
declare t record;part text;combined text:='';begin
 for t in select tablename from pg_tables where schemaname='auth' and tablename not in('schema_migrations','audit_log_entries') order by tablename loop
  execute format('select encode(sha256(convert_to(coalesce(string_agg(to_jsonb(x)::text,'''' order by to_jsonb(x)::text),''''),''UTF8'')),''hex'') from auth.%I x',t.tablename) into part;
  combined:=combined||t.tablename||':'||part||';';
 end loop;return encode(sha256(convert_to(combined,'UTF8')),'hex');
end$$;
create function market.recovery_begin(p_snapshot_seq bigint) returns void language plpgsql security definer set search_path='' as $$declare latest bigint;begin
 perform 1 from market.runtime_state where id for update;
 if not found then raise exception 'recovery_state_missing';end if;
 select coalesce(max(seq),0) into latest from market.recovery_journal;
 if p_snapshot_seq<0 or p_snapshot_seq>latest then raise exception 'invalid_recovery_watermark';end if;
 update market.runtime_state set protected_access_enabled=false,recovery_recording=false where id;
 update market.recovery_checkpoint set snapshot_seq=p_snapshot_seq,target_seq=latest,replayed_seq=p_snapshot_seq,expected_entries=(select count(*) from market.recovery_journal where seq>p_snapshot_seq and seq<=latest),expected_digest=(select md5(coalesce(string_agg(to_jsonb(j)::text,'' order by seq),'')) from market.recovery_journal j where seq>p_snapshot_seq and seq<=latest),auth_security_digest=market.auth_security_digest(),started_at=clock_timestamp(),reconciled_at=null where id;
end$$;
create function market.apply_security_state(p_table text,p_key jsonb,p_state jsonb,p_deleted boolean) returns void language plpgsql security definer set search_path='' as $$
declare cols text;changes integer;
begin
 if p_table<>all(array['m1.accounts','m1.memberships','m1.grants','m1.assignments','m1.sessions','market.profiles','market.enquiries','market.coordinators','market.clinical_reviewers']) then raise exception 'unknown_security_table';end if;
 if p_deleted then execute format('delete from %s t where to_jsonb(t) @> $1',p_table) using p_key;return;end if;
 select string_agg(format('%I',k),',') into cols from jsonb_object_keys(p_state) x(k);
 if cols is null then raise exception 'missing_security_state';end if;
 execute format('update %s t set (%s)=(select %s from jsonb_populate_record(null::%s,$1)) where to_jsonb(t) @> $2',p_table,cols,cols,p_table) using p_state,p_key;
 get diagnostics changes=row_count;if changes<>1 then raise exception 'recovery_row_missing';end if;
end$$;
create function market.recovery_reconcile() returns bigint language plpgsql security definer set search_path='' as $$
declare cp market.recovery_checkpoint%rowtype;j market.recovery_journal%rowtype;n bigint:=0;begin
 perform 1 from market.runtime_state where id and not protected_access_enabled and not recovery_recording for update;
 if not found then raise exception 'recovery_not_locked';end if;
 select * into strict cp from market.recovery_checkpoint where id for update;
 if cp.started_at is null then raise exception 'recovery_not_started';end if;
 if cp.auth_security_digest is distinct from market.auth_security_digest() then raise exception 'auth_recovery_not_reconciled';end if;
 if cp.expected_entries<>(select count(*) from market.recovery_journal where seq>cp.snapshot_seq and seq<=cp.target_seq) or cp.expected_digest is distinct from (select md5(coalesce(string_agg(to_jsonb(j)::text,'' order by seq),'')) from market.recovery_journal j where seq>cp.snapshot_seq and seq<=cp.target_seq) then raise exception 'recovery_history_incomplete';end if;
 for j in select * from market.recovery_journal where seq>cp.snapshot_seq and seq<=cp.target_seq order by seq loop
  perform market.apply_security_state(j.table_name,j.row_key,j.security_state,j.deleted);n:=n+1;
 end loop;
 update market.recovery_checkpoint set replayed_seq=target_seq,reconciled_at=clock_timestamp() where id;
 -- Explicit second action opens the gate; a failed/partial replay never does.
 return n;
end$$;
create function market.recovery_open() returns void language plpgsql security definer set search_path='' as $$declare cp market.recovery_checkpoint%rowtype;latest bigint;begin
 perform 1 from market.runtime_state where id and not protected_access_enabled and not recovery_recording for update;
 if not found then raise exception 'recovery_not_locked';end if;
 select * into strict cp from market.recovery_checkpoint where id for update;
 select coalesce(max(seq),0) into latest from market.recovery_journal;
 if cp.auth_security_digest is distinct from market.auth_security_digest() then raise exception 'auth_recovery_not_reconciled';end if;
 if cp.reconciled_at is null or cp.replayed_seq<>cp.target_seq or latest<>cp.target_seq or cp.expected_entries<>(select count(*) from market.recovery_journal where seq>cp.snapshot_seq and seq<=cp.target_seq) or cp.expected_digest is distinct from (select md5(coalesce(string_agg(to_jsonb(j)::text,'' order by seq),'')) from market.recovery_journal j where seq>cp.snapshot_seq and seq<=cp.target_seq) then raise exception 'recovery_not_reconciled';end if;
 update market.runtime_state set protected_access_enabled=true,recovery_recording=true where id;
end$$;
revoke all on function market.auth_recovery_write_guard(),market.auth_security_digest(),market.capture_recovery_state(),market.recovery_begin(bigint),market.apply_security_state(text,jsonb,jsonb,boolean),market.recovery_reconcile(),market.recovery_open() from public,anon,authenticated,service_role;

-- SonrisaConnect marketplace schema (Postgres / Supabase)
-- Run this entire file in Supabase → SQL Editor (as project owner).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS patterns where possible.

create extension if not exists "pgcrypto";

-- ---------- profiles (1:1 with auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient','clinic','admin')),
  full_name text,
  email text,
  phone text,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  locale text default 'en',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- clinics ----------
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  city text not null,
  address text,
  website text,
  license text,
  whatsapp text,
  languages text,
  description text,
  services jsonb not null default '{}'::jsonb,   -- {cleaning:45, implants:900, ...}
  prices jsonb not null default '{}'::jsonb,    -- alias/mirror of services for clarity
  photos text[] not null default '{}',          -- storage paths
  plan text not null default 'free' check (plan in ('free','basic','growth','premium')),
  plan_status text not null default 'active' check (plan_status in ('active','trialing','past_due','canceled','incomplete')),
  trial_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  verified boolean not null default false,
  listing_status text not null default 'draft' check (listing_status in ('draft','pending_review','published','rejected')),
  featured boolean not null default false,
  quotes_this_month int not null default 0,
  quotes_month_key text,                        -- 'YYYY-MM' for quota reset
  managed_bookings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clinics_owner_idx on public.clinics(owner_id);
create index if not exists clinics_verified_idx on public.clinics(verified);
create index if not exists clinics_city_idx on public.clinics(city);

-- ---------- quote_requests ----------
create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  treatment text,
  message text,
  status text not null default 'open' check (status in ('open','replied','accepted','completed','canceled')),
  reply text,
  estimated_usd numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists quote_requests_patient_idx on public.quote_requests(patient_id);
create index if not exists quote_requests_clinic_idx on public.quote_requests(clinic_id);

-- ---------- messages ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quote_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_recipient_idx on public.messages(recipient_id);

-- ---------- reviews (patients with a completed quote only) ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null references public.profiles(id) on delete cascade,
  quote_id uuid not null references public.quote_requests(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (quote_id)
);

-- ---------- saved_clinics ----------
create table if not exists public.saved_clinics (
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, clinic_id)
);

-- ---------- patient_records metadata (files in storage bucket patient-records) ----------
create table if not exists public.patient_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  clinic_id uuid references public.clinics(id) on delete set null,
  quote_id uuid references public.quote_requests(id) on delete set null,
  storage_path text not null,
  file_name text,
  created_at timestamptz not null default now()
);

-- ---------- helpers ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin or role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.owns_clinic(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.clinics where id = cid and owner_id = auth.uid());
$$;

create or replace function public.plan_limits(p text)
returns table(max_photos int, max_quotes int, allow_featured boolean, allow_whatsapp boolean, allow_analytics boolean)
language sql immutable set search_path = public as $$
  select t.max_photos, t.max_quotes, t.allow_featured, t.allow_whatsapp, t.allow_analytics
  from (values
    ('free'::text,    3, 5,    false, false, false),
    ('basic',   6, 50,   false, false, false),
    ('growth', 20, 200,  false, true,  true),
    ('premium',40, 9999, true,  true,  true)
  ) as t(plan, max_photos, max_quotes, allow_featured, allow_whatsapp, allow_analytics)
  where t.plan = p;
$$;

-- Auto-create profile on signup (role from raw_user_meta_data.role)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'patient');
begin
  if r not in ('patient','clinic','admin') then r := 'patient'; end if;
  -- never allow self-signup as admin
  if r = 'admin' then r := 'patient'; end if;
  insert into public.profiles (id, role, full_name, email, locale)
  values (
    new.id,
    r,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'locale', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep quotes_this_month in sync + enforce Free/Basic caps
create or replace function public.enforce_quote_quota()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c record;
  lim int;
  mk text := to_char(now() at time zone 'utc', 'YYYY-MM');
begin
  select * into c from public.clinics where id = new.clinic_id for update;
  if not found then raise exception 'Clinic not found'; end if;
  select max_quotes into lim from public.plan_limits(c.plan);
  if c.quotes_month_key is distinct from mk then
    update public.clinics set quotes_this_month = 0, quotes_month_key = mk where id = c.id;
    c.quotes_this_month := 0;
  end if;
  if c.quotes_this_month >= lim then
    raise exception 'Quote request monthly limit reached for this clinic plan (%). Upgrade required.', c.plan;
  end if;
  update public.clinics set quotes_this_month = quotes_this_month + 1, quotes_month_key = mk, updated_at = now()
  where id = c.id;
  return new;
end;
$$;

drop trigger if exists trg_quote_quota on public.quote_requests;
create trigger trg_quote_quota
  before insert on public.quote_requests
  for each row execute function public.enforce_quote_quota();

-- Enforce photo count + featured/whatsapp by plan on clinic update
create or replace function public.enforce_clinic_plan_limits()
returns trigger language plpgsql set search_path = public as $$
declare
  lim record;
begin
  select * into lim from public.plan_limits(new.plan);
  if coalesce(array_length(new.photos, 1), 0) > lim.max_photos then
    raise exception 'Photo limit for plan % is %', new.plan, lim.max_photos;
  end if;
  if new.featured and not lim.allow_featured then
    new.featured := false;
  end if;
  -- only patients with completed request may insert reviews (checked in RLS + this helper)
  return new;
end;
$$;

drop trigger if exists trg_clinic_limits on public.clinics;
create trigger trg_clinic_limits
  before insert or update on public.clinics
  for each row execute function public.enforce_clinic_plan_limits();

create or replace function public.can_review(qid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.quote_requests
    where id = qid and patient_id = auth.uid() and status = 'completed'
  );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists trg_clinics_updated on public.clinics;
create trigger trg_clinics_updated before update on public.clinics
  for each row execute function public.set_updated_at();
drop trigger if exists trg_quotes_updated on public.quote_requests;
create trigger trg_quotes_updated before update on public.quote_requests
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.quote_requests enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.saved_clinics enable row level security;
alter table public.patient_records enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid() or public.is_admin()
  or exists (select 1 from public.clinics c where c.owner_id = profiles.id and c.verified = true)
);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert with check (id = auth.uid());

-- clinics: public can read verified; owners manage theirs; admin all
drop policy if exists clinics_public_read on public.clinics;
create policy clinics_public_read on public.clinics for select using (
  verified = true or owner_id = auth.uid() or public.is_admin()
);
drop policy if exists clinics_owner_insert on public.clinics;
create policy clinics_owner_insert on public.clinics for insert with check (
  owner_id = auth.uid() and public.current_role() = 'clinic'
);
drop policy if exists clinics_owner_update on public.clinics;
create policy clinics_owner_update on public.clinics for update using (
  owner_id = auth.uid() or public.is_admin()
);
drop policy if exists clinics_admin_delete on public.clinics;
create policy clinics_admin_delete on public.clinics for delete using (public.is_admin());

-- quote_requests
drop policy if exists quotes_select on public.quote_requests;
create policy quotes_select on public.quote_requests for select using (
  patient_id = auth.uid() or public.owns_clinic(clinic_id) or public.is_admin()
);
drop policy if exists quotes_patient_insert on public.quote_requests;
create policy quotes_patient_insert on public.quote_requests for insert with check (
  patient_id = auth.uid() and public.current_role() = 'patient'
);
drop policy if exists quotes_update on public.quote_requests;
create policy quotes_update on public.quote_requests for update using (
  patient_id = auth.uid() or public.owns_clinic(clinic_id) or public.is_admin()
);

-- messages
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select using (
  sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin()
);
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert with check (sender_id = auth.uid());
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update using (
  recipient_id = auth.uid() or sender_id = auth.uid() or public.is_admin()
);

-- reviews
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (true);
drop policy if exists reviews_patient_insert on public.reviews;
create policy reviews_patient_insert on public.reviews for insert with check (
  patient_id = auth.uid() and public.can_review(quote_id)
);
drop policy if exists reviews_patient_update on public.reviews;
create policy reviews_patient_update on public.reviews for update using (patient_id = auth.uid() or public.is_admin());

-- saved_clinics
drop policy if exists saved_select on public.saved_clinics;
create policy saved_select on public.saved_clinics for select using (patient_id = auth.uid() or public.is_admin());
drop policy if exists saved_insert on public.saved_clinics;
create policy saved_insert on public.saved_clinics for insert with check (patient_id = auth.uid());
drop policy if exists saved_delete on public.saved_clinics;
create policy saved_delete on public.saved_clinics for delete using (patient_id = auth.uid());

-- patient_records
drop policy if exists records_select on public.patient_records;
create policy records_select on public.patient_records for select using (
  patient_id = auth.uid()
  or (clinic_id is not null and public.owns_clinic(clinic_id))
  or public.is_admin()
);
drop policy if exists records_insert on public.patient_records;
create policy records_insert on public.patient_records for insert with check (patient_id = auth.uid());
drop policy if exists records_delete on public.patient_records;
create policy records_delete on public.patient_records for delete using (patient_id = auth.uid() or public.is_admin());

-- ---------- Storage buckets (private) ----------
insert into storage.buckets (id, name, public)
values ('clinic-photos', 'clinic-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('patient-records', 'patient-records', false)
on conflict (id) do nothing;

-- clinic-photos: owners upload under {clinic_id}/... ; public read via signed URLs or verified clinic owners
drop policy if exists clinic_photos_read on storage.objects;
create policy clinic_photos_read on storage.objects for select using (
  bucket_id = 'clinic-photos' and (
    public.is_admin()
    or exists (
      select 1 from public.clinics c
      where c.id::text = (storage.foldername(name))[1]
        and (c.verified = true or c.owner_id = auth.uid())
    )
  )
);
drop policy if exists clinic_photos_write on storage.objects;
create policy clinic_photos_write on storage.objects for insert with check (
  bucket_id = 'clinic-photos' and (
    public.is_admin()
    or exists (
      select 1 from public.clinics c
      where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid()
    )
  )
);
drop policy if exists clinic_photos_update on storage.objects;
create policy clinic_photos_update on storage.objects for update using (
  bucket_id = 'clinic-photos' and (
    public.is_admin()
    or exists (
      select 1 from public.clinics c
      where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid()
    )
  )
);
drop policy if exists clinic_photos_delete on storage.objects;
create policy clinic_photos_delete on storage.objects for delete using (
  bucket_id = 'clinic-photos' and (
    public.is_admin()
    or exists (
      select 1 from public.clinics c
      where c.id::text = (storage.foldername(name))[1] and c.owner_id = auth.uid()
    )
  )
);

-- patient-records: path {patient_id}/...
drop policy if exists patient_records_read on storage.objects;
create policy patient_records_read on storage.objects for select using (
  bucket_id = 'patient-records' and (
    public.is_admin()
    or (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.patient_records pr
      join public.clinics c on c.id = pr.clinic_id
      where pr.storage_path = name and c.owner_id = auth.uid()
    )
  )
);
drop policy if exists patient_records_write on storage.objects;
create policy patient_records_write on storage.objects for insert with check (
  bucket_id = 'patient-records' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists patient_records_delete on storage.objects;
create policy patient_records_delete on storage.objects for delete using (
  bucket_id = 'patient-records' and (
    public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text
  )
);



-- ---------- Verification flags (safe to re-run) ----------
alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.clinics add column if not exists listing_status text;
update public.clinics set listing_status = case when verified then 'published' else 'draft' end where listing_status is null;
alter table public.clinics alter column listing_status set default 'draft';
-- constrain listing_status if not already
do $$ begin
  alter table public.clinics add constraint clinics_listing_status_check
    check (listing_status in ('draft','pending_review','published','rejected'));
exception when duplicate_object then null;
end $$;

-- Block clients from self-setting verification flags (except via sync RPC below)
create or replace function public.protect_verification_flags()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_setting('app.syncing_verification', true) = '1' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.email_verified := old.email_verified;
    new.phone_verified := old.phone_verified;
  elsif tg_op = 'INSERT' then
    new.email_verified := false;
    new.phone_verified := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_verification on public.profiles;
create trigger trg_protect_verification
  before insert or update on public.profiles
  for each row execute function public.protect_verification_flags();

-- Trusted path: copy flags from auth.users (email_confirmed_at / phone_confirmed_at)
create or replace function public.sync_my_verification_flags()
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  conf_email timestamptz;
  conf_phone timestamptz;
  auth_email text;
  auth_phone text;
  p public.profiles;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  select email_confirmed_at, phone_confirmed_at, email, phone
    into conf_email, conf_phone, auth_email, auth_phone
  from auth.users where id = uid;
  perform set_config('app.syncing_verification', '1', true);
  update public.profiles set
    email = coalesce(auth_email, email),
    phone = coalesce(auth_phone, phone),
    email_verified = (conf_email is not null),
    phone_verified = (conf_phone is not null),
    updated_at = now()
  where id = uid
  returning * into p;
  return p;
end;
$$;

revoke all on function public.sync_my_verification_flags() from public;
grant execute on function public.sync_my_verification_flags() to authenticated;

create or replace function public.email_is_verified(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select email_verified from public.profiles where id = uid),
    false
  ) or exists (
    select 1 from auth.users where id = uid and email_confirmed_at is not null
  );
$$;

create or replace function public.phone_is_verified(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select phone_verified from public.profiles where id = uid),
    false
  ) or exists (
    select 1 from auth.users where id = uid and phone_confirmed_at is not null
  );
$$;

-- Clinics may only move to pending_review / stay published if owner email+phone verified
create or replace function public.enforce_clinic_submission_verification()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ev boolean;
  pv boolean;
begin
  if new.listing_status in ('pending_review','published') or new.verified = true then
    select email_verified, phone_verified into ev, pv from public.profiles where id = new.owner_id;
    -- also trust auth.users directly
    if not coalesce(ev, false) then
      select (email_confirmed_at is not null) into ev from auth.users where id = new.owner_id;
    end if;
    if not coalesce(pv, false) then
      select (phone_confirmed_at is not null) into pv from auth.users where id = new.owner_id;
    end if;
    if not coalesce(ev, false) or not coalesce(pv, false) then
      raise exception 'Clinic listing requires verified email and phone before approval or publish';
    end if;
  end if;
  -- Admin publish path: verified true implies published
  if new.verified = true and new.listing_status is distinct from 'published' then
    new.listing_status := 'published';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_clinic_submission on public.clinics;
create trigger trg_clinic_submission
  before insert or update on public.clinics
  for each row execute function public.enforce_clinic_submission_verification();

-- Quotes: patient must have verified email
drop policy if exists quotes_patient_insert on public.quote_requests;
create policy quotes_patient_insert on public.quote_requests for insert with check (
  patient_id = auth.uid()
  and public.current_role() = 'patient'
  and public.email_is_verified(auth.uid())
);

-- Public directory: only published+verified clinics
drop policy if exists clinics_public_read on public.clinics;
create policy clinics_public_read on public.clinics for select using (
  (verified = true and listing_status = 'published')
  or owner_id = auth.uid()
  or public.is_admin()
);

-- Service role (edge functions) bypasses RLS automatically.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;


-- ========== Applied post-init security/performance fixes (also in migrations) ==========
-- plan_limits: select explicit columns (not select *) — fixed above
-- All trigger/helper functions: set search_path = public
-- SECURITY DEFINER trigger funcs: revoke EXECUTE from public/anon/authenticated
-- RLS helpers: grant EXECUTE selectively (is_admin to anon+authenticated; others authenticated)
-- FK indexes on messages, patient_records, reviews, saved_clinics
-- RLS policies use (select auth.uid()) for initplan performance

-- Also grant: grant execute on function public.owns_clinic(uuid) to anon;
-- (required so anon SELECT RLS on quote_requests/patient_records can evaluate)

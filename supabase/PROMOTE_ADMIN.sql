-- SonrisaConnect — promote an existing signed-up user to admin
-- Do NOT create users here. Sign up on https://sonrisaconnect.com first,
-- then run ONE of the statements below in Supabase → SQL Editor (as project owner).

-- Option A: by email (recommended)
update public.profiles
set role = 'admin',
    is_admin = true,
    updated_at = now()
where email = 'YOUR_EMAIL@example.com';

-- Option B: by auth user id (UUID from Authentication → Users)
-- update public.profiles
-- set role = 'admin',
--     is_admin = true,
--     updated_at = now()
-- where id = '00000000-0000-0000-0000-000000000000';

-- Verify
-- select id, email, role, is_admin from public.profiles where is_admin = true;

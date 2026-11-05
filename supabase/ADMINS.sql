-- SonrisaConnect — principal owner + admin management RPCs
-- Applied via migration add_principal_owner_and_admin_rpcs
-- Owner: hoyosgarciajohn@gmail.com (0d664381-ad51-4bbf-bafa-79061b422a6f)

-- 1) Principal-owner flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_owner IS 'Principal owner who alone may grant/revoke admin via set_admin()';

-- Ensure only the designated principal is owner (idempotent)
UPDATE public.profiles SET is_owner = false WHERE is_owner = true;
UPDATE public.profiles
SET is_owner = true,
    is_admin = true,
    role = 'admin',
    updated_at = now()
WHERE id = '0d664381-ad51-4bbf-bafa-79061b422a6f';

-- 2) Helper: is current user the principal owner?
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT coalesce((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
$$;

REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, anon, service_role;

-- 3) Trigger: block non-owners from changing role / is_admin / is_owner
CREATE OR REPLACE FUNCTION public.protect_profile_privs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.is_owner IS DISTINCT FROM OLD.is_owner THEN
    -- service role / migrations typically have auth.uid() IS NULL
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    IF NOT public.is_owner() THEN
      RAISE EXCEPTION 'Only the principal owner can change role, is_admin, or is_owner'
        USING ERRCODE = '42501';
    END IF;
    -- Never allow transferring or clearing is_owner via client (owner flag is migration-only)
    IF NEW.is_owner IS DISTINCT FROM OLD.is_owner THEN
      RAISE EXCEPTION 'is_owner cannot be changed via API; contact support'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privs ON public.profiles;
CREATE TRIGGER trg_protect_profile_privs
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privs();

-- 4) Tighten UPDATE RLS: users may update own row; admins may update others;
--    privileged columns are enforced by the trigger above.
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE
  USING ((id = (SELECT auth.uid())) OR public.is_admin())
  WITH CHECK ((id = (SELECT auth.uid())) OR public.is_admin());

-- Also prevent INSERT of elevated privileges by self-signup
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT
  WITH CHECK (
    id = (SELECT auth.uid())
    AND coalesce(is_admin, false) = false
    AND coalesce(is_owner, false) = false
    AND coalesce(role, 'patient') IN ('patient', 'clinic')
  );

-- 5) set_admin(target_email, make_admin) — owner only
CREATE OR REPLACE FUNCTION public.set_admin(target_email text, make_admin boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tid uuid;
  temail text;
  tname text;
  town boolean;
  confirmed boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only the principal owner can manage administrators'
      USING ERRCODE = '42501';
  END IF;

  IF target_email IS NULL OR length(trim(target_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT p.id, p.email, p.full_name, coalesce(p.is_owner, false),
         (u.email_confirmed_at IS NOT NULL)
    INTO tid, temail, tname, town, confirmed
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE lower(p.email) = lower(trim(target_email))
  LIMIT 1;

  IF tid IS NULL THEN
    RAISE EXCEPTION 'User not found. They must sign up first with that email.';
  END IF;

  IF NOT confirmed THEN
    RAISE EXCEPTION 'Target must confirm their email before becoming an admin.';
  END IF;

  IF town OR tid = '0d664381-ad51-4bbf-bafa-79061b422a6f'::uuid THEN
    RAISE EXCEPTION 'Cannot change privileges of the principal owner';
  END IF;

  IF make_admin THEN
    UPDATE public.profiles
    SET is_admin = true,
        role = 'admin',
        updated_at = now()
    WHERE id = tid;
  ELSE
    UPDATE public.profiles
    SET is_admin = false,
        role = CASE WHEN role = 'admin' THEN 'patient' ELSE role END,
        updated_at = now()
    WHERE id = tid;
  END IF;

  RETURN jsonb_build_object(
    'id', tid,
    'email', temail,
    'full_name', tname,
    'is_admin', make_admin
  );
END;
$$;

REVOKE ALL ON FUNCTION public.set_admin(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_admin(text, boolean) TO authenticated;

-- 6) list_admins() — owner only
CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  is_admin boolean,
  is_owner boolean,
  email_confirmed boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_owner() THEN
    RAISE EXCEPTION 'Only the principal owner can list administrators'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.id, p.email, p.full_name, p.role, p.is_admin, p.is_owner,
         (u.email_confirmed_at IS NOT NULL) AS email_confirmed
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.is_admin = true OR p.is_owner = true OR p.role = 'admin'
  ORDER BY p.is_owner DESC, p.email ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;

-- Hardening (migration revoke_anon_on_admin_rpcs)
REVOKE ALL ON FUNCTION public.set_admin(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_admin(text, boolean) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, anon, service_role;
REVOKE ALL ON FUNCTION public.protect_profile_privs() FROM PUBLIC, anon, authenticated;

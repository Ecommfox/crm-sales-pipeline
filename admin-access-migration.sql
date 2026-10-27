-- Repair profile and invitation access, and add role-level settings access.
-- Run this migration in the Supabase SQL Editor as a project administrator.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.user_profiles', policy_name);
  END LOOP;
END;
$$;

CREATE POLICY "Users can read their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage user profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can create a basic own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'viewer');

CREATE OR REPLACE FUNCTION public.create_profile_for_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'viewer',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS crm_handle_new_auth_user ON auth.users;
CREATE TRIGGER crm_handle_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_auth_user();

REVOKE ALL ON FUNCTION public.create_profile_for_new_auth_user() FROM PUBLIC;

INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
SELECT
  users.id,
  users.email,
  COALESCE(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1)),
  'viewer',
  true
FROM auth.users AS users
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_invitations'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.pending_invitations', policy_name);
  END LOOP;
END;
$$;

CREATE POLICY "Admins can manage pending invitations"
  ON public.pending_invitations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.get_pending_invitation_by_token(p_token text)
RETURNS SETOF public.pending_invitations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT invitation.*
  FROM public.pending_invitations AS invitation
  WHERE invitation.token = p_token
    AND invitation.status = 'pending'
    AND invitation.expires_at > now();
$$;

REVOKE ALL ON FUNCTION public.get_pending_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_invitation_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_pending_invitation(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_user_email text;
  invited_role text;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to accept an invitation';
  END IF;

  SELECT email
  INTO current_user_email
  FROM auth.users
  WHERE id = current_user_id;

  SELECT role
  INTO invited_role
  FROM public.pending_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
    AND lower(email) = lower(current_user_email)
  FOR UPDATE;

  IF invited_role IS NULL THEN
    RAISE EXCEPTION 'Invitation is invalid, expired, or belongs to another email';
  END IF;

  UPDATE public.user_profiles
  SET role = invited_role
  WHERE id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile was not created';
  END IF;

  UPDATE public.pending_invitations
  SET status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  WHERE token = p_token;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pending_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pending_invitation(text) TO authenticated;

CREATE TABLE IF NOT EXISTS public.role_settings_permissions (
  role text PRIMARY KEY CHECK (role IN ('admin', 'manager', 'teleoperator', 'viewer')),
  can_view_settings boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.role_settings_permissions (role, can_view_settings)
VALUES
  ('admin', true),
  ('manager', false),
  ('teleoperator', false),
  ('viewer', false)
ON CONFLICT (role) DO NOTHING;

ALTER TABLE public.role_settings_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read role settings permissions"
  ON public.role_settings_permissions;
DROP POLICY IF EXISTS "Admins can manage role settings permissions"
  ON public.role_settings_permissions;

CREATE POLICY "Authenticated users can read role settings permissions"
  ON public.role_settings_permissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role settings permissions"
  ON public.role_settings_permissions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_call_logs_user_id_created_at
  ON public.call_logs(user_id, created_at);

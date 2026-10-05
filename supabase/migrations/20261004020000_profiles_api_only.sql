-- Apply to isolated staging and verify before any production promotion.
-- Preserve existing accounts; future profiles start with incomplete onboarding.
BEGIN;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS weight_kg numeric(6,2),
  ADD COLUMN IF NOT EXISTS height_cm numeric(5,2),
  ADD COLUMN IF NOT EXISTS fitness_level text,
  ADD COLUMN IF NOT EXISTS fitness_goal text,
  ADD COLUMN IF NOT EXISTS training_frequency text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS gym_preference text,
  ADD COLUMN IF NOT EXISTS has_health_condition boolean,
  ADD COLUMN IF NOT EXISTS health_conditions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_preference text,
  ADD COLUMN IF NOT EXISTS health_data_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS health_data_notice_version text;
ALTER TABLE public.profiles ALTER COLUMN onboarding_completed SET DEFAULT false;

-- The API accepts only editable caller-owned fields. No direct client writes.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
DO $$
DECLARE col record; pol record;
BEGIN
  FOR col IN SELECT attname FROM pg_attribute
    WHERE attrelid='public.profiles'::regclass AND attnum>0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE ALL (%I) ON public.profiles FROM PUBLIC, anon, authenticated', col.attname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid()=id);

-- Untrusted signup metadata can never assign a privileged role or gym.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  INSERT INTO public.profiles (id,email,phone,full_name,avatar_url,role,status)
  VALUES (NEW.id, COALESCE(NEW.email, NEW.id::text || '@phone.auraapex.invalid'), NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name',NEW.raw_user_meta_data->>'name','New Member'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url',''),
    'customer'::public.user_role,'active'::public.account_status)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Views obey the caller's underlying table access instead of owner privileges.
ALTER VIEW public.vw_daily_revenue SET (security_invoker=true);
ALTER VIEW public.vw_daily_attendance SET (security_invoker=true);
COMMIT;

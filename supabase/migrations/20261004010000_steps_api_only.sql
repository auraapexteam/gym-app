-- Forward repair for deployments that omitted the steps-logbook migration.
-- Personal progress is read and written through the authenticated backend API.
-- Safe to run against the existing fresh staging schema; preserves saved rows.
BEGIN;

CREATE TABLE IF NOT EXISTS public.steps_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    steps         INTEGER NOT NULL CHECK (steps >= 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_steps_log UNIQUE (profile_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_steps_logs_profile ON public.steps_logs(profile_id, log_date);
ALTER TABLE public.steps_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "steps_logs_read" ON public.steps_logs;
DROP POLICY IF EXISTS "steps_logs_write" ON public.steps_logs;
REVOKE ALL ON TABLE public.steps_logs FROM PUBLIC, anon, authenticated;
DO $$
DECLARE col record; pol record;
BEGIN
  FOR col IN SELECT attname FROM pg_attribute
    WHERE attrelid='public.steps_logs'::regclass AND attnum>0 AND NOT attisdropped
  LOOP
    EXECUTE format('REVOKE ALL (%I) ON public.steps_logs FROM PUBLIC, anon, authenticated', col.attname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='steps_logs'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.steps_logs', pol.policyname);
  END LOOP;
END $$;
GRANT ALL ON TABLE public.steps_logs TO service_role;

COMMIT;

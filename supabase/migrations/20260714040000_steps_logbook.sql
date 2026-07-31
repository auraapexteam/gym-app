-- ============================================================================
--  STEPS LOGBOOK TABLE & POLICIES
-- ============================================================================

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

CREATE POLICY "steps_logs_read" ON public.steps_logs
    FOR SELECT TO authenticated
    USING (
        auth.uid() = profile_id
        OR profile_id IN (SELECT id FROM public.profiles WHERE gym_id = public.current_gym_id())
        OR public.is_super_admin()
    );

CREATE POLICY "steps_logs_write" ON public.steps_logs
    FOR ALL TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

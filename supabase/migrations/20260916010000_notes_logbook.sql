-- ============================================================================
--  NOTES LOGBOOK TABLE & POLICIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notes_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note          TEXT NOT NULL,
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_notes_log UNIQUE (profile_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_notes_logs_profile ON public.notes_logs(profile_id, log_date);

ALTER TABLE public.notes_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_logs_read" ON public.notes_logs
    FOR SELECT TO authenticated
    USING (
        auth.uid() = profile_id
        OR profile_id IN (SELECT id FROM public.profiles WHERE gym_id = public.current_gym_id())
        OR public.is_super_admin()
    );

CREATE POLICY "notes_logs_write" ON public.notes_logs
    FOR ALL TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

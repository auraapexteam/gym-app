-- ============================================================================
--  CUSTOMER GYM LINKING REQUESTS SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gym_join_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id        UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_gym_join_request UNIQUE (gym_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.gym_join_requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gym_join_requests_gym ON public.gym_join_requests(gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_join_requests_profile ON public.gym_join_requests(profile_id);

-- RLS Policies
DROP POLICY IF EXISTS "requests_read" ON public.gym_join_requests;
CREATE POLICY "requests_read" ON public.gym_join_requests
    FOR SELECT TO authenticated 
    USING (
        auth.uid() = profile_id 
        OR gym_id = public.current_gym_id() 
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "requests_insert" ON public.gym_join_requests;
CREATE POLICY "requests_insert" ON public.gym_join_requests
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "requests_delete" ON public.gym_join_requests;
CREATE POLICY "requests_delete" ON public.gym_join_requests
    FOR DELETE TO authenticated 
    USING (
        auth.uid() = profile_id 
        OR gym_id = public.current_gym_id() 
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "requests_update" ON public.gym_join_requests;
CREATE POLICY "requests_update" ON public.gym_join_requests
    FOR UPDATE TO authenticated 
    USING (
        gym_id = public.current_gym_id() 
        OR public.is_super_admin()
    )
    WITH CHECK (
        gym_id = public.current_gym_id() 
        OR public.is_super_admin()
    );

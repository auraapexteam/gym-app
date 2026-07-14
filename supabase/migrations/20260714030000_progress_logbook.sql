-- ============================================================================
--  PROGRESS LOGBOOK TABLES & POLICIES
-- ============================================================================

-- 1. Progress Logs (Weight)
CREATE TABLE IF NOT EXISTS public.progress_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight        NUMERIC(5,2) NOT NULL CHECK (weight > 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_progress_log UNIQUE (profile_id, log_date)
);

-- 2. Progress Images (Photos)
CREATE TABLE IF NOT EXISTS public.progress_images (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_progress_image UNIQUE (profile_id, log_date)
);

-- 3. Water Intake Logs (ml)
CREATE TABLE IF NOT EXISTS public.water_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_ml     INTEGER NOT NULL CHECK (amount_ml >= 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_water_log UNIQUE (profile_id, log_date)
);

-- 4. Protein Intake Logs (grams)
CREATE TABLE IF NOT EXISTS public.protein_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_g      INTEGER NOT NULL CHECK (amount_g >= 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_protein_log UNIQUE (profile_id, log_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_progress_logs_profile ON public.progress_logs(profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_progress_images_profile ON public.progress_images(profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_water_logs_profile ON public.water_logs(profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_protein_logs_profile ON public.protein_logs(profile_id, log_date);

-- Enable RLS
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protein_logs ENABLE ROW LEVEL SECURITY;

-- 1. Policies for Weight Logs
CREATE POLICY "progress_logs_read" ON public.progress_logs
    FOR SELECT TO authenticated
    USING (
        auth.uid() = profile_id
        OR profile_id IN (SELECT id FROM public.profiles WHERE gym_id = public.current_gym_id())
        OR public.is_super_admin()
    );

CREATE POLICY "progress_logs_write" ON public.progress_logs
    FOR ALL TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- 2. Policies for Progress Images
CREATE POLICY "progress_images_read" ON public.progress_images
    FOR SELECT TO authenticated
    USING (
        auth.uid() = profile_id
        OR profile_id IN (SELECT id FROM public.profiles WHERE gym_id = public.current_gym_id())
        OR public.is_super_admin()
    );

CREATE POLICY "progress_images_write" ON public.progress_images
    FOR ALL TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- 3. Policies for Water Logs
CREATE POLICY "water_logs_read" ON public.water_logs
    FOR SELECT TO authenticated
    USING (
        auth.uid() = profile_id
        OR profile_id IN (SELECT id FROM public.profiles WHERE gym_id = public.current_gym_id())
        OR public.is_super_admin()
    );

CREATE POLICY "water_logs_write" ON public.water_logs
    FOR ALL TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- 4. Policies for Protein Logs
CREATE POLICY "protein_logs_read" ON public.protein_logs
    FOR SELECT TO authenticated
    USING (
        auth.uid() = profile_id
        OR profile_id IN (SELECT id FROM public.profiles WHERE gym_id = public.current_gym_id())
        OR public.is_super_admin()
    );

CREATE POLICY "protein_logs_write" ON public.protein_logs
    FOR ALL TO authenticated
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

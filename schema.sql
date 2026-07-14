-- ============================================================================
--  Aura Apex — Multi-Tenant SaaS Gym Management Platform
--  Complete PostgreSQL Schema (Supabase)
-- ----------------------------------------------------------------------------
--  This is the single source of truth for the relational schema. It is
--  idempotent and safe to run on a fresh Supabase project.
--
--  Conventions (see docs/backend/database.md):
--    * UUID primary keys everywhere.
--    * Every tenant-owned table carries `gym_id`.
--    * snake_case tables & columns; idx_/uq_/fk_ naming.
--    * `created_at` / `updated_at` on every table; `deleted_at` where soft
--      delete applies. Payments & attendance are immutable (never deleted).
--    * Business logic lives in the service layer — the database enforces
--      integrity (constraints, FKs, transactions) only.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
--  1. ENUM TYPES
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'owner', 'staff', 'trainer', 'super_admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gym_status') THEN
        CREATE TYPE public.gym_status AS ENUM ('active', 'suspended', 'pending');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE public.member_status AS ENUM ('active', 'inactive', 'suspended');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE public.subscription_status AS ENUM ('pending', 'active', 'expired', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('created', 'pending', 'success', 'failed', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE public.payment_method AS ENUM ('card', 'upi', 'netbanking', 'wallet', 'cash', 'other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_method') THEN
        CREATE TYPE public.attendance_method AS ENUM ('qr', 'manual');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM ('success', 'failed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'qr_status') THEN
        CREATE TYPE public.qr_status AS ENUM ('active', 'revoked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status') THEN
        CREATE TYPE public.equipment_status AS ENUM ('operational', 'maintenance', 'retired');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_condition') THEN
        CREATE TYPE public.equipment_condition AS ENUM ('excellent', 'good', 'fair', 'poor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trainer_status') THEN
        CREATE TYPE public.trainer_status AS ENUM ('active', 'inactive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM ('info', 'payment', 'membership', 'attendance', 'system', 'promotion');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gallery_entity_type') THEN
        CREATE TYPE public.gallery_entity_type AS ENUM ('gym', 'trainer', 'equipment', 'profile', 'general');
    END IF;
END $$;

-- ============================================================================
--  2. SHARED TRIGGER FUNCTION — auto-maintain updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
--  3. TENANT & IDENTITY TABLES
-- ============================================================================

-- Gyms are the tenant boundary. Everything else belongs to exactly one gym.
CREATE TABLE IF NOT EXISTS public.gyms (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    slug         TEXT UNIQUE,
    email        TEXT,
    phone        TEXT,
    address      TEXT,
    description  TEXT,
    logo_url     TEXT,
    status       public.gym_status NOT NULL DEFAULT 'pending',
    -- { "monday": { "open": "06:00", "close": "22:00" }, ... }
    timings      JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- ["sunday"]
    weekly_off   JSONB NOT NULL DEFAULT '[]'::jsonb,
    settings     JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner_id     UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Profiles mirror Supabase auth users and hold business identity data.
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT,
    full_name   TEXT,
    avatar_url  TEXT,
    role        public.user_role NOT NULL DEFAULT 'customer',
    gym_id      UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
    status      public.account_status NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Resolve the circular gym <-> profile relationship now that both exist.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_gyms_owner'
    ) THEN
        ALTER TABLE public.gyms
            ADD CONSTRAINT fk_gyms_owner
            FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Staff & trainer assignments with per-user granular permission grants.
CREATE TABLE IF NOT EXISTS public.gym_staff (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id       UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    profile_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role         public.user_role NOT NULL DEFAULT 'staff',
    permissions  JSONB NOT NULL DEFAULT '[]'::jsonb,
    status       public.account_status NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_gym_staff_member UNIQUE (gym_id, profile_id)
);

-- ============================================================================
--  4. MEMBERSHIP DOMAIN — members, plans, subscriptions, payments
-- ============================================================================

-- Gym customers (business entity). Optionally linked to an app profile.
CREATE TABLE IF NOT EXISTS public.members (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id             UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    profile_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name          TEXT NOT NULL,
    email              TEXT,
    phone              TEXT,
    gender             TEXT CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth      DATE,
    address            TEXT,
    emergency_contact  TEXT,
    status             public.member_status NOT NULL DEFAULT 'active',
    joined_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    notes              TEXT,
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Membership plans offered by a gym.
CREATE TABLE IF NOT EXISTS public.plans (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id            UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    description       TEXT,
    price             NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    duration_days     INTEGER NOT NULL CHECK (duration_days > 0),
    features          JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    razorpay_plan_id  TEXT UNIQUE,
    deleted_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Active membership lifecycle (owns purchase -> active -> expiry/cancel).
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id                    UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id                 UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    plan_id                   UUID NOT NULL REFERENCES public.plans(id),
    status                    public.subscription_status NOT NULL DEFAULT 'pending',
    start_date                TIMESTAMPTZ,
    end_date                  TIMESTAMPTZ,
    auto_renew                BOOLEAN NOT NULL DEFAULT false,
    razorpay_subscription_id  TEXT UNIQUE,
    cancelled_at              TIMESTAMPTZ,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Immutable financial records. Never edited or deleted; corrections are refunds.
CREATE TABLE IF NOT EXISTS public.payments (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id               UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    subscription_id      UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    member_id            UUID REFERENCES public.members(id) ON DELETE SET NULL,
    amount               NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency             TEXT NOT NULL DEFAULT 'INR',
    status               public.payment_status NOT NULL DEFAULT 'created',
    method               public.payment_method,
    razorpay_order_id    TEXT UNIQUE,
    razorpay_payment_id  TEXT UNIQUE,
    razorpay_signature   TEXT,
    notes                JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at              TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================================
--  5. OPERATIONS DOMAIN — qr, attendance, trainers, equipment, gallery
-- ============================================================================

-- Gym QR codes. Only one active code per gym (enforced by partial unique index).
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id        UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    token         TEXT NOT NULL UNIQUE,
    status        public.qr_status NOT NULL DEFAULT 'active',
    label         TEXT,
    created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rotated_from  UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Attendance check-ins. One check-in per member per day (duplicate prevention).
CREATE TABLE IF NOT EXISTS public.attendances (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id           UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    member_id        UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    qr_code_id       UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
    checked_in_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    checked_out_at   TIMESTAMPTZ,
    attendance_date  DATE NOT NULL DEFAULT (timezone('utc', now()))::date,
    method           public.attendance_method NOT NULL DEFAULT 'qr',
    status           public.attendance_status NOT NULL DEFAULT 'success',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_attendance_member_day UNIQUE (gym_id, member_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS public.trainers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id          UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    profile_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    full_name       TEXT NOT NULL,
    specialization  TEXT,
    bio             TEXT,
    phone           TEXT,
    email           TEXT,
    image_url       TEXT,
    status          public.trainer_status NOT NULL DEFAULT 'active',
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.equipment (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id            UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    category          TEXT,
    description       TEXT,
    quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    condition         public.equipment_condition NOT NULL DEFAULT 'good',
    status            public.equipment_status NOT NULL DEFAULT 'operational',
    image_url         TEXT,
    purchased_at      DATE,
    last_serviced_at  DATE,
    next_service_at   DATE,
    deleted_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Image metadata only. Binary content lives in Supabase Storage.
CREATE TABLE IF NOT EXISTS public.gallery_images (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id        UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    bucket        TEXT NOT NULL,
    path          TEXT NOT NULL,
    url           TEXT,
    mime_type     TEXT,
    size_bytes    BIGINT,
    entity_type   public.gallery_entity_type NOT NULL DEFAULT 'general',
    entity_id     UUID,
    caption       TEXT,
    uploaded_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_gallery_object UNIQUE (bucket, path)
);

-- ============================================================================
--  6. PLATFORM DOMAIN — notifications, audit logs, settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id        UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
    recipient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title         TEXT NOT NULL,
    body          TEXT,
    type          public.notification_type NOT NULL DEFAULT 'info',
    data          JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read       BOOLEAN NOT NULL DEFAULT false,
    read_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Immutable audit trail for privileged operations.
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role     TEXT,
    gym_id         UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
    action         TEXT NOT NULL,
    resource_type  TEXT NOT NULL,
    resource_id    UUID,
    result         TEXT NOT NULL DEFAULT 'success',
    ip_address     TEXT,
    metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key          TEXT UNIQUE NOT NULL,
    value        JSONB NOT NULL DEFAULT '{}'::jsonb,
    description  TEXT,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.gym_join_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id        UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_gym_join_request UNIQUE (gym_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.progress_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight        NUMERIC(5,2) NOT NULL CHECK (weight > 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_progress_log UNIQUE (profile_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.progress_images (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_progress_image UNIQUE (profile_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.water_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_ml     INTEGER NOT NULL CHECK (amount_ml >= 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_water_log UNIQUE (profile_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.protein_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_g      INTEGER NOT NULL CHECK (amount_g >= 0),
    log_date      DATE NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_protein_log UNIQUE (profile_id, log_date)
);

-- ============================================================================
--  7. INDEXES  (index every frequently-queried / tenant column)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_gym          ON public.profiles (gym_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_gym_staff_gym         ON public.gym_staff (gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_staff_profile     ON public.gym_staff (profile_id);

CREATE INDEX IF NOT EXISTS idx_members_gym           ON public.members (gym_id);
CREATE INDEX IF NOT EXISTS idx_members_profile       ON public.members (profile_id);
CREATE INDEX IF NOT EXISTS idx_members_status        ON public.members (gym_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_members_gym_email
    ON public.members (gym_id, lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_plans_gym             ON public.plans (gym_id);
CREATE INDEX IF NOT EXISTS idx_plans_active          ON public.plans (gym_id, is_active);

CREATE INDEX IF NOT EXISTS idx_subscriptions_gym     ON public.subscriptions (gym_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member  ON public.subscriptions (member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON public.subscriptions (gym_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end     ON public.subscriptions (end_date);

CREATE INDEX IF NOT EXISTS idx_payments_gym          ON public.payments (gym_id);
CREATE INDEX IF NOT EXISTS idx_payments_status       ON public.payments (gym_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_created      ON public.payments (created_at);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON public.payments (subscription_id);

CREATE INDEX IF NOT EXISTS idx_qr_codes_gym          ON public.qr_codes (gym_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_qr_active_per_gym
    ON public.qr_codes (gym_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_attendances_gym       ON public.attendances (gym_id);
CREATE INDEX IF NOT EXISTS idx_attendances_member    ON public.attendances (member_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date      ON public.attendances (gym_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_trainers_gym          ON public.trainers (gym_id);
CREATE INDEX IF NOT EXISTS idx_equipment_gym         ON public.equipment (gym_id);
CREATE INDEX IF NOT EXISTS idx_gallery_gym           ON public.gallery_images (gym_id);
CREATE INDEX IF NOT EXISTS idx_gallery_entity        ON public.gallery_images (gym_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_gym_join_requests_gym   ON public.gym_join_requests (gym_id);
CREATE INDEX IF NOT EXISTS idx_gym_join_requests_profile ON public.gym_join_requests (profile_id);

CREATE INDEX IF NOT EXISTS idx_progress_logs_profile ON public.progress_logs(profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_progress_images_profile ON public.progress_images(profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_water_logs_profile ON public.water_logs(profile_id, log_date);
CREATE INDEX IF NOT EXISTS idx_protein_logs_profile ON public.protein_logs(profile_id, log_date);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications (recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gym          ON public.audit_logs (gym_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor        ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created      ON public.audit_logs (created_at);

-- ============================================================================
--  8. updated_at TRIGGERS
-- ============================================================================
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'gyms', 'profiles', 'gym_staff', 'members', 'plans', 'subscriptions',
        'payments', 'qr_codes', 'trainers', 'equipment', 'gallery_images', 'gym_join_requests',
        'progress_logs', 'water_logs', 'protein_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I;', t, t);
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I
             FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
    END LOOP;
END $$;

-- ============================================================================
--  9. AUTH SYNC TRIGGER — create a profile row when an auth user is created
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Member'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        'customer'::public.user_role,
        'active'::public.account_status
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
--  10. TRANSACTIONAL RPCs  (atomic multi-write business actions)
-- ============================================================================

-- Create a pending subscription + created payment atomically for a checkout.
CREATE OR REPLACE FUNCTION public.create_membership_order(
    p_gym_id            UUID,
    p_member_id         UUID,
    p_plan_id           UUID,
    p_amount            NUMERIC,
    p_currency          TEXT,
    p_razorpay_order_id TEXT
)
RETURNS TABLE (subscription_id UUID, payment_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription_id UUID;
    v_payment_id      UUID;
BEGIN
    INSERT INTO public.subscriptions (gym_id, member_id, plan_id, status)
    VALUES (p_gym_id, p_member_id, p_plan_id, 'pending')
    RETURNING id INTO v_subscription_id;

    INSERT INTO public.payments (gym_id, subscription_id, member_id, amount, currency, status, razorpay_order_id)
    VALUES (p_gym_id, v_subscription_id, p_member_id, p_amount, p_currency, 'created', p_razorpay_order_id)
    RETURNING id INTO v_payment_id;

    RETURN QUERY SELECT v_subscription_id, v_payment_id;
END;
$$;

-- Confirm a paid checkout atomically & idempotently: mark payment success and
-- activate the subscription with computed period. Safe to call from both the
-- verify endpoint and the webhook (replay-safe).
CREATE OR REPLACE FUNCTION public.confirm_membership_payment(
    p_razorpay_order_id   TEXT,
    p_razorpay_payment_id TEXT,
    p_signature           TEXT,
    p_method              public.payment_method,
    p_duration_days       INTEGER
)
RETURNS TABLE (subscription_id UUID, payment_id UUID, already_processed BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
    v_payment       public.payments%ROWTYPE;
    v_start         TIMESTAMPTZ := timezone('utc', now());
    v_end           TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_payment FROM public.payments
        WHERE razorpay_order_id = p_razorpay_order_id
        FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PAYMENT_NOT_FOUND';
    END IF;

    -- Idempotency: already confirmed -> return existing state, do nothing.
    IF v_payment.status = 'success' THEN
        RETURN QUERY SELECT v_payment.subscription_id, v_payment.id, true;
        RETURN;
    END IF;

    v_end := v_start + make_interval(days => p_duration_days);

    UPDATE public.payments
        SET status = 'success',
            method = COALESCE(p_method, method),
            razorpay_payment_id = p_razorpay_payment_id,
            razorpay_signature = p_signature,
            paid_at = v_start
        WHERE id = v_payment.id;

    UPDATE public.subscriptions
        SET status = 'active',
            start_date = v_start,
            end_date = v_end
        WHERE id = v_payment.subscription_id;

    RETURN QUERY SELECT v_payment.subscription_id, v_payment.id, false;
END;
$$;

-- Create an immediately-active membership + a successful manual (cash) payment
-- atomically. Used by owners/staff recording an in-person sale.
CREATE OR REPLACE FUNCTION public.create_manual_membership(
    p_gym_id         UUID,
    p_member_id      UUID,
    p_plan_id        UUID,
    p_amount         NUMERIC,
    p_duration_days  INTEGER,
    p_method         public.payment_method
)
RETURNS TABLE (subscription_id UUID, payment_id UUID)
LANGUAGE plpgsql
AS $$
DECLARE
    v_subscription_id UUID;
    v_payment_id      UUID;
    v_start           TIMESTAMPTZ := timezone('utc', now());
BEGIN
    INSERT INTO public.subscriptions (gym_id, member_id, plan_id, status, start_date, end_date)
    VALUES (
        p_gym_id, p_member_id, p_plan_id, 'active',
        v_start, v_start + make_interval(days => p_duration_days)
    )
    RETURNING id INTO v_subscription_id;

    INSERT INTO public.payments (gym_id, subscription_id, member_id, amount, status, method, paid_at)
    VALUES (p_gym_id, v_subscription_id, p_member_id, p_amount, 'success', p_method, v_start)
    RETURNING id INTO v_payment_id;

    RETURN QUERY SELECT v_subscription_id, v_payment_id;
END;
$$;

-- Atomically rotate a gym's QR: revoke the current active code and issue a new
-- one. Keeps the "one active QR per gym" invariant intact.
CREATE OR REPLACE FUNCTION public.rotate_gym_qr(
    p_gym_id      UUID,
    p_token       TEXT,
    p_created_by  UUID,
    p_label       TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_old UUID;
    v_new UUID;
BEGIN
    SELECT id INTO v_old FROM public.qr_codes
        WHERE gym_id = p_gym_id AND status = 'active'
        LIMIT 1;

    IF v_old IS NOT NULL THEN
        UPDATE public.qr_codes
            SET status = 'revoked', revoked_at = timezone('utc', now())
            WHERE id = v_old;
    END IF;

    INSERT INTO public.qr_codes (gym_id, token, status, label, created_by, rotated_from)
    VALUES (p_gym_id, p_token, 'active', p_label, p_created_by, v_old)
    RETURNING id INTO v_new;

    RETURN v_new;
END;
$$;

-- ============================================================================
--  11. ANALYTICS VIEWS  (read-only reporting; never a source of truth)
-- ============================================================================

-- Daily revenue per gym from successful payments.
CREATE OR REPLACE VIEW public.vw_daily_revenue AS
SELECT
    gym_id,
    date_trunc('day', paid_at)::date AS revenue_date,
    count(*)                         AS payment_count,
    coalesce(sum(amount), 0)         AS total_revenue
FROM public.payments
WHERE status = 'success' AND paid_at IS NOT NULL
GROUP BY gym_id, date_trunc('day', paid_at)::date;

-- Daily attendance counts per gym.
CREATE OR REPLACE VIEW public.vw_daily_attendance AS
SELECT
    gym_id,
    attendance_date,
    count(*) AS check_in_count
FROM public.attendances
WHERE status = 'success'
GROUP BY gym_id, attendance_date;

-- ============================================================================
--  12. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
--  The API server uses the service-role key and bypasses RLS; tenant isolation
--  is enforced in the repository layer. These policies are defense-in-depth for
--  any client that accesses the database directly with an anon/user JWT.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_gym_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT gym_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
    );
$$;

ALTER TABLE public.gyms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_staff       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_images  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protein_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: a user reads/updates their own profile; super admin sees all.
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
CREATE POLICY "profiles_self_read" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_super_admin());
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Gyms & plans: public catalogue is readable; owners manage their own gym.
DROP POLICY IF EXISTS "gyms_read" ON public.gyms;
CREATE POLICY "gyms_read" ON public.gyms
    FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "plans_read" ON public.plans;
CREATE POLICY "plans_read" ON public.plans
    FOR SELECT TO authenticated USING (is_active = true OR gym_id = public.current_gym_id() OR public.is_super_admin());

-- Tenant-scoped read policies for the remaining business tables.
DROP POLICY IF EXISTS "members_tenant_read" ON public.members;
CREATE POLICY "members_tenant_read" ON public.members
    FOR SELECT TO authenticated USING (gym_id = public.current_gym_id() OR public.is_super_admin());
DROP POLICY IF EXISTS "subscriptions_tenant_read" ON public.subscriptions;
CREATE POLICY "subscriptions_tenant_read" ON public.subscriptions
    FOR SELECT TO authenticated USING (gym_id = public.current_gym_id() OR public.is_super_admin());
DROP POLICY IF EXISTS "payments_tenant_read" ON public.payments;
CREATE POLICY "payments_tenant_read" ON public.payments
    FOR SELECT TO authenticated USING (gym_id = public.current_gym_id() OR public.is_super_admin());
DROP POLICY IF EXISTS "attendances_tenant_read" ON public.attendances;
CREATE POLICY "attendances_tenant_read" ON public.attendances
    FOR SELECT TO authenticated USING (gym_id = public.current_gym_id() OR public.is_super_admin());
DROP POLICY IF EXISTS "notifications_self_read" ON public.notifications;
CREATE POLICY "notifications_self_read" ON public.notifications
    FOR SELECT TO authenticated USING (recipient_id = auth.uid());

-- Gym Join Requests: read for self, owner of gym, or super admin.
DROP POLICY IF EXISTS "requests_read" ON public.gym_join_requests;
CREATE POLICY "requests_read" ON public.gym_join_requests
    FOR SELECT TO authenticated USING (auth.uid() = profile_id OR gym_id = public.current_gym_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "requests_insert" ON public.gym_join_requests;
CREATE POLICY "requests_insert" ON public.gym_join_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "requests_delete" ON public.gym_join_requests;
CREATE POLICY "requests_delete" ON public.gym_join_requests
    FOR DELETE TO authenticated USING (auth.uid() = profile_id OR gym_id = public.current_gym_id() OR public.is_super_admin());

DROP POLICY IF EXISTS "requests_update" ON public.gym_join_requests;
CREATE POLICY "requests_update" ON public.gym_join_requests
    FOR UPDATE TO authenticated USING (gym_id = public.current_gym_id() OR public.is_super_admin()) WITH CHECK (gym_id = public.current_gym_id() OR public.is_super_admin());

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

-- ============================================================================
--  13. OPTIONAL DEMO SEED  (safe, no auth users required)
-- ----------------------------------------------------------------------------
--  Seeds one demo gym and a few plans so the frontend team can integrate
--  immediately. Remove in production.
-- ============================================================================
DO $$
DECLARE
    v_gym_id UUID;
BEGIN
    SELECT id INTO v_gym_id FROM public.gyms WHERE slug = 'demo-gym';
    IF v_gym_id IS NULL THEN
        INSERT INTO public.gyms (name, slug, email, phone, address, status, timings, weekly_off)
        VALUES (
            'Aura Apex Demo Gym', 'demo-gym', 'demo@auraapex.test', '+910000000000',
            '123 Fitness Street', 'active',
            '{"monday":{"open":"06:00","close":"22:00"},"tuesday":{"open":"06:00","close":"22:00"}}'::jsonb,
            '["sunday"]'::jsonb
        )
        RETURNING id INTO v_gym_id;

        INSERT INTO public.plans (gym_id, name, description, price, duration_days, features) VALUES
            (v_gym_id, 'Monthly',   'Full access, billed monthly',   1500.00,  30,  '["Gym floor","Locker"]'::jsonb),
            (v_gym_id, 'Quarterly', 'Full access, billed quarterly',  4000.00,  90,  '["Gym floor","Locker","1 PT session"]'::jsonb),
            (v_gym_id, 'Annual',    'Full access, billed yearly',    14000.00, 365,  '["Gym floor","Locker","Group classes"]'::jsonb);
    END IF;
END $$;

-- ============================================================================
--  END OF SCHEMA
-- ============================================================================

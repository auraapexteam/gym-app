-- Create role enum types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('customer', 'owner', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
        CREATE TYPE public.staff_role AS ENUM ('Owner', 'Trainer', 'Staff');
    END IF;
END $$;

-- Create gyms table
CREATE TABLE IF NOT EXISTS public.gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    gym_id UUID REFERENCES public.gyms(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Staff/Gym Members Mapping Table
CREATE TABLE IF NOT EXISTS public.gym_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    role public.staff_role NOT NULL DEFAULT 'Staff'::public.staff_role,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, gym_id)
);

-- Create membership plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration TEXT NOT NULL CHECK (duration IN ('1_month', '3_months', '6_months', '1_year')),
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    razorpay_plan_id TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    razorpay_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    device_id TEXT,
    method TEXT NOT NULL DEFAULT 'QR',
    status TEXT NOT NULL DEFAULT 'success'
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

-- Plans RLS Policies
CREATE POLICY "Allow public read access to plans" ON public.plans
    FOR SELECT TO public USING (true);

-- Profiles RLS Policies
CREATE POLICY "Allow public profiles read access" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Gyms RLS Policies
CREATE POLICY "Allow public gyms read access" ON public.gyms
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow gym owners to manage their gyms" ON public.gyms
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.gym_members
            WHERE public.gym_members.gym_id = public.gyms.id
            AND public.gym_members.user_id = auth.uid()
            AND public.gym_members.role = 'Owner'
        )
    );

-- Gym Members RLS Policies
CREATE POLICY "Allow members to read staff directories" ON public.gym_members
    FOR SELECT TO authenticated USING (true);

-- Subscriptions RLS Policies
CREATE POLICY "Allow users to read their own subscriptions" ON public.subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own subscriptions" ON public.subscriptions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own subscriptions" ON public.subscriptions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Payments RLS Policies
CREATE POLICY "Allow users to read their own payments" ON public.payments
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE public.subscriptions.id = public.payments.subscription_id
            AND public.subscriptions.user_id = auth.uid()
        )
    );

-- Attendances RLS Policies
CREATE POLICY "Allow users to view own attendances" ON public.attendances
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Allow gyms to view/insert check-in logs" ON public.attendances
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.gym_members
            WHERE public.gym_members.gym_id = public.attendances.gym_id
            AND public.gym_members.user_id = auth.uid()
        )
    );

-- Trigger function to automatically insert new auth user into profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New Member'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
        'customer'::public.user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed initial subscription plans (for testing)
-- Note: These require a dummy gym to be associated in a production environment

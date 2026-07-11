-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Plans RLS Policies
CREATE POLICY "Allow public read access to plans" ON public.plans
    FOR SELECT TO public USING (true);

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

-- Seed initial subscription plans
INSERT INTO public.plans (name, description, price, billing_interval)
VALUES 
    ('Basic Plan', 'Access to standard features with monthly billing', 199.00, 'month'),
    ('Standard Plan', 'Access to premium features with monthly billing', 499.00, 'month'),
    ('Premium Plan', 'Access to all features with monthly billing', 999.00, 'month')
ON CONFLICT DO NOTHING;

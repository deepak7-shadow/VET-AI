-- VET-AI: Multi-Agent Livestock Health Intelligence
-- Migration 003: Farmer Profiles, Authentication, and Data Ownership Schema

-- 1. Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    farm_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'farmer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Add user_id ownership columns to animals, reports, alerts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'animals' AND column_name = 'user_id') THEN
        ALTER TABLE public.animals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX idx_animals_user_id ON public.animals(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'user_id') THEN
        ALTER TABLE public.reports ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX idx_reports_user_id ON public.reports(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alerts' AND column_name = 'user_id') THEN
        ALTER TABLE public.alerts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
    END IF;
END $$;

-- 3. Trigger to automatically provision profile when user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, farm_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'farm_name', 'Green Valley Farm'),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'farmer'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        farm_name = EXCLUDED.farm_name,
        phone = EXCLUDED.phone,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Maintain backward-compatible access for demo records (user_id IS NULL)
-- while isolating farmer records (user_id = auth.uid())
DROP POLICY IF EXISTS "Public full access to animals" ON public.animals;
CREATE POLICY "Farmer and demo animals access"
    ON public.animals FOR ALL
    USING (user_id IS NULL OR user_id = auth.uid())
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Public full access to reports" ON public.reports;
CREATE POLICY "Farmer and demo reports access"
    ON public.reports FOR ALL
    USING (user_id IS NULL OR user_id = auth.uid())
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Public full access to alerts" ON public.alerts;
CREATE POLICY "Farmer and demo alerts access"
    ON public.alerts FOR ALL
    USING (user_id IS NULL OR user_id = auth.uid())
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

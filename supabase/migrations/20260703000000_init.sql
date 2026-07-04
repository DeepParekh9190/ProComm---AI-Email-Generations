-- ============================================================
-- Profiles table (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Subscriptions table
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT,
  status TEXT DEFAULT 'inactive',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  monthly_usage INTEGER NOT NULL DEFAULT 0,       -- tracks emails generated this month
  usage_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'), -- when counter resets
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add usage columns if table already existed
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS monthly_usage INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month');

-- ============================================================
-- Pricing Plans table (admin-managed, read by public pricing page)
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  period TEXT NOT NULL,
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]',
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER DEFAULT NULL, -- NULL = unlimited; set a number for monthly email generation cap
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add usage_limit column if table already existed
ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT NULL;

-- Seed default plans (only if table is empty)
INSERT INTO pricing_plans (name, price, period, description, features, is_popular, is_active, sort_order)
SELECT * FROM (VALUES
  (
    'Monthly',
    '$9',
    '/month',
    'Perfect for individuals who need occasional rewrites.',
    '["Unlimited message rewrites","All tone presets + custom tone","Multiple alternative versions","Export & copy features","Cancel anytime"]'::jsonb,
    false,
    true,
    1
  ),
  (
    'Annual',
    '$89',
    '/year',
    'Best value for power users. Save over 17%.',
    '["Everything in Monthly","Priority AI processing","Advanced tone customization","Team collaboration (coming soon)","Priority support"]'::jsonb,
    true,
    true,
    2
  )
) AS v(name, price, period, description, features, is_popular, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM pricing_plans LIMIT 1);

-- ============================================================
-- Atomic increment for usage tracking (prevents race conditions)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_subscription_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_current_usage INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_new_usage INTEGER;
BEGIN
  SELECT monthly_usage, usage_reset_at INTO v_current_usage, v_reset_at
  FROM subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Auto-reset if new month
  IF v_reset_at IS NOT NULL AND v_now >= v_reset_at THEN
    v_new_usage := 1;
    UPDATE subscriptions
    SET monthly_usage = 1,
        usage_reset_at = date_trunc('month', v_now) + interval '1 month',
        updated_at = v_now
    WHERE user_id = p_user_id;
  ELSE
    v_new_usage := v_current_usage + 1;
    UPDATE subscriptions
    SET monthly_usage = monthly_usage + 1,
        updated_at = v_now
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS: profiles
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- RLS: subscriptions
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON subscriptions;
CREATE POLICY "Service role full access"
  ON subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
CREATE POLICY "Service role full access profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS: pricing_plans (public read, service_role write)
-- ============================================================
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active plans" ON pricing_plans;
CREATE POLICY "Public can read active plans"
  ON pricing_plans FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role full access pricing_plans" ON pricing_plans;
CREATE POLICY "Service role full access pricing_plans"
  ON pricing_plans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Admin RLS policies — allow admins full read on all tables
-- ============================================================

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can read all subscriptions" ON subscriptions;
CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update all subscriptions" ON subscriptions;
CREATE POLICY "Admins can update all subscriptions"
  ON subscriptions FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert subscriptions" ON subscriptions;
CREATE POLICY "Admins can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can delete subscriptions" ON subscriptions;
CREATE POLICY "Admins can delete subscriptions"
  ON subscriptions FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can manage pricing_plans" ON pricing_plans;
CREATE POLICY "Admins can manage pricing_plans"
  ON pricing_plans FOR ALL
  USING (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- Atomic subscription usage increment & monthly reset function
-- ============================================================
CREATE OR REPLACE FUNCTION increment_subscription_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_usage INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Select current usage and reset time
  SELECT monthly_usage, usage_reset_at 
  INTO v_usage, v_reset_at
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  -- If no subscription exists, return NULL
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if current time is past the reset time. If so, reset counter
  IF now() >= v_reset_at THEN
    v_usage := 1;
    v_reset_at := date_trunc('month', now()) + interval '1 month';
    
    UPDATE subscriptions
    SET monthly_usage = v_usage,
        usage_reset_at = v_reset_at,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    v_usage := v_usage + 1;
    
    UPDATE subscriptions
    SET monthly_usage = v_usage,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_usage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions (plan);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
CREATE INDEX IF NOT EXISTS idx_pricing_plans_is_active ON pricing_plans (is_active);

-- ============================================================
-- ProComm — Seed Test Accounts
-- ============================================================
-- Run this in Supabase Studio: SQL Editor → paste → Run
--
-- Creates:
--   Admin:  admin@procomm.ai  /  Admin@123456!
--   Test User:  testuser@test.com  /  Test@123456
--
-- Safe to run multiple times (idempotent).
-- ============================================================

-- If user already exists → update password
-- If user doesn't exist → insert (trigger auto-creates profile)
-- Then upsert profile to set correct role
-- Then upsert subscription

-- ============================================================
-- Admin Account
-- ============================================================
UPDATE auth.users
SET encrypted_password = crypt('Admin@123456!', gen_salt('bf')),
    updated_at = now()
WHERE email = 'admin@procomm.ai';

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
SELECT 'a0000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000000',
       'admin@procomm.ai',
       crypt('Admin@123456!', gen_salt('bf')),
       now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"name":"Admin"}'::jsonb,
       now(), now(),
       'authenticated', 'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@procomm.ai');

-- ============================================================
-- Test User Account
-- ============================================================
UPDATE auth.users
SET encrypted_password = crypt('Test@123456', gen_salt('bf')),
    updated_at = now()
WHERE email = 'testuser@test.com';

INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
SELECT 'a0000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000000',
       'testuser@test.com',
       crypt('Test@123456', gen_salt('bf')),
       now(), now(),
       '{"provider":"email","providers":["email"]}'::jsonb,
       '{"name":"Test User"}'::jsonb,
       now(), now(),
       'authenticated', 'authenticated'
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'testuser@test.com');

-- ============================================================
-- Profiles
-- ============================================================
INSERT INTO public.profiles (id, email, name, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin@procomm.ai', 'Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'Admin', email = 'admin@procomm.ai';

INSERT INTO public.profiles (id, email, name, role)
VALUES ('a0000000-0000-0000-0000-000000000002', 'testuser@test.com', 'Test User', 'user')
ON CONFLICT (id) DO UPDATE SET name = 'Test User', email = 'testuser@test.com';

-- ============================================================
-- Subscriptions
-- ============================================================
INSERT INTO public.subscriptions (user_id, plan, status, monthly_usage, usage_reset_at, current_period_start, current_period_end, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin', 'active', 0, date_trunc('month', now()) + interval '1 month', now(), now() + interval '10 years', now(), now())
ON CONFLICT (user_id) DO UPDATE SET plan = 'admin', status = 'active', updated_at = now();

INSERT INTO public.subscriptions (user_id, plan, status, monthly_usage, usage_reset_at, current_period_start, current_period_end, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000002', 'monthly', 'active', 0, date_trunc('month', now()) + interval '1 month', now(), now() + interval '1 month', now(), now())
ON CONFLICT (user_id) DO UPDATE SET plan = 'monthly', status = 'active', updated_at = now();

-- ============================================================
-- Verify
-- ============================================================
SELECT '✅ Seed complete!' AS result;

SELECT id, email, role FROM public.profiles ORDER BY email;

SELECT user_id, plan, status FROM public.subscriptions ORDER BY plan;

-- ============================================================
-- Fix Admin Role in Supabase (Cloud/Production)
-- ============================================================
-- Run this in your Supabase Dashboard:
--   1. Go to https://supabase.com/dashboard
--   2. Open your project
--   3. Click "SQL Editor" in the left sidebar
--   4. Paste this SQL and click "Run"
-- ============================================================

-- Replace 'admin@procomm.ai' with the email you're trying to log in with
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@procomm.ai';

-- Verify it worked:
SELECT id, email, role FROM public.profiles WHERE email = 'admin@procomm.ai';

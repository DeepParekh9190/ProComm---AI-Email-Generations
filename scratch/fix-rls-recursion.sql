-- ============================================================
-- Fix RLS infinite recursion on profiles table
-- ============================================================
-- The "Admins can read all profiles" policy calls
-- SELECT FROM profiles inside a profiles policy → infinite recursion → 500.
-- 
-- Fix: create a SECURITY DEFINER function that bypasses RLS
-- to safely look up the current user's role without looping.
-- ============================================================

-- 1. Create a safe, non-recursive role-lookup function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Drop and recreate the recursive SELECT policy using the safe function
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    public.get_my_role() = 'admin'
  );

-- 3. Drop and recreate the recursive UPDATE policy using the safe function
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    public.get_my_role() = 'admin'
  );

-- 4. Verify the new policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

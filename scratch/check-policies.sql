-- Check current RLS policies on profiles
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

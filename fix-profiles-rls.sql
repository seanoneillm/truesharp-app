-- Fix RLS Policies for Profiles Table Updates
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS policies on profiles
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- 2. Drop existing RLS policies that might be blocking updates
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view public seller profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- 3. Create new, working RLS policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to view public seller profiles  
CREATE POLICY "Users can view public seller profiles" ON profiles
    FOR SELECT USING (public_profile = true AND is_seller = true);

-- CRITICAL: Allow users to update their own profile (this was likely missing or wrong)
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for new signups)
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 4. Test the auth context while running this script
SELECT 
    'Current auth context:' as info,
    auth.uid() as user_id, 
    auth.role() as role;

-- 5. Test a direct update of your profile to confirm RLS works
UPDATE profiles 
SET 
    bio = 'RLS Test - ' || NOW()::text,
    updated_at = NOW()
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';

-- 6. Check if the test update worked
SELECT 
    username, 
    display_name, 
    bio, 
    updated_at,
    'Updated via SQL:' as test_result
FROM profiles 
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';

-- 7. Alternative: If RLS is still causing issues, temporarily disable it for testing
-- UNCOMMENT THESE LINES IF THE ABOVE DOESN'T WORK:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- -- Test your app updates, then re-enable with:
-- -- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
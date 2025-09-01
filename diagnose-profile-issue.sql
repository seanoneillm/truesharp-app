-- Diagnose Profile Update Issues
-- Run this in Supabase SQL Editor

-- 1. Check if your profile actually exists
SELECT 
    id, 
    username, 
    display_name, 
    bio, 
    email, 
    created_at, 
    updated_at
FROM profiles 
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';

-- 2. Check if there are ANY profiles in the table
SELECT COUNT(*) as total_profiles FROM profiles;

-- 3. Check the profiles table structure to see what columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check RLS policies on profiles table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check 
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- 5. Check if RLS is enabled on profiles
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- 6. Try to create your profile if it doesn't exist (using your user ID)
INSERT INTO profiles (
    id, 
    username, 
    display_name, 
    bio, 
    email, 
    created_at, 
    updated_at
) VALUES (
    '28991397-dae7-42e8-a822-0dffc6ff49b7',
    'seanoneill715',
    'seanoneill715',
    '',
    'seanoneill715@gmail.com',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- 7. Verify the profile was created/updated
SELECT 
    id, 
    username, 
    display_name, 
    bio, 
    email, 
    created_at, 
    updated_at
FROM profiles 
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';
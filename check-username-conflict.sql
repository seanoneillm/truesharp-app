-- Check for Username Conflicts
-- Run this in Supabase SQL Editor

-- 1. Check if username "seanoneill715" is already taken by someone else
SELECT id, username, email, created_at 
FROM profiles 
WHERE username = 'seanoneill715' 
AND id != '28991397-dae7-42e8-a822-0dffc6ff49b7';

-- 2. Check what your current profile data is
SELECT id, username, display_name, bio, email, updated_at 
FROM profiles 
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';

-- 3. Try a direct update to see what happens
UPDATE profiles 
SET 
    username = 'seanoneill715-test',
    display_name = 'Sean Test',
    bio = 'Test bio update',
    updated_at = NOW()
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';

-- 4. Check if the update worked
SELECT id, username, display_name, bio, email, updated_at 
FROM profiles 
WHERE id = '28991397-dae7-42e8-a822-0dffc6ff49b7';
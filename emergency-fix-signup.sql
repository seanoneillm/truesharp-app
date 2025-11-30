-- Emergency fix for signup issues
-- This temporarily disables the problematic analytics_settings trigger

-- Step 1: Disable the analytics settings trigger that's causing permission issues
DROP TRIGGER IF EXISTS on_auth_user_created_analytics_settings ON auth.users;

-- Step 2: Check what triggers remain on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Step 3: Verify the problematic function still exists (we'll fix it later)
SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
    AND p.proname = 'create_default_analytics_settings'
) AS function_exists;
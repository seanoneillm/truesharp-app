-- Emergency: Completely remove the problematic trigger
-- Run this in your Supabase SQL Editor

-- Drop the trigger entirely (this should work even without table ownership)
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Also drop the function to ensure it's not called elsewhere
DROP FUNCTION IF EXISTS create_profile_for_new_user();

-- Verify the trigger is gone
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
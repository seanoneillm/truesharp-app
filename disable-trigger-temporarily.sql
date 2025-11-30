-- Temporarily disable the problematic trigger
-- Run this in your Supabase SQL Editor

-- Check current triggers
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Disable the trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER create_profile_on_signup;

-- Verify it's disabled
SELECT trigger_name, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth'
AND status = 'ENABLED';
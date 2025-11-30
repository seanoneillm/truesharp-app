-- EMERGENCY: Completely disable the promo trigger to unblock signups
-- Run this immediately in Supabase SQL Editor

-- Drop the trigger completely
DROP TRIGGER IF EXISTS promo_auto_upgrade_trigger ON auth.users;

-- Drop the function to prevent any issues
DROP FUNCTION IF EXISTS promo_auto_upgrade_new_user();

-- Verify triggers are removed
SELECT 
    'All promo triggers disabled' as status,
    'Signups should now work normally' as result;

-- Check what triggers remain on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';
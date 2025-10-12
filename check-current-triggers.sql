-- Check current trigger functions to confirm they have the timestamp bug
-- Run this in Supabase to see the current trigger logic

-- 1. Check the manage_odds_duplicates trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'manage_odds_duplicates';

-- 2. Check the manage_open_odds_duplicates trigger function  
SELECT prosrc FROM pg_proc WHERE proname = 'manage_open_odds_duplicates';

-- 3. Check what triggers are currently active
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('odds', 'open_odds')
ORDER BY event_object_table, trigger_name;

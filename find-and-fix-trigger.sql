-- Step 1: Find the actual trigger name that's causing the issue
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'bets'
    AND action_statement LIKE '%user_performance_cache%';

-- Step 2: Find all triggers on the bets table
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'bets'
ORDER BY trigger_name;

-- Step 3: Check if the user_performance_cache table exists and its structure
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_performance_cache'
ORDER BY ordinal_position;
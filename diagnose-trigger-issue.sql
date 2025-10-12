-- Simple test to demonstrate the trigger issue
-- This will help us see exactly what's happening with bulk inserts

-- Check current trigger logic by examining the function source
SELECT 
    'Current Trigger Logic' as analysis,
    p.proname as function_name,
    p.prosrc as source_code
FROM pg_proc p 
WHERE p.proname IN ('manage_odds_duplicates', 'manage_open_odds_duplicates');

-- Simulate what happens during bulk insert with same timestamp
-- Show examples of records that would conflict
SELECT 
    'Potential Conflicts in Recent Data' as analysis,
    eventid,
    oddid, 
    line,
    COUNT(*) as duplicate_count,
    fetched_at,
    MIN(id) as first_id,
    MAX(id) as last_id
FROM odds 
WHERE fetched_at >= NOW() - INTERVAL '1 hour'
GROUP BY eventid, oddid, line, fetched_at
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 5;

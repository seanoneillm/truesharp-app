-- Quick diagnostic to check trigger behavior
-- Run this to understand why odds might be getting deleted

-- 1. Check if triggers are active
SELECT 
    'Trigger Status' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE WHEN tgenabled = 'O' THEN 'ENABLED' ELSE 'DISABLED' END as status,
    tgtype,
    prosrc as function_code
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname IN ('trigger_manage_odds_duplicates', 'trigger_manage_open_odds_duplicates');

-- 2. Check for any recent odds with same eventid+oddid+line combinations
SELECT 
    'Recent Duplicate Combinations' as check_type,
    eventid,
    oddid,
    line,
    COUNT(*) as record_count,
    MIN(fetched_at) as earliest_fetch,
    MAX(fetched_at) as latest_fetch,
    MAX(fetched_at) - MIN(fetched_at) as time_span
FROM odds 
WHERE fetched_at >= NOW() - INTERVAL '1 hour'
GROUP BY eventid, oddid, line
HAVING COUNT(*) > 1
ORDER BY record_count DESC
LIMIT 10;

-- 3. Check current odds table size and recent activity
SELECT 
    'Odds Table Status' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN fetched_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_records,
    COUNT(CASE WHEN fetched_at >= NOW() - INTERVAL '10 minutes' THEN 1 END) as very_recent_records,
    MIN(fetched_at) as oldest_record,
    MAX(fetched_at) as newest_record
FROM odds;

-- 4. Check open_odds table status
SELECT 
    'Open Odds Table Status' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN fetched_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as recent_records,
    COUNT(CASE WHEN fetched_at >= NOW() - INTERVAL '10 minutes' THEN 1 END) as very_recent_records,
    MIN(fetched_at) as oldest_record,
    MAX(fetched_at) as newest_record
FROM open_odds;

-- 5. Check for games today that should have odds
SELECT 
    'Games Analysis' as check_type,
    COUNT(*) as total_games_today,
    COUNT(CASE WHEN g.id IN (SELECT DISTINCT eventid FROM odds) THEN 1 END) as games_with_odds,
    COUNT(CASE WHEN g.id IN (SELECT DISTINCT eventid FROM open_odds) THEN 1 END) as games_with_open_odds
FROM games g
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '1 day';

-- Test to understand odds processing for game ouW6XII0uKqRsJazjYBr
-- Run this in Supabase SQL editor to understand the data flow

-- 1. First, let's check the game details
SELECT 
    id,
    home_team,
    away_team,
    status,
    game_time,
    league,
    CASE 
        WHEN game_time < NOW() THEN 'Game has started'
        ELSE 'Game has not started'
    END as game_status_check
FROM games 
WHERE id = 'ouW6XII0uKqRsJazjYBr';

-- 2. Check all current odds for this game with detailed breakdown
SELECT 
    oddid,
    marketname,
    bettypeid,
    sideid,
    line,
    bookodds,
    CASE 
        WHEN fanduelodds IS NOT NULL THEN 'Has FanDuel'
        ELSE 'No FanDuel'
    END as fanduel_status,
    CASE 
        WHEN draftkingsodds IS NOT NULL THEN 'Has DraftKings'  
        ELSE 'No DraftKings'
    END as draftkings_status,
    created_at,
    fetched_at
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
ORDER BY created_at DESC;

-- 3. Check if there are any constraint violations or trigger issues
-- Look for recent error logs or failed insertions
SELECT 
    'Recent odds insertions in last hour' as info,
    COUNT(*) as count
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
    AND created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Total odds for this game' as info,
    COUNT(*) as count
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
UNION ALL
SELECT 
    'Recent open_odds insertions in last hour' as info,
    COUNT(*) as count
FROM open_odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
    AND created_at > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'Total open_odds for this game' as info,
    COUNT(*) as count
FROM open_odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr';

-- 4. Analyze unique constraint combinations
SELECT 
    eventid,
    oddid,
    line,
    COUNT(*) as duplicate_count
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
GROUP BY eventid, oddid, line
HAVING COUNT(*) > 1;

-- 5. Check what types of markets/bet types are actually saved
SELECT 
    marketname,
    bettypeid,
    COUNT(*) as count,
    COUNT(DISTINCT oddid) as unique_odds,
    COUNT(DISTINCT line) as unique_lines,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
GROUP BY marketname, bettypeid
ORDER BY count DESC;

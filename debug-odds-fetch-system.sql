-- Comprehensive Odds Fetch System Debugging Script
-- Run this BEFORE and AFTER odds fetch to debug the issue

-- ==================================================
-- PART 1: PRE-FETCH DIAGNOSTIC
-- ==================================================

-- Check current counts in both tables
SELECT 'Current odds table count' as description, COUNT(*) as count FROM odds;
SELECT 'Current open_odds table count' as description, COUNT(*) as count FROM open_odds;

-- Check recent odds by fetch time
SELECT 'Recent odds (last 24h)' as description, COUNT(*) as count 
FROM odds 
WHERE fetched_at >= NOW() - INTERVAL '24 hours';

SELECT 'Recent open_odds (last 24h)' as description, COUNT(*) as count 
FROM open_odds 
WHERE fetched_at >= NOW() - INTERVAL '24 hours';

-- Check games for today and tomorrow
SELECT 'Games today/tomorrow' as description, COUNT(*) as count
FROM games 
WHERE game_time >= CURRENT_DATE 
  AND game_time < CURRENT_DATE + INTERVAL '2 days';

-- Sample of games without odds
SELECT 
    'Games without any odds' as description,
    g.id,
    g.home_team,
    g.away_team,
    g.league,
    g.game_time
FROM games g
LEFT JOIN odds o ON g.id = o.eventid
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
  AND o.eventid IS NULL
ORDER BY g.game_time
LIMIT 10;

-- ==================================================
-- PART 2: DATABASE INTEGRITY CHECKS
-- ==================================================

-- Check for trigger functions
SELECT 
    'Trigger function exists' as description,
    proname as function_name,
    CASE WHEN proname IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM pg_proc 
WHERE proname IN ('manage_odds_duplicates', 'manage_open_odds_duplicates');

-- Check for triggers
SELECT 
    'Active triggers' as description,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    CASE WHEN tgenabled = 'O' THEN 'ENABLED' ELSE 'DISABLED' END as status
FROM pg_trigger 
WHERE tgname IN ('trigger_manage_odds_duplicates', 'trigger_manage_open_odds_duplicates');

-- Check unique constraints
SELECT 
    'Unique constraints' as description,
    conname as constraint_name,
    conrelid::regclass as table_name,
    CASE WHEN conname IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM pg_constraint 
WHERE conname IN ('odds_eventid_oddid_line_unique', 'open_odds_eventid_oddid_line_key');

-- ==================================================
-- PART 3: ODDS ANALYSIS BY LEAGUE AND MARKET TYPE
-- ==================================================

-- Current odds by league
SELECT 
    'Current odds by league' as description,
    g.league,
    COUNT(o.id) as odds_count,
    COUNT(DISTINCT o.eventid) as games_with_odds,
    COUNT(DISTINCT g.id) as total_games
FROM games g
LEFT JOIN odds o ON g.id = o.eventid
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
GROUP BY g.league
ORDER BY odds_count DESC;

-- Odds by market type
SELECT 
    'Odds by market type' as description,
    o.marketname,
    COUNT(*) as count
FROM odds o
JOIN games g ON o.eventid = g.id
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
GROUP BY o.marketname
ORDER BY count DESC;

-- Player props specifically
SELECT 
    'Player props count' as description,
    COUNT(*) as count
FROM odds o
JOIN games g ON o.eventid = g.id
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
  AND (
    o.marketname ILIKE '%player%' OR 
    o.marketname ILIKE '%prop%' OR
    o.bettypeid ILIKE '%player%' OR
    o.bettypeid ILIKE '%prop%'
  );

-- ==================================================
-- PART 4: SPORTSBOOK COVERAGE ANALYSIS
-- ==================================================

-- Check sportsbook odds coverage
SELECT 
    'Sportsbook coverage' as description,
    COUNT(CASE WHEN fanduelodds IS NOT NULL THEN 1 END) as fanduel_count,
    COUNT(CASE WHEN draftkingsodds IS NOT NULL THEN 1 END) as draftkings_count,
    COUNT(CASE WHEN espnbetodds IS NOT NULL THEN 1 END) as espnbet_count,
    COUNT(CASE WHEN ceasarsodds IS NOT NULL THEN 1 END) as caesars_count,
    COUNT(CASE WHEN mgmodds IS NOT NULL THEN 1 END) as mgm_count,
    COUNT(*) as total_odds
FROM odds o
JOIN games g ON o.eventid = g.id
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days';

-- ==================================================
-- PART 5: DUPLICATE DETECTION
-- ==================================================

-- Check for potential duplicates in odds table
SELECT 
    'Potential duplicates in odds' as description,
    eventid,
    oddid,
    line,
    COUNT(*) as duplicate_count,
    MIN(fetched_at) as first_fetch,
    MAX(fetched_at) as last_fetch
FROM odds
WHERE eventid IN (
    SELECT eventid FROM games 
    WHERE game_time >= CURRENT_DATE 
    AND game_time < CURRENT_DATE + INTERVAL '2 days'
)
GROUP BY eventid, oddid, line
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Check for potential duplicates in open_odds table
SELECT 
    'Potential duplicates in open_odds' as description,
    eventid,
    oddid,
    line,
    COUNT(*) as duplicate_count,
    MIN(fetched_at) as first_fetch,
    MAX(fetched_at) as last_fetch
FROM open_odds
WHERE eventid IN (
    SELECT eventid FROM games 
    WHERE game_time >= CURRENT_DATE 
    AND game_time < CURRENT_DATE + INTERVAL '2 days'
)
GROUP BY eventid, oddid, line
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- ==================================================
-- PART 6: SAMPLE DATA VERIFICATION
-- ==================================================

-- Get a sample game with the most odds
SELECT 
    'Sample game with most odds' as description,
    g.id,
    g.home_team,
    g.away_team,
    g.league,
    COUNT(o.id) as odds_count
FROM games g
JOIN odds o ON g.id = o.eventid
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
GROUP BY g.id, g.home_team, g.away_team, g.league
ORDER BY COUNT(o.id) DESC
LIMIT 1;

-- Show sample odds for that game
WITH sample_game AS (
    SELECT g.id as game_id
    FROM games g
    JOIN odds o ON g.id = o.eventid
    WHERE g.game_time >= CURRENT_DATE 
      AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
    GROUP BY g.id
    ORDER BY COUNT(o.id) DESC
    LIMIT 1
)
SELECT 
    'Sample odds breakdown' as description,
    o.oddid,
    o.marketname,
    o.line,
    o.bookodds,
    o.fanduelodds,
    o.draftkingsodds,
    o.fetched_at
FROM odds o
JOIN sample_game sg ON o.eventid = sg.game_id
ORDER BY o.marketname, o.line
LIMIT 20;

-- ==================================================
-- PART 7: API FETCH SIMULATION CHECKS
-- ==================================================

-- Check for eventids that match the pattern from the API
SELECT 
    'API-style eventids' as description,
    COUNT(*) as count
FROM games
WHERE id ~ '^[A-Za-z0-9]{20}$'  -- Typical API eventid pattern
  AND game_time >= CURRENT_DATE 
  AND game_time < CURRENT_DATE + INTERVAL '2 days';

-- Check for missing eventids in odds tables
SELECT 
    'Games missing from odds table' as description,
    g.id,
    g.home_team,
    g.away_team,
    g.league
FROM games g
LEFT JOIN odds o ON g.id = o.eventid
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '2 days'
  AND o.eventid IS NULL
ORDER BY g.league, g.game_time
LIMIT 10;

-- ==================================================
-- QUICK SUMMARY
-- ==================================================
SELECT 
    '=== QUICK SUMMARY ===' as description,
    (SELECT COUNT(*) FROM games WHERE game_time >= CURRENT_DATE AND game_time < CURRENT_DATE + INTERVAL '2 days') as games_today_tomorrow,
    (SELECT COUNT(DISTINCT eventid) FROM odds WHERE eventid IN (SELECT id FROM games WHERE game_time >= CURRENT_DATE AND game_time < CURRENT_DATE + INTERVAL '2 days')) as games_with_odds,
    (SELECT COUNT(*) FROM odds WHERE eventid IN (SELECT id FROM games WHERE game_time >= CURRENT_DATE AND game_time < CURRENT_DATE + INTERVAL '2 days')) as total_odds_today_tomorrow,
    (SELECT COUNT(*) FROM open_odds WHERE eventid IN (SELECT id FROM games WHERE game_time >= CURRENT_DATE AND game_time < CURRENT_DATE + INTERVAL '2 days')) as total_open_odds_today_tomorrow;

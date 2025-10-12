-- Test for specific eventid: ZTWVFSDQUyXfUV99iPke
-- Run this in your Supabase SQL Editor

-- 1. Check if this exact eventid exists in odds table
SELECT COUNT(*) as total_odds
FROM odds 
WHERE eventid = 'ZTWVFSDQUyXfUV99iPke';

-- 2. Get sample odds for this eventid (if any exist)
SELECT eventid, oddid, line, sportsbook, fanduelodds, draftkingsodds, created_at
FROM odds 
WHERE eventid = 'ZTWVFSDQUyXfUV99iPke'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if game exists in games table
SELECT id, home_team, away_team, league, game_time
FROM games 
WHERE id = 'ZTWVFSDQUyXfUV99iPke';

-- 4. Look for similar eventids (in case of data corruption)
SELECT eventid, COUNT(*) as odds_count
FROM odds 
WHERE eventid LIKE '%iPke%'  -- Last 4 chars of the eventid
GROUP BY eventid
ORDER BY odds_count DESC
LIMIT 10;

-- 5. Check today's games and their odds counts
SELECT 
    g.id as game_id,
    g.home_team,
    g.away_team,
    g.league,
    COUNT(o.id) as odds_count
FROM games g
LEFT JOIN odds o ON g.id = o.eventid
WHERE g.game_time >= CURRENT_DATE 
  AND g.game_time < CURRENT_DATE + INTERVAL '1 day'
GROUP BY g.id, g.home_team, g.away_team, g.league
ORDER BY odds_count DESC
LIMIT 20;

-- 6. Check if there's a pattern - games with 0 odds vs games with odds
SELECT 
    CASE 
        WHEN odds_count = 0 THEN '0 odds'
        WHEN odds_count < 100 THEN '1-99 odds'
        WHEN odds_count < 1000 THEN '100-999 odds'
        WHEN odds_count < 2000 THEN '1000-1999 odds'
        ELSE '2000+ odds'
    END as odds_range,
    COUNT(*) as game_count
FROM (
    SELECT 
        g.id,
        COUNT(o.id) as odds_count
    FROM games g
    LEFT JOIN odds o ON g.id = o.eventid
    WHERE g.game_time >= CURRENT_DATE 
      AND g.game_time < CURRENT_DATE + INTERVAL '1 day'
    GROUP BY g.id
) game_odds
GROUP BY 
    CASE 
        WHEN odds_count = 0 THEN '0 odds'
        WHEN odds_count < 100 THEN '1-99 odds'
        WHEN odds_count < 1000 THEN '100-999 odds'
        WHEN odds_count < 2000 THEN '1000-1999 odds'
        ELSE '2000+ odds'
    END
ORDER BY game_count DESC;
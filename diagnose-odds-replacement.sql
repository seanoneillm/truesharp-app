-- Diagnostic Query to Understand Odds Replacement Behavior
-- Run this to see what's happening with game ouW6XII0uKqRsJazjYBR

-- 1. Check current odds for this game
SELECT 
    'Current odds for game ouW6XII0uKqRsJazjYBR' as analysis,
    COUNT(*) as total_odds,
    COUNT(DISTINCT oddid) as unique_oddids,
    COUNT(DISTINCT CONCAT(oddid, '|', COALESCE(line, 'NULL'))) as unique_combinations,
    MIN(fetched_at) as earliest_fetch,
    MAX(fetched_at) as latest_fetch,
    MAX(updated_at) as latest_update
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBR';

-- 2. Sample the odds to see the structure
SELECT 
    'Sample odds breakdown' as analysis,
    oddid,
    marketname,
    line,
    fetched_at,
    updated_at,
    fanduelodds,
    draftkingsodds,
    mgmodds
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBR'
ORDER BY oddid, line
LIMIT 10;

-- 3. Check open_odds for comparison
SELECT 
    'Open odds for same game' as analysis,
    COUNT(*) as total_open_odds,
    COUNT(DISTINCT oddid) as unique_oddids,
    MIN(fetched_at) as earliest_fetch,
    MAX(fetched_at) as latest_fetch
FROM open_odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBR';

-- 4. Look for pattern in oddid structure
SELECT 
    'Oddid patterns' as analysis,
    LEFT(oddid, 20) as oddid_prefix,
    COUNT(*) as count,
    COUNT(DISTINCT line) as different_lines
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBR'
GROUP BY LEFT(oddid, 20)
ORDER BY count DESC
LIMIT 10;

-- 5. Check if this is the expected behavior
SELECT 
    'DIAGNOSIS' as analysis,
    CASE 
        WHEN COUNT(*) < 100 THEN 'TRIGGER REPLACEMENT - Odds are being updated, not accumulated'
        WHEN COUNT(*) > 1000 THEN 'NORMAL ACCUMULATION - Multiple fetches creating new rows'
        ELSE 'MIXED BEHAVIOR - Some replacement, some accumulation'
    END as behavior_type,
    'This explains why you see updated timestamps but same row count' as explanation
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBR';

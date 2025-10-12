-- COMPREHENSIVE VERIFICATION QUERIES FOR ODDS FETCH FIXES
-- Run these before and after applying fixes to verify improvements

-- 1. BASELINE: Count current odds by type (run BEFORE fixes)
SELECT 'BEFORE FIXES - Current State' as status;

SELECT 
    'odds' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE line IS NULL) as null_lines,
    COUNT(*) FILTER (WHERE line IS NOT NULL) as non_null_lines,
    COUNT(*) FILTER (WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as player_props,
    COUNT(DISTINCT eventid) as unique_games,
    COUNT(DISTINCT oddid) as unique_oddids,
    MAX(fetched_at) as latest_fetch
FROM odds
UNION ALL
SELECT 
    'open_odds' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE line IS NULL) as null_lines,
    COUNT(*) FILTER (WHERE line IS NOT NULL) as non_null_lines,
    COUNT(*) FILTER (WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as player_props,
    COUNT(DISTINCT eventid) as unique_games,
    COUNT(DISTINCT oddid) as unique_oddids,
    MAX(fetched_at) as latest_fetch
FROM open_odds;

-- 2. Check for potential constraint conflicts
SELECT 'Checking constraint conflicts' as status;

-- Find records that might violate partial unique constraints
SELECT 
    eventid,
    oddid,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(DISTINCT line) as line_values,
    ARRAY_AGG(DISTINCT id) as record_ids
FROM odds 
WHERE line IS NULL
GROUP BY eventid, oddid
HAVING COUNT(*) > 1;

-- Same for open_odds
SELECT 
    eventid,
    oddid,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(DISTINCT line) as line_values,
    ARRAY_AGG(DISTINCT id) as record_ids
FROM open_odds 
WHERE line IS NULL
GROUP BY eventid, oddid
HAVING COUNT(*) > 1;

-- 3. Check trigger functions exist and are correct
SELECT 'Checking trigger functions' as status;

SELECT 
    routine_name,
    routine_type,
    routine_definition LIKE '%< NEW.fetched_at%' as has_correct_open_odds_logic,
    routine_definition LIKE '%< NEW.fetched_at THEN%' as has_correct_odds_logic
FROM information_schema.routines 
WHERE routine_name IN ('manage_open_odds_duplicates', 'manage_odds_duplicates');

-- 4. After applying fixes, test with sample data (run after database trigger fixes)
SELECT 'Testing trigger behavior' as status;

-- This will test if triggers work correctly (run after trigger fixes)
-- Insert test record into open_odds
INSERT INTO open_odds (eventid, oddid, line, sportsbook, marketname, bettypeid, fetched_at)
VALUES ('test-game-1', 'test-odd-1', NULL, 'TestBook', 'Test Market', 'ml', NOW() - INTERVAL '1 hour')
ON CONFLICT (eventid, oddid, line) DO NOTHING;

-- Try to insert newer record (should be rejected by trigger)
INSERT INTO open_odds (eventid, oddid, line, sportsbook, marketname, bettypeid, fetched_at)
VALUES ('test-game-1', 'test-odd-1', NULL, 'TestBook2', 'Test Market 2', 'ml', NOW())
ON CONFLICT (eventid, oddid, line) DO NOTHING;

-- Check that only older record remains
SELECT 
    COUNT(*) as records_for_test_odd,
    MIN(fetched_at) as oldest_fetch,
    MAX(fetched_at) as newest_fetch
FROM open_odds 
WHERE eventid = 'test-game-1' AND oddid = 'test-odd-1';

-- Clean up test data
DELETE FROM open_odds WHERE eventid = 'test-game-1';

-- 5. AFTER FIXES: Run verification queries to confirm improvements
-- (Run these after applying all fixes and running a fetch)
SELECT 'AFTER FIXES - Verification Results' as status;

-- Check that player props are now being inserted
SELECT 
    eventid,
    COUNT(*) as total_odds,
    COUNT(*) FILTER (WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as player_props,
    COUNT(*) FILTER (WHERE line IS NULL) as main_lines,
    COUNT(*) FILTER (WHERE line IS NOT NULL) as alt_lines
FROM odds 
GROUP BY eventid 
ORDER BY player_props DESC
LIMIT 10;

-- 6. Performance check: Ensure no major slowdown
SELECT 'Performance check' as status;

EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM odds o1
WHERE EXISTS (
    SELECT 1 FROM odds o2 
    WHERE o1.eventid = o2.eventid 
      AND o1.oddid = o2.oddid 
      AND ((o1.line IS NULL AND o2.line IS NULL) OR o1.line = o2.line)
);

-- 7. Final verification: Compare before/after counts
-- (This creates a comparison view - run after fixes and new fetch)
CREATE OR REPLACE VIEW odds_comparison AS
WITH before_counts AS (
    -- These would be your baseline counts from step 1
    SELECT 'MANUAL_INPUT' as source, 0 as odds_total, 0 as odds_props, 0 as open_odds_total, 0 as open_odds_props
),
after_counts AS (
    SELECT 
        'AFTER_FIXES' as source,
        (SELECT COUNT(*) FROM odds) as odds_total,
        (SELECT COUNT(*) FROM odds WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as odds_props,
        (SELECT COUNT(*) FROM open_odds) as open_odds_total,
        (SELECT COUNT(*) FROM open_odds WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as open_odds_props
)
SELECT 
    'COMPARISON' as type,
    a.odds_total - b.odds_total as odds_increase,
    a.odds_props - b.odds_props as player_props_increase,
    a.open_odds_total - b.open_odds_total as open_odds_increase,
    a.open_odds_props - b.open_odds_props as open_odds_props_increase
FROM after_counts a, before_counts b;

-- 8. Debug query for specific issues
-- If you're still missing specific types of odds, use this to investigate:
SELECT 
    eventid,
    oddid,
    marketname,
    bettypeid,
    line,
    sportsbook,
    fetched_at,
    CASE 
        WHEN marketname ILIKE '%player%' OR marketname ILIKE '%prop%' THEN 'Player Prop'
        WHEN line IS NULL THEN 'Main Line'
        ELSE 'Alt Line'
    END as odds_type
FROM odds
WHERE eventid IN (
    -- Get a sample of recent games
    SELECT DISTINCT eventid FROM odds ORDER BY fetched_at DESC LIMIT 3
)
ORDER BY eventid, odds_type, oddid;

SELECT 'Verification queries complete' as status;
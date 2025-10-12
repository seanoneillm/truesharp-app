-- SPECIFIC MONEYLINE DEBUG QUERIES
-- Run these to understand exactly what's happening with moneyline odds

-- 1. Count current moneyline odds (line IS NULL)
SELECT 'Current Moneyline Count' as query_type;

SELECT 
    'odds' as table_name,
    COUNT(*) FILTER (WHERE line IS NULL) as moneyline_count,
    COUNT(*) FILTER (WHERE line IS NULL AND bettypeid = 'ml') as confirmed_moneylines,
    COUNT(*) FILTER (WHERE line IS NULL AND marketname ILIKE '%money%') as moneyline_by_market,
    COUNT(*) FILTER (WHERE line IS NULL AND marketname ILIKE '%h2h%') as h2h_moneylines,
    COUNT(*) as total_records
FROM odds

UNION ALL

SELECT 
    'open_odds' as table_name,
    COUNT(*) FILTER (WHERE line IS NULL) as moneyline_count,
    COUNT(*) FILTER (WHERE line IS NULL AND bettypeid = 'ml') as confirmed_moneylines,
    COUNT(*) FILTER (WHERE line IS NULL AND marketname ILIKE '%money%') as moneyline_by_market,
    COUNT(*) FILTER (WHERE line IS NULL AND marketname ILIKE '%h2h%') as h2h_moneylines,
    COUNT(*) as total_records
FROM open_odds;

-- 2. Sample moneyline records to understand their structure
SELECT 'Sample Moneyline Records' as query_type;

SELECT 
    eventid,
    oddid,
    line,
    bettypeid,
    marketname,
    sideid,
    bookodds,
    fanduelodds,
    draftkingsodds,
    fetched_at
FROM odds 
WHERE line IS NULL 
    AND (bettypeid = 'ml' OR marketname ILIKE '%money%' OR marketname ILIKE '%h2h%')
ORDER BY fetched_at DESC 
LIMIT 10;

-- 3. Check for recent games and their moneyline odds
SELECT 'Recent Games Moneyline Analysis' as query_type;

WITH recent_games AS (
    SELECT DISTINCT eventid 
    FROM odds 
    ORDER BY MAX(fetched_at) DESC 
    LIMIT 5
)
SELECT 
    rg.eventid,
    COUNT(*) as total_odds_for_game,
    COUNT(*) FILTER (WHERE o.line IS NULL) as null_line_odds,
    COUNT(*) FILTER (WHERE o.line IS NULL AND o.bettypeid = 'ml') as moneylines,
    COUNT(*) FILTER (WHERE o.line IS NOT NULL) as line_based_odds,
    ARRAY_AGG(DISTINCT o.bettypeid) as bet_types_present,
    ARRAY_AGG(DISTINCT o.marketname) as market_names_present
FROM recent_games rg
JOIN odds o ON rg.eventid = o.eventid
GROUP BY rg.eventid
ORDER BY moneylines DESC;

-- 4. Check what bet types we're actually getting from the API
SELECT 'Bet Type Distribution' as query_type;

SELECT 
    bettypeid,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE line IS NULL) as null_line_count,
    COUNT(*) FILTER (WHERE line IS NOT NULL) as non_null_line_count,
    ARRAY_AGG(DISTINCT marketname) as market_names,
    MAX(fetched_at) as latest_fetch
FROM odds 
WHERE fetched_at > NOW() - INTERVAL '24 hours'  -- Recent fetches only
GROUP BY bettypeid
ORDER BY record_count DESC;

-- 5. Check for constraint violations that might prevent moneyline insertion
SELECT 'Constraint Violation Check' as query_type;

-- Look for duplicate moneylines that might be causing constraint issues
SELECT 
    eventid,
    oddid,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(DISTINCT sideid) as sides,
    ARRAY_AGG(DISTINCT bettypeid) as bet_types,
    ARRAY_AGG(DISTINCT bookodds) as odds_values
FROM odds 
WHERE line IS NULL
GROUP BY eventid, oddid
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- 6. Test what the API might be sending us
SELECT 'API Data Structure Analysis' as query_type;

-- Check if we're getting moneyline data but it's not being saved properly
SELECT 
    eventid,
    oddid,
    bettypeid,
    marketname,
    line,
    sideid,
    CASE 
        WHEN bettypeid = 'ml' AND line IS NULL THEN 'Perfect Moneyline'
        WHEN bettypeid = 'ml' AND line IS NOT NULL THEN 'Moneyline with Line (ERROR)'
        WHEN bettypeid != 'ml' AND line IS NULL THEN 'Non-ML with NULL line'
        WHEN marketname ILIKE '%money%' OR marketname ILIKE '%h2h%' THEN 'Moneyline by Market Name'
        ELSE 'Other'
    END as record_classification
FROM odds 
WHERE fetched_at > NOW() - INTERVAL '1 hour'
ORDER BY record_classification, eventid
LIMIT 20;

-- 7. Compare with what we expect from SportsGameOdds API
SELECT 'Expected vs Actual Moneylines' as query_type;

WITH game_summary AS (
    SELECT 
        eventid,
        COUNT(DISTINCT oddid) as unique_odds,
        COUNT(*) FILTER (WHERE bettypeid = 'ml') as moneyline_records,
        COUNT(*) FILTER (WHERE bettypeid = 'sp') as spread_records,  
        COUNT(*) FILTER (WHERE bettypeid = 'ou') as total_records,
        -- Most games should have at least 2 moneyline records (home/away)
        CASE 
            WHEN COUNT(*) FILTER (WHERE bettypeid = 'ml') >= 2 THEN '✅ Has Moneylines'
            WHEN COUNT(*) FILTER (WHERE bettypeid = 'ml') = 1 THEN '⚠️ Only 1 Moneyline'
            ELSE '❌ No Moneylines'
        END as moneyline_status
    FROM odds 
    WHERE fetched_at > NOW() - INTERVAL '2 hours'
    GROUP BY eventid
)
SELECT 
    moneyline_status,
    COUNT(*) as game_count,
    AVG(moneyline_records) as avg_moneylines_per_game,
    AVG(spread_records) as avg_spreads_per_game,
    AVG(total_records) as avg_totals_per_game
FROM game_summary
GROUP BY moneyline_status
ORDER BY 
    CASE moneyline_status
        WHEN '✅ Has Moneylines' THEN 1
        WHEN '⚠️ Only 1 Moneyline' THEN 2
        ELSE 3
    END;
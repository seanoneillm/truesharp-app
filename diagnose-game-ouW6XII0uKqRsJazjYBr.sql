-- Diagnostic Analysis for Game ouW6XII0uKqRsJazjYBr
-- This will help us understand why 1400+ API odds became only 20 database rows

-- 1. Check current odds count for this game
SELECT 
    COUNT(*) as total_odds,
    COUNT(DISTINCT oddid) as unique_odd_ids,
    COUNT(DISTINCT marketname) as unique_markets,
    COUNT(DISTINCT bettypeid) as unique_bet_types
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr';

-- 2. Analyze bet type distribution
SELECT 
    bettypeid,
    COUNT(*) as count,
    COUNT(DISTINCT oddid) as unique_odd_ids,
    COUNT(DISTINCT line) as unique_lines
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
GROUP BY bettypeid
ORDER BY count DESC;

-- 3. Check for line value distribution
SELECT 
    CASE 
        WHEN line IS NULL THEN 'NULL (main lines)'
        ELSE 'Has line value (alt lines)'
    END as line_type,
    COUNT(*) as count,
    COUNT(DISTINCT oddid) as unique_odd_ids
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
GROUP BY CASE WHEN line IS NULL THEN 'NULL (main lines)' ELSE 'Has line value (alt lines)' END;

-- 4. Sample of actual records to see what was saved
SELECT 
    oddid,
    marketname,
    bettypeid,
    sideid,
    line,
    bookodds,
    fanduelodds,
    draftkingsodds,
    created_at,
    updated_at
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check if there are any patterns in the oddid values
SELECT 
    LENGTH(oddid) as oddid_length,
    COUNT(*) as count,
    MIN(oddid) as sample_oddid
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
GROUP BY LENGTH(oddid)
ORDER BY count DESC;

-- 6. Check for any recent insertions (last 24 hours)
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as records_inserted
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
    AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- 7. Compare with open_odds table
SELECT 
    'odds' as table_name,
    COUNT(*) as record_count
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr'
UNION ALL
SELECT 
    'open_odds' as table_name,
    COUNT(*) as record_count
FROM open_odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr';

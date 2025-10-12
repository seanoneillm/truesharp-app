-- DEBUG: Why are 56% of processed records lost during database insertion?
-- Based on test results: 2,281 records processed → 1,000 saved to database

-- Check for constraint violations and trigger behavior
SELECT 'Database Insertion Loss Analysis' as analysis_type;

-- 1. Check if unique constraints are working properly
SELECT 'Unique Constraint Analysis' as check_type;

-- Count potential duplicates that might be getting rejected
WITH duplicate_analysis AS (
    SELECT 
        eventid,
        oddid, 
        line,
        COUNT(*) as duplicate_count,
        MIN(fetched_at) as first_fetch,
        MAX(fetched_at) as last_fetch,
        ARRAY_AGG(DISTINCT bettypeid) as bet_types,
        ARRAY_AGG(DISTINCT sideid) as side_ids
    FROM odds 
    WHERE eventid = 'eGBOJSO1BKBTeJtrpyN9'  -- The test game
    GROUP BY eventid, oddid, line
    HAVING COUNT(*) > 1
)
SELECT 
    COUNT(*) as groups_with_duplicates,
    SUM(duplicate_count) as total_duplicate_records,
    AVG(duplicate_count) as avg_duplicates_per_group,
    MAX(duplicate_count) as max_duplicates_per_group
FROM duplicate_analysis;

-- 2. Check if records are being rejected by triggers
SELECT 'Trigger Behavior Analysis' as check_type;

-- Enable notice logging temporarily to see trigger activity
-- (Run this manually if needed)
-- SET log_min_messages = 'notice';

-- 3. Look for patterns in what's missing
SELECT 'Missing Records Pattern Analysis' as check_type;

-- Compare bet type distribution in the database vs what we expect
SELECT 
    bettypeid,
    COUNT(*) as db_count,
    COUNT(*) FILTER (WHERE line IS NULL) as null_line_count,
    COUNT(*) FILTER (WHERE line IS NOT NULL) as non_null_line_count,
    ARRAY_AGG(DISTINCT marketname ORDER BY marketname) FILTER (WHERE marketname IS NOT NULL) as market_names
FROM odds 
WHERE eventid = 'eGBOJSO1BKBTeJtrpyN9'
GROUP BY bettypeid
ORDER BY db_count DESC;

-- 4. Check for specific alt line patterns that might be getting rejected
SELECT 'Alt Line Rejection Analysis' as check_type;

-- Look for suspicious patterns in line values
SELECT 
    bettypeid,
    line,
    COUNT(*) as records_with_this_line,
    ARRAY_AGG(DISTINCT oddid ORDER BY oddid) FILTER (WHERE oddid IS NOT NULL) as odd_ids
FROM odds 
WHERE eventid = 'eGBOJSO1BKBTeJtrpyN9'
    AND line IS NOT NULL
GROUP BY bettypeid, line
ORDER BY records_with_this_line DESC
LIMIT 20;

-- 5. Simulate what should have been inserted based on the test
SELECT 'Expected vs Actual Analysis' as check_type;

-- Based on test results, we should have:
-- - 16 moneylines (we have 15) ✅ Close
-- - 248 spreads (we have 240) ✅ Close  
-- - 1,893 totals (we have 623) ❌ Major loss
-- - 2,141 alt lines (we have 863) ❌ Major loss

WITH expected_counts AS (
    SELECT 
        'Expected from test' as source,
        16 as moneylines,
        248 as spreads, 
        1893 as totals,
        2141 as alt_lines,
        2281 as total_records
), actual_counts AS (
    SELECT 
        'Actual in database' as source,
        COUNT(*) FILTER (WHERE bettypeid = 'ml') as moneylines,
        COUNT(*) FILTER (WHERE bettypeid = 'sp') as spreads,
        COUNT(*) FILTER (WHERE bettypeid = 'ou') as totals,
        COUNT(*) FILTER (WHERE line IS NOT NULL) as alt_lines,
        COUNT(*) as total_records
    FROM odds 
    WHERE eventid = 'eGBOJSO1BKBTeJtrpyN9'
)
SELECT 
    'Comparison' as analysis,
    e.moneylines as expected_ml,
    a.moneylines as actual_ml,
    ROUND((a.moneylines::decimal / e.moneylines * 100), 1) as ml_success_rate,
    e.totals as expected_totals,
    a.totals as actual_totals,
    ROUND((a.totals::decimal / e.totals * 100), 1) as totals_success_rate,
    e.alt_lines as expected_alt,
    a.alt_lines as actual_alt,
    ROUND((a.alt_lines::decimal / e.alt_lines * 100), 1) as alt_success_rate
FROM expected_counts e, actual_counts a;

-- 6. Check recent trigger activity (if logging is enabled)
SELECT 'Recent Trigger Activity' as check_type;

-- This would show trigger logs if NOTICE level logging was enabled
-- Look for patterns in what the triggers are doing

-- 7. Test constraint behavior with sample data
SELECT 'Constraint Test' as check_type;

-- Test if we can insert a similar alt line record
BEGIN;

-- Try to insert a test total alt line (these seem to be getting rejected most)
INSERT INTO odds (
    eventid, oddid, line, sportsbook, marketname, bettypeid, sideid, bookodds, fetched_at
) VALUES (
    'eGBOJSO1BKBTeJtrpyN9',
    'test-alt-total-over',
    '42.5',  -- Alt total line
    'TestBook',
    'Test Alt Total',
    'ou',
    'over',
    -110,
    NOW()
);

-- Check if it was inserted successfully
SELECT 
    COUNT(*) as test_records_inserted,
    'Test insertion result' as result
FROM odds 
WHERE eventid = 'eGBOJSO1BKBTeJtrpyN9' 
    AND oddid = 'test-alt-total-over';

ROLLBACK;

-- 8. Final diagnosis
SELECT 'Final Diagnosis' as diagnosis_type;

-- The main issue appears to be that alternate lines (especially totals) 
-- are being rejected during database insertion. This could be due to:
-- 1. Triggers being too aggressive with timestamp comparisons
-- 2. Constraint conflicts we haven't identified  
-- 3. Data type issues with line values
-- 4. Performance issues causing timeouts

SELECT 
    'The 56% loss during database insertion suggests:' as issue,
    'Triggers or constraints are rejecting valid alt line records' as likely_cause,
    'Focus on "ou" (total) and alt line handling in triggers' as recommendation;
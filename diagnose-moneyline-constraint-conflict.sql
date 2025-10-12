-- DIAGNOSIS: Why Moneyline Odds (line IS NULL) Are Missing
-- This investigates the constraint conflict causing moneyline odds to be rejected

-- Check current constraint situation
SELECT 'Current Constraint Analysis' as analysis_type;

-- 1. Show all unique constraints and indexes on both tables
SELECT 
    schemaname, 
    tablename, 
    indexname, 
    indexdef,
    CASE 
        WHEN indexdef LIKE '%WHERE%line is null%' THEN 'PARTIAL: NULL lines only'
        WHEN indexdef LIKE '%line%' AND indexdef NOT LIKE '%WHERE%' THEN 'FULL: All lines'
        ELSE 'OTHER'
    END as constraint_type
FROM pg_indexes 
WHERE tablename IN ('odds', 'open_odds') 
    AND (indexname LIKE '%uniq%' OR indexdef LIKE '%UNIQUE%')
ORDER BY tablename, indexname;

-- 2. Check for constraint violations that might be blocking inserts
SELECT 'Checking for existing constraint violations' as check_type;

-- Find records that violate the partial unique constraint (eventid, oddid) WHERE line IS NULL
WITH null_line_duplicates AS (
    SELECT 
        'odds' as table_name,
        eventid, 
        oddid,
        COUNT(*) as duplicate_count,
        ARRAY_AGG(id ORDER BY fetched_at) as record_ids,
        ARRAY_AGG(fetched_at ORDER BY fetched_at) as fetch_times
    FROM odds 
    WHERE line IS NULL
    GROUP BY eventid, oddid
    HAVING COUNT(*) > 1
    
    UNION ALL
    
    SELECT 
        'open_odds' as table_name,
        eventid, 
        oddid,
        COUNT(*) as duplicate_count,
        ARRAY_AGG(id ORDER BY fetched_at) as record_ids,
        ARRAY_AGG(fetched_at ORDER BY fetched_at) as fetch_times
    FROM open_odds 
    WHERE line IS NULL
    GROUP BY eventid, oddid
    HAVING COUNT(*) > 1
)
SELECT * FROM null_line_duplicates;

-- 3. Test what happens when we try to insert a moneyline odd
SELECT 'Testing moneyline insertion' as test_type;

-- Create a test moneyline record to see what constraint blocks it
-- (This will show us the exact error)
BEGIN;

-- Try to insert a test moneyline odd (line IS NULL)
INSERT INTO odds (
    eventid, oddid, line, sportsbook, marketname, bettypeid, sideid, bookodds, fetched_at
) VALUES (
    'test-game-moneyline', 
    'test-odd-ml-1', 
    NULL,  -- This is the key - moneyline has NULL line
    'TestBook', 
    'Moneyline', 
    'ml', 
    'home', 
    -150, 
    NOW()
);

-- Try to insert another moneyline for same game/odd (should conflict)
INSERT INTO odds (
    eventid, oddid, line, sportsbook, marketname, bettypeid, sideid, bookodds, fetched_at
) VALUES (
    'test-game-moneyline', 
    'test-odd-ml-1', 
    NULL,  -- Same NULL line
    'TestBook2', 
    'Moneyline2', 
    'ml', 
    'away', 
    +130, 
    NOW() + INTERVAL '1 minute'
);

ROLLBACK;  -- Don't actually commit these test records

-- 4. Show the constraint definition differences
SELECT 'Constraint Definition Analysis' as analysis_type;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class WHERE relname IN ('odds', 'open_odds')
)
AND contype = 'u'  -- unique constraints only
ORDER BY conrelid, conname;

-- 5. SOLUTION PREVIEW: What we need to fix
SELECT 'Recommended Constraint Fix' as fix_type;

-- The issue is likely that you have BOTH:
-- 1. Full unique constraint: (eventid, oddid, line) 
-- 2. Partial unique constraint: (eventid, oddid) WHERE line IS NULL
-- 
-- These can conflict because:
-- - The partial constraint says "only one NULL line per (eventid, oddid)"
-- - But triggers might be inserting multiple NULL line records
-- - Or the full constraint is being violated in a different way
--
-- Let's see which constraints actually exist:

SELECT 
    'Current constraints on odds table:' as info,
    STRING_AGG(
        indexname || ': ' || 
        CASE 
            WHEN indexdef LIKE '%WHERE%' THEN 'PARTIAL - ' || SUBSTRING(indexdef FROM 'WHERE (.+)$')
            ELSE 'FULL'
        END, 
        E'\n'
    ) as constraint_list
FROM pg_indexes 
WHERE tablename = 'odds' AND indexdef LIKE '%UNIQUE%';

-- Final diagnosis query - this will show us exactly what's wrong
SELECT 'Final Diagnosis' as diagnosis;

-- Check if we have competing constraints
WITH constraint_analysis AS (
    SELECT 
        tablename,
        COUNT(*) FILTER (WHERE indexdef LIKE '%eventid%oddid%line%' AND indexdef NOT LIKE '%WHERE%') as full_constraints,
        COUNT(*) FILTER (WHERE indexdef LIKE '%eventid%oddid%' AND indexdef LIKE '%WHERE%line is null%') as partial_null_constraints,
        COUNT(*) FILTER (WHERE indexdef LIKE '%eventid%oddid%' AND indexdef NOT LIKE '%line%') as oddid_only_constraints
    FROM pg_indexes 
    WHERE tablename IN ('odds', 'open_odds') 
        AND indexdef LIKE '%UNIQUE%'
    GROUP BY tablename
)
SELECT 
    tablename,
    full_constraints,
    partial_null_constraints,
    oddid_only_constraints,
    CASE 
        WHEN full_constraints > 0 AND partial_null_constraints > 0 
        THEN '⚠️ CONFLICT: Both full and partial constraints exist'
        WHEN partial_null_constraints > 1
        THEN '⚠️ CONFLICT: Multiple partial constraints'
        WHEN full_constraints = 0 AND partial_null_constraints = 0
        THEN '⚠️ PROBLEM: No unique constraints on eventid/oddid/line'
        ELSE '✅ Constraints look OK'
    END as diagnosis
FROM constraint_analysis;
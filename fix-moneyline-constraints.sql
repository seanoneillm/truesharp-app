-- FIX: Remove conflicting partial unique constraints that block moneyline odds
-- The full (eventid, oddid, line) constraint is sufficient

-- STEP 1: Check what we're removing
SELECT 'Before removing partial constraints' as status;

SELECT 
    schemaname, tablename, indexname, indexdef
FROM pg_indexes 
WHERE tablename IN ('odds', 'open_odds') 
    AND indexname LIKE '%uniq%' 
    AND indexdef LIKE '%WHERE%line is null%'
ORDER BY tablename, indexname;

-- STEP 2: Remove the conflicting partial unique constraints
SELECT 'Removing conflicting partial constraints' as status;

-- Remove partial unique constraint from odds table
DROP INDEX IF EXISTS uniq_odds_eventid_oddid_null_line;

-- Remove partial unique constraint from open_odds table  
DROP INDEX IF EXISTS uniq_openodds_eventid_oddid_null_line;

-- STEP 3: Verify the full constraints are still in place
SELECT 'Verifying full constraints remain' as status;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN (
    SELECT oid FROM pg_class WHERE relname IN ('odds', 'open_odds')
)
AND contype = 'u'  -- unique constraints
AND pg_get_constraintdef(oid) LIKE '%eventid%oddid%line%'
ORDER BY conrelid, conname;

-- STEP 4: Test that moneyline insertion now works
SELECT 'Testing moneyline insertion after fix' as status;

BEGIN;

-- First create a test game (required by foreign key constraint)
INSERT INTO games (
    id, sport, league, home_team, away_team, home_team_name, away_team_name,
    game_time, status, created_at, updated_at
) VALUES (
    'test-moneyline-fix',
    'MLB', 
    'MLB',
    'Test Home Team',
    'Test Away Team', 
    'Test Home Team',
    'Test Away Team',
    NOW() + INTERVAL '1 day',
    'scheduled',
    NOW(),
    NOW()
);

-- Now test inserting multiple moneyline sides for same game
INSERT INTO odds (
    eventid, oddid, line, sportsbook, marketname, bettypeid, sideid, bookodds, fetched_at
) VALUES 
(
    'test-moneyline-fix', 
    'ml-test-1', 
    NULL,  -- Moneyline home
    'TestBook', 
    'Moneyline', 
    'ml', 
    'home', 
    -150, 
    NOW()
),
(
    'test-moneyline-fix', 
    'ml-test-1', 
    NULL,  -- Moneyline away (different sideid, same oddid)
    'TestBook', 
    'Moneyline', 
    'ml', 
    'away', 
    +130, 
    NOW()
);

-- This should work now - check the results
SELECT 
    eventid, oddid, line, sideid, bookodds,
    'Successfully inserted' as result
FROM odds 
WHERE eventid = 'test-moneyline-fix'
ORDER BY sideid;

ROLLBACK; -- Clean up test data

-- STEP 5: Verify constraint definitions are clean
SELECT 'Final constraint verification' as status;

WITH constraint_summary AS (
    SELECT 
        tablename,
        COUNT(*) FILTER (WHERE indexdef LIKE '%eventid%oddid%line%' AND indexdef NOT LIKE '%WHERE%') as full_constraints,
        COUNT(*) FILTER (WHERE indexdef LIKE '%WHERE%line is null%') as partial_null_constraints
    FROM pg_indexes 
    WHERE tablename IN ('odds', 'open_odds') 
        AND indexdef LIKE '%UNIQUE%'
    GROUP BY tablename
)
SELECT 
    tablename,
    full_constraints,
    partial_null_constraints,
    CASE 
        WHEN full_constraints = 1 AND partial_null_constraints = 0 
        THEN '✅ FIXED: Only full constraint remains'
        WHEN partial_null_constraints > 0
        THEN '❌ STILL BROKEN: Partial constraints exist'
        ELSE '❓ UNKNOWN: Check constraint configuration'
    END as status
FROM constraint_summary;

-- STEP 6: Alternative approach if you need to keep some constraint on NULL lines
-- (Only run this if you specifically need additional constraints for business logic)

-- If you need to ensure only one moneyline record per (eventid, oddid, sideid) combination:
-- CREATE UNIQUE INDEX IF NOT EXISTS uniq_odds_moneyline_per_side 
-- ON public.odds (eventid, oddid, sideid) 
-- WHERE line IS NULL;

-- But this is usually not needed since the full (eventid, oddid, line) constraint 
-- plus proper application logic should handle this.

SELECT 'Moneyline constraint fix complete' as status;
SELECT 'Next step: Run odds fetch and check for moneyline odds in logs' as next_action;
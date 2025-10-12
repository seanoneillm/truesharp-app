-- CLEANUP EXISTING DUPLICATES: PRIORITIZE ROWS WITH LINKS
-- This script removes duplicate rows and keeps the ones with valuable link data
-- Run this AFTER deploying the enhanced trigger

-- ===================================================================
-- STEP 1: ANALYSIS - Count current duplicates
-- ===================================================================

-- Check how many duplicates we have
SELECT 
    eventid,
    oddid,
    line,
    COUNT(*) as duplicate_count,
    COUNT(CASE WHEN (
        fanduellink IS NOT NULL OR
        draftkingslink IS NOT NULL OR
        ceasarslink IS NOT NULL OR
        mgmlink IS NOT NULL OR
        espnbetlink IS NOT NULL OR
        bovadalink IS NOT NULL
    ) THEN 1 END) as rows_with_links
FROM odds 
GROUP BY eventid, oddid, line
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- ===================================================================
-- STEP 2: BACKUP - Create backup table
-- ===================================================================

-- Create backup of odds table before cleanup
DROP TABLE IF EXISTS odds_backup_before_cleanup;
CREATE TABLE odds_backup_before_cleanup AS 
SELECT * FROM odds;

SELECT 'BACKUP CREATED: odds_backup_before_cleanup table created' as status;

-- ===================================================================
-- STEP 3: CLEANUP - Remove duplicates intelligently
-- ===================================================================

-- Create temporary table with the "best" row for each (eventid, oddid, line) combination
CREATE TEMP TABLE best_odds_rows AS
WITH ranked_odds AS (
    SELECT *,
        -- Priority scoring: links = 1000 points, recent timestamp = 1 point per hour
        CASE WHEN (
            fanduellink IS NOT NULL OR
            draftkingslink IS NOT NULL OR
            ceasarslink IS NOT NULL OR
            mgmlink IS NOT NULL OR
            espnbetlink IS NOT NULL OR
            bovadalink IS NOT NULL OR
            unibetlink IS NOT NULL OR
            pointsbetlink IS NOT NULL OR
            williamhilllink IS NOT NULL OR
            ballybetlink IS NOT NULL OR
            barstoollink IS NOT NULL OR
            betonlinelink IS NOT NULL OR
            betparxlink IS NOT NULL OR
            betriverslink IS NOT NULL OR
            betuslink IS NOT NULL OR
            fanaticslink IS NOT NULL OR
            hardrockbetlink IS NOT NULL OR
            bet365link IS NOT NULL OR
            pinnaclelink IS NOT NULL
        ) THEN 1000 ELSE 0 END +
        EXTRACT(EPOCH FROM fetched_at) / 3600 as priority_score,
        
        ROW_NUMBER() OVER (
            PARTITION BY eventid, oddid, line 
            ORDER BY 
                -- Primary: Prefer rows with links
                CASE WHEN (
                    fanduellink IS NOT NULL OR
                    draftkingslink IS NOT NULL OR
                    ceasarslink IS NOT NULL OR
                    mgmlink IS NOT NULL OR
                    espnbetlink IS NOT NULL OR
                    bovadalink IS NOT NULL OR
                    unibetlink IS NOT NULL OR
                    pointsbetlink IS NOT NULL OR
                    williamhilllink IS NOT NULL OR
                    ballybetlink IS NOT NULL OR
                    barstoollink IS NOT NULL OR
                    betonlinelink IS NOT NULL OR
                    betparxlink IS NOT NULL OR
                    betriverslink IS NOT NULL OR
                    betuslink IS NOT NULL OR
                    fanaticslink IS NOT NULL OR
                    hardrockbetlink IS NOT NULL OR
                    bet365link IS NOT NULL OR
                    pinnaclelink IS NOT NULL
                ) THEN 0 ELSE 1 END,
                -- Secondary: Prefer newer timestamps
                fetched_at DESC
        ) as row_rank
    FROM odds
)
SELECT * FROM ranked_odds WHERE row_rank = 1;

-- Count rows selected for keeping
SELECT 
    COUNT(*) as total_rows_to_keep,
    COUNT(CASE WHEN (
        fanduellink IS NOT NULL OR
        draftkingslink IS NOT NULL OR
        ceasarslink IS NOT NULL OR
        mgmlink IS NOT NULL
    ) THEN 1 END) as rows_with_links_kept
FROM best_odds_rows;

-- ===================================================================
-- STEP 4: EXECUTE CLEANUP
-- ===================================================================

-- Delete all rows from odds table
TRUNCATE TABLE odds;

-- Insert the best rows back
INSERT INTO odds 
SELECT 
    id, eventid, sportsbook, marketname, statid, bettypeid, closebookodds, 
    bookodds, odds_type, fetched_at, created_at, leagueid, hometeam, awayteam, 
    oddid, playerid, periodid, sideid, fanduelodds, fanduellink, espnbetodds, 
    espnbetlink, ceasarsodds, ceasarslink, mgmodds, mgmlink, fanaticsodds, 
    fanaticslink, draftkingsodds, draftkingslink, score, updated_at, line, 
    hometeam_score, awayteam_score, bovadaodds, bovadalink, unibetodds, unibetlink, 
    pointsbetodds, pointsbetlink, williamhillodds, williamhilllink, ballybetodds, 
    ballybetlink, barstoolodds, barstoollink, betonlineodds, betonlinelink, 
    betparxodds, betparxlink, betriversodds, betriverslink, betusodds, betuslink, 
    betfairexchangeodds, betfairexchangelink, betfairsportsbookodds, betfairsportsbooklink, 
    betfredodds, betfredlink, fliffodds, flifflink, fourwindsodds, fourwindslink, 
    hardrockbetodds, hardrockbetlink, lowvigodds, lowviglink, marathonbetodds, 
    marathonbetlink, primesportsodds, primesportslink, prophetexchangeodds, 
    prophetexchangelink, skybetodds, skybetlink, sleeperodds, sleeperlink, 
    stakeodds, stakelink, underdogodds, underdoglink, wynnbetodds, wynnbetlink, 
    thescorebetodds, thescorebetlink, bet365odds, bet365link, circaodds, circalink, 
    pinnacleodds, pinnaclelink, prizepicksodds, prizepickslink
FROM best_odds_rows;

-- ===================================================================
-- STEP 5: VERIFICATION
-- ===================================================================

-- Verify no duplicates remain
SELECT 
    'CLEANUP COMPLETE' as status,
    COUNT(*) as total_odds_rows,
    COUNT(DISTINCT CONCAT(eventid, '|', oddid, '|', COALESCE(line, 'NULL'))) as unique_combinations,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT CONCAT(eventid, '|', oddid, '|', COALESCE(line, 'NULL'))) 
        THEN 'NO DUPLICATES ✅' 
        ELSE 'DUPLICATES STILL EXIST ❌' 
    END as duplicate_status
FROM odds;

-- Count rows with links after cleanup
SELECT 
    COUNT(CASE WHEN (
        fanduellink IS NOT NULL OR
        draftkingslink IS NOT NULL OR
        ceasarslink IS NOT NULL OR
        mgmlink IS NOT NULL OR
        espnbetlink IS NOT NULL OR
        bovadalink IS NOT NULL
    ) THEN 1 END) as rows_with_links,
    COUNT(*) as total_rows,
    ROUND(
        COUNT(CASE WHEN (
            fanduellink IS NOT NULL OR
            draftkingslink IS NOT NULL OR
            ceasarslink IS NOT NULL OR
            mgmlink IS NOT NULL OR
            espnbetlink IS NOT NULL OR
            bovadalink IS NOT NULL
        ) THEN 1 END) * 100.0 / COUNT(*), 
    2) as percentage_with_links
FROM odds;

-- Sample the moneyline results for verification
SELECT 
    eventid, oddid, sideid, fetched_at,
    fanduellink IS NOT NULL as has_fanduel_link,
    draftkingslink IS NOT NULL as has_dk_link,
    ceasarslink IS NOT NULL as has_caesars_link,
    mgmlink IS NOT NULL as has_mgm_link
FROM odds 
WHERE bettypeid = 'ml' 
    AND eventid = 'ouW6XII0uKqRsJazjYBR'
ORDER BY fetched_at DESC;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

SELECT 
    'SUCCESS: Duplicate cleanup complete!' as status,
    'Rows with valuable link data have been preserved.' as result,
    'Check the verification queries above to confirm results.' as next_step;
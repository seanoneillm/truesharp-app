-- OPTIMIZED CLEANUP: Remove duplicates in smaller chunks to avoid timeout
-- Run these queries one at a time in Supabase SQL editor

-- ===================================================================
-- STEP 1: Quick analysis (runs fast)
-- ===================================================================

-- Count total duplicates (should be fast)
SELECT COUNT(*) as total_odds_rows FROM odds;

-- Count distinct combinations
SELECT COUNT(DISTINCT CONCAT(eventid, '|', oddid, '|', COALESCE(line, 'NULL'))) as unique_combinations FROM odds;

-- ===================================================================
-- STEP 2: Create optimized cleanup function
-- ===================================================================

-- Create a function to clean up duplicates for one event at a time
CREATE OR REPLACE FUNCTION cleanup_duplicates_for_event(target_eventid TEXT)
RETURNS INTEGER AS $$
DECLARE
    rows_deleted INTEGER := 0;
    rows_deleted_this_iteration INTEGER;
    duplicate_group RECORD;
    best_row_id UUID;
BEGIN
    -- Process each (oddid, line) combination for this event
    FOR duplicate_group IN 
        SELECT oddid, line, COUNT(*) as cnt
        FROM odds 
        WHERE eventid = target_eventid
        GROUP BY oddid, line 
        HAVING COUNT(*) > 1
    LOOP
        -- Find the best row for this combination
        SELECT id INTO best_row_id
        FROM odds 
        WHERE eventid = target_eventid 
          AND oddid = duplicate_group.oddid 
          AND (
            (line IS NULL AND duplicate_group.line IS NULL) OR 
            (line = duplicate_group.line)
          )
        ORDER BY 
            -- Priority 1: Has links
            CASE WHEN (
                fanduellink IS NOT NULL OR
                draftkingslink IS NOT NULL OR
                ceasarslink IS NOT NULL OR
                mgmlink IS NOT NULL OR
                espnbetlink IS NOT NULL OR
                bovadalink IS NOT NULL
            ) THEN 0 ELSE 1 END,
            -- Priority 2: Newest timestamp
            fetched_at DESC
        LIMIT 1;
        
        -- Delete all other rows for this combination
        DELETE FROM odds 
        WHERE eventid = target_eventid 
          AND oddid = duplicate_group.oddid 
          AND (
            (line IS NULL AND duplicate_group.line IS NULL) OR 
            (line = duplicate_group.line)
          )
          AND id != best_row_id;
          
        GET DIAGNOSTICS rows_deleted_this_iteration = ROW_COUNT;
        rows_deleted := rows_deleted + rows_deleted_this_iteration;
        
    END LOOP;
    
    RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- STEP 3: Get list of events with duplicates
-- ===================================================================

-- Find events that have duplicates (run this to see what needs cleaning)
SELECT 
    eventid,
    COUNT(*) as total_rows,
    COUNT(DISTINCT CONCAT(oddid, '|', COALESCE(line, 'NULL'))) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT CONCAT(oddid, '|', COALESCE(line, 'NULL'))) as duplicate_count
FROM odds 
GROUP BY eventid
HAVING COUNT(*) > COUNT(DISTINCT CONCAT(oddid, '|', COALESCE(line, 'NULL')))
ORDER BY duplicate_count DESC
LIMIT 10;
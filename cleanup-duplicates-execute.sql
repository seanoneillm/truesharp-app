-- EXECUTE CLEANUP: Run these one at a time after running the optimized setup

-- ===================================================================
-- STEP 4: Execute cleanup for specific events
-- ===================================================================

-- Example: Clean up the event you showed me (ouW6XII0uKqRsJazjYBr)
SELECT cleanup_duplicates_for_event('ouW6XII0uKqRsJazjYBr');

-- Check results for that event
SELECT 
    eventid, oddid, line, fetched_at,
    fanduellink IS NOT NULL as has_fanduel_link,
    draftkingslink IS NOT NULL as has_dk_link,
    ceasarslink IS NOT NULL as has_caesars_link
FROM odds 
WHERE eventid = 'ouW6XII0uKqRsJazjYBr' 
  AND bettypeid = 'ml'
ORDER BY oddid, fetched_at DESC;

-- ===================================================================
-- STEP 5: Clean up all events (run carefully, one at a time)
-- ===================================================================

-- Get the first event with duplicates and clean it
DO $$
DECLARE
    target_event TEXT;
    deleted_count INTEGER;
BEGIN
    -- Get first event with duplicates
    SELECT eventid INTO target_event
    FROM odds 
    GROUP BY eventid
    HAVING COUNT(*) > COUNT(DISTINCT CONCAT(oddid, '|', COALESCE(line, 'NULL')))
    LIMIT 1;
    
    IF target_event IS NOT NULL THEN
        -- Clean it up
        SELECT cleanup_duplicates_for_event(target_event) INTO deleted_count;
        RAISE NOTICE 'Cleaned event %, deleted % duplicate rows', target_event, deleted_count;
    ELSE
        RAISE NOTICE 'No events with duplicates found';
    END IF;
END $$;

-- ===================================================================
-- STEP 6: Verification queries (fast)
-- ===================================================================

-- Check if duplicates remain
SELECT 
    'CLEANUP STATUS' as status,
    COUNT(*) as total_rows,
    COUNT(DISTINCT CONCAT(eventid, '|', oddid, '|', COALESCE(line, 'NULL'))) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT CONCAT(eventid, '|', oddid, '|', COALESCE(line, 'NULL'))) as remaining_duplicates
FROM odds;

-- Count rows with links
SELECT 
    COUNT(CASE WHEN (
        fanduellink IS NOT NULL OR
        draftkingslink IS NOT NULL OR
        ceasarslink IS NOT NULL OR
        mgmlink IS NOT NULL
    ) THEN 1 END) as rows_with_links,
    COUNT(*) as total_rows,
    ROUND(
        COUNT(CASE WHEN (
            fanduellink IS NOT NULL OR
            draftkingslink IS NOT NULL OR
            ceasarslink IS NOT NULL OR
            mgmlink IS NOT NULL
        ) THEN 1 END) * 100.0 / COUNT(*), 
    2) as percentage_with_links
FROM odds;
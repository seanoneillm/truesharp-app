-- COMPREHENSIVE DATABASE TRIGGER FIXES
-- Fixes critical issues in duplicate handling logic

-- Fix #1: Correct timestamp comparison logic for open_odds
-- Fix #2: Add better error handling and logging  
-- Fix #3: Ensure proper NULL vs empty string handling

-- CORRECTED open_odds trigger function
CREATE OR REPLACE FUNCTION manage_open_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
    debug_info TEXT;
BEGIN
    -- Build debug info
    debug_info := format('NEW: eventid=%s, oddid=%s, line=%s, fetched_at=%s', 
                        NEW.eventid, NEW.oddid, COALESCE(NEW.line, 'NULL'), NEW.fetched_at);
    
    -- Check if a record already exists for this combination
    -- Use proper NULL handling to distinguish between NULL, empty string, and actual values
    SELECT * INTO existing_record 
    FROM public.open_odds 
    WHERE eventid = NEW.eventid 
      AND oddid = NEW.oddid 
      AND (
        (line IS NULL AND NEW.line IS NULL) OR 
        (line IS NOT NULL AND NEW.line IS NOT NULL AND line = NEW.line)
      );

    IF existing_record IS NOT NULL THEN
        -- CRITICAL FIX: Use < instead of <= for open_odds (keep oldest)
        IF existing_record.fetched_at < NEW.fetched_at THEN
            -- Existing record is older, keep it and cancel this insert
            RAISE NOTICE 'OPEN_ODDS: Keeping existing older record (%) over newer (%)', 
                        existing_record.fetched_at, NEW.fetched_at;
            RETURN NULL; -- Cancel the insert
        ELSE
            -- New record is older, delete existing and allow insert  
            DELETE FROM public.open_odds WHERE id = existing_record.id;
            RAISE NOTICE 'OPEN_ODDS: Replacing newer record (%) with older (%)', 
                        existing_record.fetched_at, NEW.fetched_at;
        END IF;
    ELSE
        RAISE NOTICE 'OPEN_ODDS: Inserting new record - %', debug_info;
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;

-- CORRECTED odds trigger function
CREATE OR REPLACE FUNCTION manage_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
    debug_info TEXT;
BEGIN
    -- Build debug info
    debug_info := format('NEW: eventid=%s, oddid=%s, line=%s, fetched_at=%s', 
                        NEW.eventid, NEW.oddid, COALESCE(NEW.line, 'NULL'), NEW.fetched_at);
    
    -- Check if a record already exists for this combination
    SELECT * INTO existing_record 
    FROM public.odds 
    WHERE eventid = NEW.eventid 
      AND oddid = NEW.oddid 
      AND (
        (line IS NULL AND NEW.line IS NULL) OR 
        (line IS NOT NULL AND NEW.line IS NOT NULL AND line = NEW.line)
      );

    IF existing_record IS NOT NULL THEN
        -- For odds table: keep newest record
        IF existing_record.fetched_at < NEW.fetched_at THEN
            -- Existing record is older, delete it and allow insert
            DELETE FROM public.odds WHERE id = existing_record.id;
            RAISE NOTICE 'ODDS: Replacing older record (%) with newer (%)', 
                        existing_record.fetched_at, NEW.fetched_at;
        ELSE
            -- New record is older or same, cancel this insert
            RAISE NOTICE 'ODDS: Keeping existing newer record (%) over older (%)', 
                        existing_record.fetched_at, NEW.fetched_at;
            RETURN NULL; -- Cancel the insert
        END IF;
    ELSE
        RAISE NOTICE 'ODDS: Inserting new record - %', debug_info;
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers (this ensures they're using the corrected functions)
DROP TRIGGER IF EXISTS trigger_manage_open_odds_duplicates ON public.open_odds;
DROP TRIGGER IF EXISTS trigger_manage_odds_duplicates ON public.odds;

CREATE TRIGGER trigger_manage_open_odds_duplicates
    BEFORE INSERT ON public.open_odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_open_odds_duplicates();

CREATE TRIGGER trigger_manage_odds_duplicates
    BEFORE INSERT ON public.odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_odds_duplicates();

-- OPTIONAL: Simplify constraints to avoid conflicts
-- Remove partial unique indexes if they conflict with main constraints
-- (Keep main constraints, remove partial ones if causing issues)

-- Check current constraints
SELECT 
    schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('odds', 'open_odds') 
    AND indexname LIKE '%uniq%' 
ORDER BY tablename, indexname;

-- If partial unique constraints cause issues, uncomment these:
-- DROP INDEX IF EXISTS uniq_odds_eventid_oddid_null_line;  
-- DROP INDEX IF EXISTS uniq_openodds_eventid_oddid_null_line;

-- Add comprehensive logging view for debugging
CREATE OR REPLACE VIEW odds_debug_summary AS
SELECT 
    'odds' as table_name,
    eventid,
    COUNT(*) as total_records,
    COUNT(DISTINCT oddid) as unique_oddids,
    COUNT(*) FILTER (WHERE line IS NULL) as null_lines,
    COUNT(*) FILTER (WHERE line IS NOT NULL AND line != '') as actual_lines,
    COUNT(*) FILTER (WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as player_props,
    MAX(fetched_at) as latest_fetch,
    MIN(fetched_at) as earliest_fetch
FROM odds 
GROUP BY eventid

UNION ALL

SELECT 
    'open_odds' as table_name,
    eventid,
    COUNT(*) as total_records,
    COUNT(DISTINCT oddid) as unique_oddids,
    COUNT(*) FILTER (WHERE line IS NULL) as null_lines,
    COUNT(*) FILTER (WHERE line IS NOT NULL AND line != '') as actual_lines,
    COUNT(*) FILTER (WHERE marketname ILIKE '%player%' OR marketname ILIKE '%prop%') as player_props,
    MAX(fetched_at) as latest_fetch,
    MIN(fetched_at) as earliest_fetch
FROM open_odds 
GROUP BY eventid;

-- Add comments
COMMENT ON FUNCTION manage_open_odds_duplicates() IS 'FIXED: Correctly keeps oldest records using < comparison, adds logging';
COMMENT ON FUNCTION manage_odds_duplicates() IS 'FIXED: Correctly keeps newest records using < comparison, adds logging';
COMMENT ON VIEW odds_debug_summary IS 'Debug view to monitor odds insertion and identify missing player props';

-- Enable trigger logging temporarily for debugging
-- (Set log_min_messages to 'notice' in postgresql.conf or for session)
-- You can disable these notices later by changing RAISE NOTICE to RAISE DEBUG
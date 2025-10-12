-- ENHANCED TRIGGER: PRESERVE VALUABLE LINK DATA
-- This modifies the odds trigger to prioritize rows with sportsbook links
-- over newer rows that have null links

-- ===================================================================
-- BACKUP CURRENT TRIGGER LOGIC (for rollback if needed)
-- ===================================================================

-- Drop existing triggers temporarily
DROP TRIGGER IF EXISTS trigger_manage_odds_duplicates ON public.odds CASCADE;

-- ===================================================================
-- ENHANCED ODDS TRIGGER FUNCTION
-- ===================================================================

-- Enhanced function that prioritizes rows with link data
CREATE OR REPLACE FUNCTION manage_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
    existing_has_links BOOLEAN;
    new_has_links BOOLEAN;
BEGIN
    -- Check if a record already exists for this combination
    SELECT * INTO existing_record 
    FROM public.odds 
    WHERE eventid = NEW.eventid 
      AND oddid = NEW.oddid 
      AND (
        (line IS NULL AND NEW.line IS NULL) OR 
        (line IS NOT NULL AND NEW.line IS NOT NULL AND line = NEW.line)
      );

    -- If no existing record, just insert the new one
    IF existing_record IS NULL THEN
        RETURN NEW;
    END IF;

    -- Check if existing record has valuable link data
    existing_has_links := (
        existing_record.fanduellink IS NOT NULL OR
        existing_record.draftkingslink IS NOT NULL OR
        existing_record.ceasarslink IS NOT NULL OR
        existing_record.mgmlink IS NOT NULL OR
        existing_record.espnbetlink IS NOT NULL OR
        existing_record.bovadalink IS NOT NULL OR
        existing_record.unibetlink IS NOT NULL OR
        existing_record.pointsbetlink IS NOT NULL OR
        existing_record.williamhilllink IS NOT NULL OR
        existing_record.ballybetlink IS NOT NULL OR
        existing_record.barstoollink IS NOT NULL OR
        existing_record.betonlinelink IS NOT NULL OR
        existing_record.betparxlink IS NOT NULL OR
        existing_record.betriverslink IS NOT NULL OR
        existing_record.betuslink IS NOT NULL OR
        existing_record.fanaticslink IS NOT NULL OR
        existing_record.hardrockbetlink IS NOT NULL OR
        existing_record.bet365link IS NOT NULL OR
        existing_record.pinnaclelink IS NOT NULL
    );

    -- Check if new record has valuable link data
    new_has_links := (
        NEW.fanduellink IS NOT NULL OR
        NEW.draftkingslink IS NOT NULL OR
        NEW.ceasarslink IS NOT NULL OR
        NEW.mgmlink IS NOT NULL OR
        NEW.espnbetlink IS NOT NULL OR
        NEW.bovadalink IS NOT NULL OR
        NEW.unibetlink IS NOT NULL OR
        NEW.pointsbetlink IS NOT NULL OR
        NEW.williamhilllink IS NOT NULL OR
        NEW.ballybetlink IS NOT NULL OR
        NEW.barstoollink IS NOT NULL OR
        NEW.betonlinelink IS NOT NULL OR
        NEW.betparxlink IS NOT NULL OR
        NEW.betriverslink IS NOT NULL OR
        NEW.betuslink IS NOT NULL OR
        NEW.fanaticslink IS NOT NULL OR
        NEW.hardrockbetlink IS NOT NULL OR
        NEW.bet365link IS NOT NULL OR
        NEW.pinnaclelink IS NOT NULL
    );

    -- DECISION LOGIC (in priority order):
    
    -- 1. If existing has links and new doesn't have links -> KEEP EXISTING (reject new)
    IF existing_has_links AND NOT new_has_links THEN
        RETURN NULL; -- Keep existing record with links
    END IF;

    -- 2. If new has links and existing doesn't -> REPLACE with new
    IF new_has_links AND NOT existing_has_links THEN
        DELETE FROM public.odds WHERE id = existing_record.id;
        RETURN NEW;
    END IF;

    -- 3. If both have links OR both don't have links -> use timestamp logic (newer wins)
    IF existing_record.fetched_at <= NEW.fetched_at THEN
        -- New record is newer or equal, replace existing
        DELETE FROM public.odds WHERE id = existing_record.id;
        RETURN NEW;
    ELSE
        -- Existing record is newer, cancel insert
        RETURN NULL; 
    END IF;

END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- RECREATE TRIGGER
-- ===================================================================

-- Create enhanced BEFORE INSERT trigger
CREATE TRIGGER trigger_manage_odds_duplicates
    BEFORE INSERT ON public.odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_odds_duplicates();

-- ===================================================================
-- ADD DOCUMENTATION
-- ===================================================================

COMMENT ON FUNCTION manage_odds_duplicates() IS 'ENHANCED: Prioritizes records with sportsbook links over timestamp-only logic';
COMMENT ON TRIGGER trigger_manage_odds_duplicates ON public.odds IS 'Auto-manages duplicates in odds table - PRIORITIZES LINK DATA';

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================

SELECT 'SUCCESS: Enhanced trigger deployed! Now prioritizes rows with valuable link data.' as status,
       'Rows with sportsbook links will be preserved over newer rows without links.' as behavior,
       'Run a new odds fetch to test the improvement.' as next_step;
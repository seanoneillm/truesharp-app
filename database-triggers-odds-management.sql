-- Database Triggers for Efficient Odds Management
-- This approach allows inserting all odds into both tables and uses triggers to manage duplicates

-- We need to use BEFORE triggers with proper UPSERT logic to avoid constraint violations
-- Remove existing constraints first
ALTER TABLE public.open_odds DROP CONSTRAINT IF EXISTS open_odds_eventid_oddid_line_key;
ALTER TABLE public.odds DROP CONSTRAINT IF EXISTS odds_eventid_oddid_line_unique;

-- Create function for open_odds table - keeps OLDEST records (opening odds)
-- Using BEFORE INSERT trigger to prevent constraint violations
CREATE OR REPLACE FUNCTION manage_open_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
BEGIN
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

    -- If record exists, compare timestamps
    IF existing_record IS NOT NULL THEN
        -- If existing record is newer, keep it and cancel this insert
        IF existing_record.fetched_at <= NEW.fetched_at THEN
            RETURN NULL; -- Cancel the insert
        ELSE
            -- If new record is older, delete existing and allow insert
            DELETE FROM public.open_odds 
            WHERE id = existing_record.id;
        END IF;
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;

-- Create function for odds table - keeps NEWEST records (current odds)
-- Using BEFORE INSERT trigger to prevent constraint violations
CREATE OR REPLACE FUNCTION manage_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
BEGIN
    -- Check if a record already exists for this combination
    -- Use proper NULL handling to distinguish between NULL, empty string, and actual values
    SELECT * INTO existing_record 
    FROM public.odds 
    WHERE eventid = NEW.eventid 
      AND oddid = NEW.oddid 
      AND (
        (line IS NULL AND NEW.line IS NULL) OR 
        (line IS NOT NULL AND NEW.line IS NOT NULL AND line = NEW.line)
      );

    -- If record exists, compare timestamps
    IF existing_record IS NOT NULL THEN
        -- If existing record is older, delete it and allow insert
        IF existing_record.fetched_at < NEW.fetched_at THEN
            DELETE FROM public.odds 
            WHERE id = existing_record.id;
        ELSE
            -- If new record is older or same, cancel this insert
            RETURN NULL; -- Cancel the insert
        END IF;
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;

-- Create BEFORE INSERT triggers to prevent constraint violations
CREATE OR REPLACE TRIGGER trigger_manage_open_odds_duplicates
    BEFORE INSERT ON public.open_odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_open_odds_duplicates();

CREATE OR REPLACE TRIGGER trigger_manage_odds_duplicates
    BEFORE INSERT ON public.odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_odds_duplicates();

-- Add unique constraints back after triggers are in place
-- These will now work properly with the BEFORE triggers
ALTER TABLE public.open_odds ADD CONSTRAINT open_odds_eventid_oddid_line_key UNIQUE (eventid, oddid, line);
ALTER TABLE public.odds ADD CONSTRAINT odds_eventid_oddid_line_unique UNIQUE (eventid, oddid, line);

-- Create optimized indexes for trigger performance
CREATE INDEX IF NOT EXISTS idx_open_odds_trigger_lookup ON public.open_odds (eventid, oddid, line, fetched_at);
CREATE INDEX IF NOT EXISTS idx_odds_trigger_lookup ON public.odds (eventid, oddid, line, fetched_at);

-- Add comments for documentation
COMMENT ON FUNCTION manage_open_odds_duplicates() IS 'Keeps oldest records for opening odds - preserves initial line openings';
COMMENT ON FUNCTION manage_odds_duplicates() IS 'Keeps newest records for current odds - maintains latest line movement';
COMMENT ON TRIGGER trigger_manage_open_odds_duplicates ON public.open_odds IS 'Auto-manages duplicates in open_odds table';
COMMENT ON TRIGGER trigger_manage_odds_duplicates ON public.odds IS 'Auto-manages duplicates in odds table';
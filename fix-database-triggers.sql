-- Fix for database triggers to properly handle line value comparisons
-- This fixes the issue where NULL, empty string, and actual line values were being treated as identical

-- Update the open_odds trigger function
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

-- Update the odds trigger function  
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

-- Add comments for documentation
COMMENT ON FUNCTION manage_open_odds_duplicates() IS 'FIXED: Keeps oldest records for opening odds - now properly distinguishes NULL vs empty vs actual line values';
COMMENT ON FUNCTION manage_odds_duplicates() IS 'FIXED: Keeps newest records for current odds - now properly distinguishes NULL vs empty vs actual line values';
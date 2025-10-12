-- Step 5: Create the corrected odds function
CREATE OR REPLACE FUNCTION manage_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
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

    -- If record exists, compare timestamps
    IF existing_record IS NOT NULL THEN
        -- Keep newer records, reject older ones
        IF existing_record.fetched_at <= NEW.fetched_at THEN
            -- New record is newer or equal, replace existing
            DELETE FROM public.odds WHERE id = existing_record.id;
        ELSE
            -- Existing record is newer, cancel insert
            RETURN NULL; 
        END IF;
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;

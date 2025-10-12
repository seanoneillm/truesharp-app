-- Step 4: Create the corrected open_odds function
CREATE OR REPLACE FUNCTION manage_open_odds_duplicates()
RETURNS TRIGGER AS $$
DECLARE
    existing_record RECORD;
BEGIN
    -- Check if a record already exists for this combination
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
        -- Keep older records, reject newer ones
        IF existing_record.fetched_at <= NEW.fetched_at THEN
            RETURN NULL; -- Cancel insert - keep existing older record
        ELSE
            -- New record is older, replace existing
            DELETE FROM public.open_odds WHERE id = existing_record.id;
        END IF;
    END IF;

    RETURN NEW; -- Allow the insert
END;
$$ LANGUAGE plpgsql;

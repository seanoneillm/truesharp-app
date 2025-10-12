-- Step 6: Create triggers and constraints
CREATE TRIGGER trigger_manage_open_odds_duplicates
    BEFORE INSERT ON public.open_odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_open_odds_duplicates();

CREATE TRIGGER trigger_manage_odds_duplicates
    BEFORE INSERT ON public.odds
    FOR EACH ROW
    EXECUTE FUNCTION manage_odds_duplicates();

-- Add unique constraints back
ALTER TABLE public.open_odds ADD CONSTRAINT open_odds_eventid_oddid_line_key UNIQUE (eventid, oddid, line);
ALTER TABLE public.odds ADD CONSTRAINT odds_eventid_oddid_line_unique UNIQUE (eventid, oddid, line);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_open_odds_trigger_lookup ON public.open_odds (eventid, oddid, line, fetched_at);
CREATE INDEX IF NOT EXISTS idx_odds_trigger_lookup ON public.odds (eventid, oddid, line, fetched_at);

SELECT 'Trigger fix completed successfully!' as status;

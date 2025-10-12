-- Migration to support alternate lines by adding line field to unique constraints

-- Drop existing unique constraints
ALTER TABLE public.open_odds DROP CONSTRAINT IF EXISTS open_odds_eventid_oddid_key;
ALTER TABLE public.odds DROP CONSTRAINT IF EXISTS odds_eventid_oddid_unique;

-- Add new unique constraints that include the line field
ALTER TABLE public.open_odds ADD CONSTRAINT open_odds_eventid_oddid_line_key UNIQUE (eventid, oddid, line);
ALTER TABLE public.odds ADD CONSTRAINT odds_eventid_oddid_line_unique UNIQUE (eventid, oddid, line);

-- Drop old indexes and create new ones that include the line field
DROP INDEX IF EXISTS open_odds_eventid_oddid_idx;
DROP INDEX IF EXISTS idx_open_odds_eventid_oddid;
DROP INDEX IF EXISTS idx_odds_eventid_oddid;

-- Create new indexes that support the alternate lines functionality
CREATE INDEX IF NOT EXISTS idx_open_odds_eventid_oddid_line ON public.open_odds USING btree (eventid, oddid, line);
CREATE INDEX IF NOT EXISTS idx_odds_eventid_oddid_line ON public.odds USING btree (eventid, oddid, line);

-- Add index for efficient lookups during odds processing
CREATE INDEX IF NOT EXISTS idx_open_odds_lookup ON public.open_odds USING btree (eventid, oddid);
CREATE INDEX IF NOT EXISTS idx_odds_lookup ON public.odds USING btree (eventid, oddid);

-- Add comments for documentation
COMMENT ON CONSTRAINT open_odds_eventid_oddid_line_key ON public.open_odds IS 'Unique constraint for eventid, oddid, and line to support alternate lines';
COMMENT ON CONSTRAINT odds_eventid_oddid_line_unique ON public.odds IS 'Unique constraint for eventid, oddid, and line to support alternate lines';
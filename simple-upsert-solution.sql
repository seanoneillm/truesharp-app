-- Simple UPSERT Solution for Odds Management
-- This approach uses PostgreSQL's native ON CONFLICT clause instead of triggers

-- Drop any existing triggers first
DROP TRIGGER IF EXISTS trigger_manage_open_odds_duplicates ON public.open_odds;
DROP TRIGGER IF EXISTS trigger_manage_odds_duplicates ON public.odds;
DROP FUNCTION IF EXISTS manage_open_odds_duplicates();
DROP FUNCTION IF EXISTS manage_odds_duplicates();

-- Ensure we have the proper unique constraints
ALTER TABLE public.open_odds DROP CONSTRAINT IF EXISTS open_odds_eventid_oddid_line_key;
ALTER TABLE public.odds DROP CONSTRAINT IF EXISTS odds_eventid_oddid_line_unique;

-- Add the unique constraints back
ALTER TABLE public.open_odds ADD CONSTRAINT open_odds_eventid_oddid_line_key UNIQUE (eventid, oddid, line);
ALTER TABLE public.odds ADD CONSTRAINT odds_eventid_oddid_line_unique UNIQUE (eventid, oddid, line);

-- Add indexes to support the UPSERT operations efficiently
CREATE INDEX IF NOT EXISTS idx_open_odds_upsert ON public.open_odds (eventid, oddid, line, fetched_at);
CREATE INDEX IF NOT EXISTS idx_odds_upsert ON public.odds (eventid, oddid, line, fetched_at);

-- Comments for documentation
COMMENT ON CONSTRAINT open_odds_eventid_oddid_line_key ON public.open_odds IS 'Unique constraint for eventid, oddid, and line - supports alternate lines';
COMMENT ON CONSTRAINT odds_eventid_oddid_line_unique ON public.odds IS 'Unique constraint for eventid, oddid, and line - supports alternate lines';
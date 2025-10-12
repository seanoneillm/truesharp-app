-- Step-by-step trigger fix to avoid syntax errors
-- Run each section separately if needed

-- Step 1: Clean up existing triggers
DROP TRIGGER IF EXISTS trigger_manage_odds_duplicates ON public.odds CASCADE;
DROP TRIGGER IF EXISTS trigger_manage_open_odds_duplicates ON public.open_odds CASCADE;

-- Step 2: Drop functions
DROP FUNCTION IF EXISTS manage_odds_duplicates() CASCADE;
DROP FUNCTION IF EXISTS manage_open_odds_duplicates() CASCADE;

-- Step 3: Remove constraints temporarily
ALTER TABLE public.open_odds DROP CONSTRAINT IF EXISTS open_odds_eventid_oddid_line_key;
ALTER TABLE public.odds DROP CONSTRAINT IF EXISTS odds_eventid_oddid_line_unique;

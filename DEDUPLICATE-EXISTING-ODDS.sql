-- DEDUPLICATE EXISTING ODDS AND MONEYLINES
-- Run this BEFORE installing triggers to clean up existing duplicates

-- ===================================================================
-- STEP 1: DEDUPLICATE ODDS TABLE (keep newest records)
-- ===================================================================

-- Remove duplicate odds (keep the newest fetched_at for each combination)
WITH odds_duplicates AS (
  SELECT 
    id,
    eventid,
    oddid,
    sideid,
    line,
    fetched_at,
    ROW_NUMBER() OVER (
      PARTITION BY eventid, oddid, sideid, line 
      ORDER BY fetched_at DESC
    ) as rn
  FROM public.odds
),
odds_to_delete AS (
  SELECT id 
  FROM odds_duplicates 
  WHERE rn > 1
)
DELETE FROM public.odds 
WHERE id IN (SELECT id FROM odds_to_delete);

-- Show results
SELECT 'ODDS TABLE: Removed duplicate records, kept newest for each combination' as status;

-- ===================================================================
-- STEP 2: DEDUPLICATE OPEN_ODDS TABLE (keep oldest records)  
-- ===================================================================

-- Remove duplicate open_odds (keep the oldest fetched_at for each combination)
WITH open_odds_duplicates AS (
  SELECT 
    id,
    eventid,
    oddid,
    sideid,
    line,
    fetched_at,
    ROW_NUMBER() OVER (
      PARTITION BY eventid, oddid, sideid, line 
      ORDER BY fetched_at ASC
    ) as rn
  FROM public.open_odds
),
open_odds_to_delete AS (
  SELECT id 
  FROM open_odds_duplicates 
  WHERE rn > 1
)
DELETE FROM public.open_odds 
WHERE id IN (SELECT id FROM open_odds_to_delete);

-- Show results
SELECT 'OPEN_ODDS TABLE: Removed duplicate records, kept oldest for each combination' as status;

-- ===================================================================
-- STEP 3: SPECIAL MONEYLINE DEDUPLICATION (if needed)
-- ===================================================================

-- Additional cleanup for moneyline duplicates specifically
WITH moneyline_odds_duplicates AS (
  SELECT 
    id,
    eventid,
    oddid,
    sideid,
    line,
    fetched_at,
    marketname,
    ROW_NUMBER() OVER (
      PARTITION BY eventid, oddid, sideid, line 
      ORDER BY fetched_at DESC
    ) as rn
  FROM public.odds
  WHERE marketname = 'Moneyline' OR marketname = 'moneyline'
),
moneyline_odds_to_delete AS (
  SELECT id 
  FROM moneyline_odds_duplicates 
  WHERE rn > 1
)
DELETE FROM public.odds 
WHERE id IN (SELECT id FROM moneyline_odds_to_delete);

-- Moneyline cleanup for open_odds
WITH moneyline_open_odds_duplicates AS (
  SELECT 
    id,
    eventid,
    oddid,
    sideid,
    line,
    fetched_at,
    marketname,
    ROW_NUMBER() OVER (
      PARTITION BY eventid, oddid, sideid, line 
      ORDER BY fetched_at ASC
    ) as rn
  FROM public.open_odds
  WHERE marketname = 'Moneyline' OR marketname = 'moneyline'
),
moneyline_open_odds_to_delete AS (
  SELECT id 
  FROM moneyline_open_odds_duplicates 
  WHERE rn > 1
)
DELETE FROM public.open_odds 
WHERE id IN (SELECT id FROM moneyline_open_odds_to_delete);

-- Show results
SELECT 'MONEYLINE CLEANUP: Removed moneyline duplicates from both tables' as status;

-- ===================================================================
-- STEP 4: VERIFICATION
-- ===================================================================

-- Check for remaining duplicates in odds
SELECT 
  'ODDS DUPLICATES REMAINING' as check_type,
  COUNT(*) as duplicate_count
FROM (
  SELECT eventid, oddid, sideid, line, COUNT(*) as cnt
  FROM public.odds
  GROUP BY eventid, oddid, sideid, line
  HAVING COUNT(*) > 1
) remaining_odds_dupes;

-- Check for remaining duplicates in open_odds
SELECT 
  'OPEN_ODDS DUPLICATES REMAINING' as check_type,
  COUNT(*) as duplicate_count
FROM (
  SELECT eventid, oddid, sideid, line, COUNT(*) as cnt
  FROM public.open_odds
  GROUP BY eventid, oddid, sideid, line
  HAVING COUNT(*) > 1
) remaining_open_odds_dupes;

-- Check moneyline duplicates specifically
SELECT 
  'MONEYLINE DUPLICATES REMAINING' as check_type,
  COUNT(*) as duplicate_count
FROM (
  SELECT eventid, oddid, sideid, line, COUNT(*) as cnt
  FROM public.odds
  WHERE marketname = 'Moneyline' OR marketname = 'moneyline'
  GROUP BY eventid, oddid, sideid, line
  HAVING COUNT(*) > 1
) remaining_moneyline_dupes;

SELECT 'SUCCESS: Deduplication complete! Now you can install the triggers.' as final_status;

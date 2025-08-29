-- Add unique constraint on (eventid, oddid) to support upsert operations
-- This ensures that we can properly update existing odds records instead of creating duplicates

-- First, remove any duplicate records that might exist
-- Keep the most recent record for each (eventid, oddid) combination
DELETE FROM odds
WHERE id NOT IN (
  SELECT DISTINCT ON (eventid, oddid) id
  FROM odds
  ORDER BY eventid, oddid, fetched_at DESC
);

-- Now add the unique constraint
ALTER TABLE odds ADD CONSTRAINT odds_eventid_oddid_unique UNIQUE (eventid, oddid);

-- Add index for performance on the composite key
CREATE INDEX IF NOT EXISTS idx_odds_eventid_oddid ON odds USING btree (eventid, oddid);

-- Update the existing indexes comment for clarity
COMMENT ON INDEX idx_odds_eventid_oddid IS 'Composite unique index for upsert operations on (eventid, oddid)';
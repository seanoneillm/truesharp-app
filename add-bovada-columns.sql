-- Add Bovada sportsbook columns to odds and open_odds tables
ALTER TABLE odds ADD COLUMN IF NOT EXISTS bovadaodds numeric(10, 2) null;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS bovadalink text null;

-- Add the same columns to open_odds table
ALTER TABLE open_odds ADD COLUMN IF NOT EXISTS bovadaodds numeric(10, 2) null;
ALTER TABLE open_odds ADD COLUMN IF NOT EXISTS bovadalink text null;

-- Add comments to explain the bovada columns
COMMENT ON COLUMN odds.bovadaodds IS 'Bovada sportsbook odds';
COMMENT ON COLUMN odds.bovadalink IS 'Bovada sportsbook deep link';
COMMENT ON COLUMN open_odds.bovadaodds IS 'Bovada sportsbook odds (opening line)';
COMMENT ON COLUMN open_odds.bovadalink IS 'Bovada sportsbook deep link (opening line)';
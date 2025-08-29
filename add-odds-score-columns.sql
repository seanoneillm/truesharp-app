-- Add new score columns for bet settlement
-- These columns will store game results for different types of bets

-- Add hometeam_score and awayteam_score columns if they don't exist
ALTER TABLE odds ADD COLUMN IF NOT EXISTS hometeam_score character varying;
ALTER TABLE odds ADD COLUMN IF NOT EXISTS awayteam_score character varying;

-- Add comments to explain the score columns
COMMENT ON COLUMN odds.score IS 'Combined/total score for over/under bets and general outcomes';
COMMENT ON COLUMN odds.hometeam_score IS 'Home team final score for moneyline/spread bets';
COMMENT ON COLUMN odds.awayteam_score IS 'Away team final score for moneyline/spread bets';

-- Add index for performance when querying unsettled odds
CREATE INDEX IF NOT EXISTS idx_odds_unsettled ON odds USING btree (eventid) 
WHERE score IS NULL AND hometeam_score IS NULL AND awayteam_score IS NULL;

COMMENT ON INDEX idx_odds_unsettled IS 'Index for finding unsettled odds that need score updates';
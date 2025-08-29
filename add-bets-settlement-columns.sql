-- Add missing columns to bets table for settlement functionality
-- These columns are needed for the settle-bets function to work properly

-- Add status column for bet settlement (if not exists)
ALTER TABLE bets ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'pending';

-- Add oddid column to link bets to odds records (if not exists)  
ALTER TABLE bets ADD COLUMN IF NOT EXISTS oddid character varying;

-- Add side column for bet side (home/away/over/under) (if not exists)
ALTER TABLE bets ADD COLUMN IF NOT EXISTS side character varying;

-- Add game_id column to link to games table (if not exists)
ALTER TABLE bets ADD COLUMN IF NOT EXISTS game_id character varying;

-- Add settled_at timestamp (if not exists)
ALTER TABLE bets ADD COLUMN IF NOT EXISTS settled_at timestamp with time zone;

-- Add profit column for calculated profit/loss (if not exists) 
ALTER TABLE bets ADD COLUMN IF NOT EXISTS profit numeric;

-- Update existing bets to have proper status if null
UPDATE bets SET status = 'pending' WHERE status IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets (status);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets (game_id);
CREATE INDEX IF NOT EXISTS idx_bets_oddid ON bets (oddid);

-- Add comments
COMMENT ON COLUMN bets.status IS 'Bet settlement status: pending, won, lost, void';
COMMENT ON COLUMN bets.oddid IS 'Links to odds.oddid for settlement lookup';
COMMENT ON COLUMN bets.side IS 'Bet side: home, away, over, under';
COMMENT ON COLUMN bets.game_id IS 'Links to games.id for game lookup';
COMMENT ON COLUMN bets.settled_at IS 'Timestamp when bet was settled';
COMMENT ON COLUMN bets.profit IS 'Calculated profit/loss amount';
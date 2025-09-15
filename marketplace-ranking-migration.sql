-- Marketplace Ranking System Migration
-- Run this SQL to add the marketplace_rank_score column to your strategy_leaderboard table

-- Add the marketplace_rank_score column
ALTER TABLE strategy_leaderboard 
ADD COLUMN IF NOT EXISTS marketplace_rank_score DECIMAL(10,4) DEFAULT 0;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_strategy_leaderboard_marketplace_rank_score 
ON strategy_leaderboard (marketplace_rank_score DESC);

-- Add a composite index for the new sorting strategy
CREATE INDEX IF NOT EXISTS idx_strategy_leaderboard_ranking_sort 
ON strategy_leaderboard (overall_rank ASC, marketplace_rank_score DESC);

-- Update existing records with calculated marketplace_rank_score
-- (This is a basic calculation - replace with your actual ranking algorithm)
UPDATE strategy_leaderboard 
SET marketplace_rank_score = (
    -- Basic scoring formula as placeholder
    -- Replace this with your actual marketplace ranking calculation
    CASE 
        WHEN total_bets >= 20 THEN
            (roi_percentage * 0.4) +                    -- ROI weight
            (win_rate * 100 * 0.3) +                    -- Win rate weight 
            (LEAST(total_bets / 10, 10) * 0.2) +        -- Volume weight (capped at 100 bets)
            (CASE WHEN is_verified_seller THEN 5 ELSE 0 END * 0.1) -- Verification bonus
        ELSE 0
    END
)
WHERE marketplace_rank_score = 0 OR marketplace_rank_score IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN strategy_leaderboard.marketplace_rank_score IS 
'Calculated marketplace ranking score based on ROI, consistency, volume, and verification status. Updated by ranking algorithm.';

-- Verify the migration
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'strategy_leaderboard' 
    AND column_name = 'marketplace_rank_score';

-- Preview the updated ranking
SELECT 
    strategy_name,
    username,
    overall_rank,
    marketplace_rank_score,
    roi_percentage,
    win_rate,
    total_bets,
    is_verified_seller
FROM strategy_leaderboard 
WHERE is_monetized = true
ORDER BY overall_rank ASC, marketplace_rank_score DESC
LIMIT 10;
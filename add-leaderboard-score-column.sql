-- Add leaderboard_score column to strategy_leaderboard table
ALTER TABLE public.strategy_leaderboard 
ADD COLUMN IF NOT EXISTS leaderboard_score numeric(8, 2) NULL;

-- Add index for leaderboard_score for efficient sorting
CREATE INDEX IF NOT EXISTS idx_strategy_leaderboard_score_desc 
ON public.strategy_leaderboard USING btree (leaderboard_score DESC) 
TABLESPACE pg_default;

-- Add comment for documentation
COMMENT ON COLUMN public.strategy_leaderboard.leaderboard_score 
IS 'Composite algorithm score: ROI (40%) + Win Rate (25%) + Volume (20%) + Maturity (10%) + Activity (5%)';
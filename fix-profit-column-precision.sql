-- Fix profit column precision to handle larger values
-- Current: DECIMAL(5,2) allows -999.99 to 999.99
-- Updated: DECIMAL(10,2) allows -99,999,999.99 to 99,999,999.99
-- 
-- Need to handle materialized view dependencies

-- Step 1: Check what views depend on the profit column
SELECT schemaname, matviewname, definition 
FROM pg_matviews 
WHERE definition ILIKE '%profit%';

-- Step 2: Drop the materialized view that depends on profit column
DROP MATERIALIZED VIEW IF EXISTS analytics.mv_daily_user_perf;

-- Step 3: Now alter the columns
ALTER TABLE bets ALTER COLUMN profit TYPE DECIMAL(10,2);
ALTER TABLE bets ALTER COLUMN stake TYPE DECIMAL(10,2);
ALTER TABLE bets ALTER COLUMN potential_payout TYPE DECIMAL(10,2);

-- Step 4: Recreate the materialized view (you'll need to adjust this based on the original definition)
-- First, let's find the original definition
-- You can get this by running: 
-- SELECT definition FROM pg_matviews WHERE matviewname = 'mv_daily_user_perf';
-- 
-- For now, here's a basic recreate statement - you may need to adjust:

CREATE MATERIALIZED VIEW analytics.mv_daily_user_perf AS
SELECT 
    user_id,
    DATE(placed_at) as bet_date,
    COUNT(*) as total_bets,
    SUM(stake) as total_stake,
    SUM(CASE WHEN status = 'won' THEN profit ELSE 0 END) as total_winnings,
    SUM(CASE WHEN status = 'lost' THEN profit ELSE 0 END) as total_losses,
    SUM(profit) as net_profit,
    AVG(profit) as avg_profit_per_bet,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as wins,
    COUNT(CASE WHEN status = 'lost' THEN 1 END) as losses,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM bets 
WHERE placed_at IS NOT NULL
GROUP BY user_id, DATE(placed_at);

-- Create index on the materialized view for performance
CREATE INDEX IF NOT EXISTS idx_mv_daily_user_perf_user_date 
ON analytics.mv_daily_user_perf (user_id, bet_date);

-- Refresh the materialized view with data
REFRESH MATERIALIZED VIEW analytics.mv_daily_user_perf;

-- Step 5: Verify the changes
SELECT 
    column_name, 
    data_type, 
    numeric_precision, 
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'bets' 
AND column_name IN ('profit', 'stake', 'potential_payout');
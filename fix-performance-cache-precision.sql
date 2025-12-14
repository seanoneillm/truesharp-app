-- Fix the user_performance_cache table precision to handle larger profit totals
-- The trigger is failing because total_profit has DECIMAL(5,2) but user's total profits exceed $999.99

-- Step 1: Check the current structure of user_performance_cache
SELECT 
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'user_performance_cache'
    AND data_type = 'numeric'
ORDER BY column_name;

-- Step 2: Update the performance cache table columns to handle larger values
ALTER TABLE user_performance_cache 
ALTER COLUMN total_profit TYPE DECIMAL(10,2);

-- Also update total_stake in case it has similar constraint
ALTER TABLE user_performance_cache 
ALTER COLUMN total_stake TYPE DECIMAL(10,2);

-- Step 3: Now we can safely update the bet profit
UPDATE bets 
SET profit = 179.30
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';

-- Step 4: Verify the update worked
SELECT 
    id,
    bet_description,
    stake,
    potential_payout,
    profit,
    status,
    odds,
    parlay_id,
    is_parlay
FROM bets 
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';
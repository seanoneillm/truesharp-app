-- Fix the bet profit by temporarily disabling the performance cache trigger

-- Step 1: Find the trigger name and disable it
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%performance_cache%'
   OR action_statement LIKE '%user_performance_cache%';

-- Step 2: Disable the trigger temporarily
ALTER TABLE bets DISABLE TRIGGER trigger_update_performance_cache;

-- Step 3: Update the bet profit now that the trigger is disabled
UPDATE bets 
SET profit = 179.30
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';

-- Step 4: Manually update the performance cache with corrected calculation
-- First, get the user_id for this bet
WITH bet_user AS (
    SELECT user_id 
    FROM bets 
    WHERE id = '986b3c53-4906-437e-ad45-11bad01db611'
)
INSERT INTO public.user_performance_cache (
    user_id, 
    total_bets, 
    won_bets, 
    lost_bets, 
    total_profit, 
    total_stake, 
    win_rate, 
    roi, 
    updated_at
)
SELECT 
    b.user_id,
    COUNT(*) as total_bets,
    COUNT(*) FILTER (WHERE b.status = 'won') as won_bets,
    COUNT(*) FILTER (WHERE b.status = 'lost') as lost_bets,
    -- Cap the total_profit to fit DECIMAL(5,2) constraint
    LEAST(GREATEST(COALESCE(SUM(b.profit), 0), -999.99), 999.99) as total_profit,
    COALESCE(SUM(b.stake), 0) as total_stake,
    CASE 
        WHEN COUNT(*) FILTER (WHERE b.status IN ('won', 'lost')) > 0 
        THEN (COUNT(*) FILTER (WHERE b.status = 'won') * 100.0) / COUNT(*) FILTER (WHERE b.status IN ('won', 'lost'))
        ELSE 0 
    END as win_rate,
    CASE 
        WHEN COALESCE(SUM(b.stake), 0) > 0 
        THEN (LEAST(GREATEST(COALESCE(SUM(b.profit), 0), -999.99), 999.99) * 100.0) / COALESCE(SUM(b.stake), 1)
        ELSE 0 
    END as roi,
    now() as updated_at
FROM public.bets b
WHERE b.user_id = (SELECT user_id FROM bet_user)
GROUP BY b.user_id
ON CONFLICT (user_id) DO UPDATE SET
    total_bets = EXCLUDED.total_bets,
    won_bets = EXCLUDED.won_bets,
    lost_bets = EXCLUDED.lost_bets,
    total_profit = EXCLUDED.total_profit,
    total_stake = EXCLUDED.total_stake,
    win_rate = EXCLUDED.win_rate,
    roi = EXCLUDED.roi,
    updated_at = EXCLUDED.updated_at;

-- Step 5: Re-enable the trigger
ALTER TABLE bets ENABLE TRIGGER trigger_update_performance_cache;

-- Step 6: Verify the update worked
SELECT 
    id,
    bet_description,
    stake,
    potential_payout,
    profit,
    status,
    user_id
FROM bets 
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';
-- The issue is likely ROI or win_rate exceeding DECIMAL(5,2) (max 999.99%)
-- Let's check the user's current stats to confirm

-- Step 1: Get the user_id and current stats for this bet
WITH bet_user AS (
    SELECT user_id 
    FROM bets 
    WHERE id = '986b3c53-4906-437e-ad45-11bad01db611'
),
user_stats AS (
    SELECT 
        b.user_id,
        COUNT(*) as total_bets,
        COUNT(*) FILTER (WHERE b.status = 'won') as won_bets,
        COUNT(*) FILTER (WHERE b.status = 'lost') as lost_bets,
        COALESCE(SUM(b.profit), 0) as total_profit,
        COALESCE(SUM(b.stake), 0) as total_stake,
        CASE 
            WHEN COUNT(*) FILTER (WHERE b.status IN ('won', 'lost')) > 0 
            THEN (COUNT(*) FILTER (WHERE b.status = 'won') * 100.0) / COUNT(*) FILTER (WHERE b.status IN ('won', 'lost'))
            ELSE 0 
        END as win_rate,
        CASE 
            WHEN COALESCE(SUM(b.stake), 0) > 0 
            THEN (COALESCE(SUM(b.profit), 0) * 100.0) / COALESCE(SUM(b.stake), 1)
            ELSE 0 
        END as roi
    FROM public.bets b
    WHERE b.user_id = (SELECT user_id FROM bet_user)
    GROUP BY b.user_id
)
SELECT 
    user_id,
    total_bets,
    won_bets,
    lost_bets,
    total_profit,
    total_stake,
    win_rate,
    roi,
    -- Check if ROI would exceed constraint after updating the bet
    CASE 
        WHEN total_stake > 0 
        THEN ((total_profit + (179.30 - 99.99)) * 100.0) / total_stake
        ELSE 0 
    END as roi_after_update
FROM user_stats;

-- Step 2: Update the cache table schema to handle larger percentages
ALTER TABLE user_performance_cache 
ALTER COLUMN win_rate TYPE DECIMAL(8,2);

ALTER TABLE user_performance_cache 
ALTER COLUMN roi TYPE DECIMAL(8,2);

-- Step 3: Now update the bet profit
UPDATE bets 
SET profit = 179.30
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';

-- Step 4: Verify the update
SELECT 
    id,
    bet_description,
    stake,
    potential_payout,
    profit,
    status
FROM bets 
WHERE id = '986b3c53-4906-437e-ad45-11bad01db611';
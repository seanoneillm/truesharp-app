-- SQL script to insert test open bets for demonstration
-- Replace 'your-user-id' with the actual user_id from your profiles table

-- First, let's get a valid user_id (replace with actual user_id)
-- SELECT id, email FROM profiles WHERE email = 'derek.shorter@truesharp.io';

-- Insert test bets with pending status and future game dates
INSERT INTO bets (
    user_id,
    sport,
    league,
    home_team,
    away_team,
    bet_type,
    bet_description,
    line_value,
    odds,
    stake,
    potential_payout,
    status,
    placed_at,
    game_date,
    sportsbook,
    bet_source,
    side
) VALUES 
(
    -- Replace with actual user_id from profiles table
    (SELECT id FROM profiles WHERE email = 'derek.shorter@truesharp.io' LIMIT 1),
    'MLB',
    'Major League Baseball',
    'Yankees',
    'Red Sox',
    'spread',
    'Red Sox +1.5',
    1.5,
    -110,
    100.00,
    190.91,
    'pending',
    NOW(),
    NOW() + INTERVAL '1 day', -- Tomorrow
    'DraftKings',
    'manual',
    'away'
),
(
    -- Replace with actual user_id from profiles table
    (SELECT id FROM profiles WHERE email = 'derek.shorter@truesharp.io' LIMIT 1),
    'MLB',
    'Major League Baseball',
    'Dodgers',
    'Giants',
    'total',
    'Over 8.5',
    8.5,
    105,
    50.00,
    102.50,
    'pending',
    NOW(),
    NOW() + INTERVAL '2 days', -- Day after tomorrow
    'FanDuel',
    'manual',
    'over'
);

-- Now link these bets to strategies via strategy_bets table
-- First, let's get the bet IDs we just created
-- Replace strategy IDs with actual ones from your subscriptions

WITH new_bets AS (
    SELECT id as bet_id FROM bets 
    WHERE user_id = (SELECT id FROM profiles WHERE email = 'derek.shorter@truesharp.io' LIMIT 1)
    AND status = 'pending' 
    AND game_date > NOW()
    ORDER BY created_at DESC 
    LIMIT 2
),
target_strategies AS (
    SELECT unnest(ARRAY[
        'e09dd1be-d68b-4fcc-a391-a186d68f6dab',  -- MLB Run Lines
        'c867d015-75fa-4563-b695-b6756376aa3d'   -- MLB totals
    ]) as strategy_id
)
INSERT INTO strategy_bets (strategy_id, bet_id)
SELECT 
    ts.strategy_id,
    nb.bet_id
FROM target_strategies ts
CROSS JOIN new_bets nb
ON CONFLICT (strategy_id, bet_id) DO NOTHING;

-- Verify the results
SELECT 
    s.name as strategy_name,
    b.bet_description,
    b.odds,
    b.game_date,
    b.status
FROM strategy_bets sb
JOIN strategies s ON s.id = sb.strategy_id
JOIN bets b ON b.id = sb.bet_id
WHERE b.status = 'pending' 
AND b.game_date > NOW()
ORDER BY s.name, b.game_date;
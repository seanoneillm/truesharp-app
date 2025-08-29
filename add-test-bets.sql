-- Add test bets for strategy sharing functionality
-- Replace 'your-user-id' with your actual user ID from profiles table
-- Replace 'strategy-id' with one of your strategy IDs

-- First, let's add some test bets to the bets table
INSERT INTO bets (
  user_id,
  sport,
  league,
  bet_type,
  bet_description,
  odds,
  stake,
  potential_payout,
  status,
  placed_at,
  game_date,
  home_team,
  away_team,
  line_value,
  strategy_id,
  sportsbook
) VALUES 
-- Test bet 1 - NBA game
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',  -- your user_id
  'basketball',
  'NBA',
  'spread',
  'Lakers -5.5',
  -110,
  50.00,
  95.45,
  'pending',
  NOW(),
  NOW() + INTERVAL '2 hours',  -- Game in 2 hours (future)
  'Los Angeles Lakers',
  'Boston Celtics',
  -5.5,
  'e09dd1be-d68b-4fcc-a391-a186d68f6dab',  -- strategy_id
  'DraftKings'
),
-- Test bet 2 - NFL game  
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'football',
  'NFL',
  'moneyline',
  'Chiefs ML',
  -150,
  100.00,
  166.67,
  'pending',
  NOW(),
  NOW() + INTERVAL '3 days',  -- Game in 3 days (future)
  'Kansas City Chiefs',
  'Buffalo Bills',
  NULL,
  'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
  'FanDuel'
),
-- Test bet 3 - MLB total
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'baseball',
  'MLB',
  'total',
  'Yankees vs Red Sox Over 9.5',
  +105,
  75.00,
  153.75,
  'pending',
  NOW(),
  NOW() + INTERVAL '1 day',  -- Game tomorrow (future)
  'New York Yankees',
  'Boston Red Sox',
  9.5,
  'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
  'BetMGM'
);

-- Verify the bets were added
SELECT 
  id,
  sport,
  league,
  bet_description,
  odds,
  status,
  game_date,
  strategy_id
FROM bets 
WHERE strategy_id = 'e09dd1be-d68b-4fcc-a391-a186d68f6dab'
ORDER BY created_at DESC;
-- Add test bets with far future dates for testing share functionality
-- These will be valid for several days

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
  sportsbook,
  strategy_id,  -- Link directly to the strategy you want to test
  created_at
) VALUES 
-- Test bet 1 - Next week NBA
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'basketball',
  'NBA',
  'spread',
  'Lakers -6.5',
  -110,
  100.00,
  190.91,
  'pending',
  NOW(),
  NOW() + INTERVAL '7 days',              -- Game in 1 WEEK (far future)
  'Los Angeles Lakers',
  'Boston Celtics',
  -6.5,
  'DraftKings',
  'e09dd1be-d68b-4fcc-a391-a186d68f6dab',  -- Link to the strategy you want to test sharing
  NOW()
),
-- Test bet 2 - Next weekend NFL
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'football',
  'NFL',
  'moneyline',
  'Chiefs ML',
  -140,
  50.00,
  85.71,
  'pending',
  NOW(),
  NOW() + INTERVAL '9 days',              -- Game in 9 DAYS (far future)
  'Kansas City Chiefs',
  'Buffalo Bills',
  NULL,
  'FanDuel',
  'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
  NOW()
),
-- Test bet 3 - Next week MLB
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'baseball',
  'MLB',
  'total',
  'Yankees vs Red Sox Over 8.5',
  +110,
  75.00,
  157.50,
  'pending',
  NOW(),
  NOW() + INTERVAL '5 days',              -- Game in 5 DAYS (far future)
  'New York Yankees',
  'Boston Red Sox',
  8.5,
  'BetMGM',
  'e09dd1be-d68b-4fcc-a391-a186d68f6dab',
  NOW()
);

-- Verify the new bets
SELECT 
  id,
  sport,
  bet_description,
  odds,
  status,
  game_date,
  strategy_id,
  EXTRACT(DAY FROM (game_date - NOW())) as days_in_future
FROM bets 
WHERE user_id = '28991397-dae7-42e8-a822-0dffc6ff49b7'
  AND status = 'pending'
  AND game_date > NOW()
  AND strategy_id = 'e09dd1be-d68b-4fcc-a391-a186d68f6dab'
ORDER BY game_date;
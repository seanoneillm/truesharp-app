-- Insert actual test bets for your user account
-- These will show up in the share modal

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
  created_at
) VALUES 
-- Test bet 1 - Tomorrow's NBA game
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',  -- Your user_id
  'basketball',
  'NBA',
  'spread',
  'Lakers -5.5',
  -110,
  100.00,
  190.91,
  'pending',                               -- PENDING status
  NOW(),
  NOW() + INTERVAL '1 day',               -- Game TOMORROW (future)
  'Los Angeles Lakers',
  'Boston Celtics',
  -5.5,
  'DraftKings',
  NOW()
),
-- Test bet 2 - Weekend NFL game
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'football',
  'NFL',
  'moneyline',
  'Chiefs ML',
  -150,
  50.00,
  83.33,
  'pending',                               -- PENDING status
  NOW(),
  NOW() + INTERVAL '3 days',              -- Game in 3 DAYS (future)
  'Kansas City Chiefs',
  'Buffalo Bills',
  NULL,
  'FanDuel',
  NOW()
),
-- Test bet 3 - Tonight's MLB game
(
  '28991397-dae7-42e8-a822-0dffc6ff49b7',
  'baseball',
  'MLB',
  'total',
  'Yankees vs Red Sox Over 9.5',
  +105,
  75.00,
  153.75,
  'pending',                               -- PENDING status
  NOW(),
  NOW() + INTERVAL '4 hours',             -- Game TONIGHT (future)
  'New York Yankees',
  'Boston Red Sox',
  9.5,
  'BetMGM',
  NOW()
);

-- Verify the bets were inserted
SELECT 
  id,
  sport,
  bet_description,
  odds,
  status,
  game_date,
  user_id
FROM bets 
WHERE user_id = '28991397-dae7-42e8-a822-0dffc6ff49b7'
  AND status = 'pending'
  AND game_date > NOW()
ORDER BY game_date;
-- Test Script for Parlay-Aware Strategy Leaderboard Calculations
-- This script validates that parlays are counted as single betting units

-- Test data setup (run these inserts in a transaction for testing)
BEGIN;

-- Create test strategy if not exists
INSERT INTO strategy_leaderboard (
  strategy_id, user_id, strategy_name, username, 
  total_bets, winning_bets, losing_bets, push_bets,
  roi_percentage, win_rate
) VALUES (
  'test-strategy-123'::uuid, 'test-user-456'::uuid, 
  'Test Strategy', 'testuser',
  0, 0, 0, 0, 0, 0
) ON CONFLICT (strategy_id) DO NOTHING;

-- Test Case 1: Single Bets (should count each bet individually)
-- Insert 3 single bets: 2 wins, 1 loss
INSERT INTO bets (id, user_id, bet_type, bet_description, odds, stake, potential_payout, status, placed_at, game_date, is_parlay) VALUES
('single-bet-1'::uuid, 'test-user-456'::uuid, 'moneyline', 'Team A ML', 150, 100, 250, 'won', NOW(), NOW() + INTERVAL '1 day', false),
('single-bet-2'::uuid, 'test-user-456'::uuid, 'spread', 'Team B -3.5', -110, 100, 190.91, 'won', NOW(), NOW() + INTERVAL '1 day', false),
('single-bet-3'::uuid, 'test-user-456'::uuid, 'total', 'Over 45.5', -105, 100, 195.24, 'lost', NOW(), NOW() + INTERVAL '1 day', false);

INSERT INTO strategy_bets (strategy_id, bet_id) VALUES
('test-strategy-123'::uuid, 'single-bet-1'::uuid),
('test-strategy-123'::uuid, 'single-bet-2'::uuid),
('test-strategy-123'::uuid, 'single-bet-3'::uuid);

-- Test Case 2: 3-leg Parlay (should count as 1 betting unit)
-- All legs win = parlay wins
INSERT INTO bets (id, user_id, bet_type, bet_description, odds, stake, potential_payout, status, placed_at, game_date, is_parlay, parlay_id) VALUES
('parlay-1-leg-1'::uuid, 'test-user-456'::uuid, 'moneyline', 'Team C ML', 120, 33.33, 40, 'won', NOW(), NOW() + INTERVAL '2 days', true, 'parlay-1'::uuid),
('parlay-1-leg-2'::uuid, 'test-user-456'::uuid, 'spread', 'Team D -2.5', -110, 33.33, 30.30, 'won', NOW(), NOW() + INTERVAL '2 days', true, 'parlay-1'::uuid),
('parlay-1-leg-3'::uuid, 'test-user-456'::uuid, 'total', 'Under 52.5', 105, 33.34, 35.00, 'won', NOW(), NOW() + INTERVAL '2 days', true, 'parlay-1'::uuid);

INSERT INTO strategy_bets (strategy_id, bet_id, parlay_id) VALUES
('test-strategy-123'::uuid, 'parlay-1-leg-1'::uuid, 'parlay-1'::uuid),
('test-strategy-123'::uuid, 'parlay-1-leg-2'::uuid, 'parlay-1'::uuid),
('test-strategy-123'::uuid, 'parlay-1-leg-3'::uuid, 'parlay-1'::uuid);

-- Test Case 3: 2-leg Parlay (should count as 1 betting unit)
-- One leg loses = parlay loses
INSERT INTO bets (id, user_id, bet_type, bet_description, odds, stake, potential_payout, status, placed_at, game_date, is_parlay, parlay_id) VALUES
('parlay-2-leg-1'::uuid, 'test-user-456'::uuid, 'moneyline', 'Team E ML', -150, 50, 83.33, 'won', NOW(), NOW() + INTERVAL '3 days', true, 'parlay-2'::uuid),
('parlay-2-leg-2'::uuid, 'test-user-456'::uuid, 'spread', 'Team F +7.5', -110, 50, 45.45, 'lost', NOW(), NOW() + INTERVAL '3 days', true, 'parlay-2'::uuid);

INSERT INTO strategy_bets (strategy_id, bet_id, parlay_id) VALUES
('test-strategy-123'::uuid, 'parlay-2-leg-1'::uuid, 'parlay-2'::uuid),
('test-strategy-123'::uuid, 'parlay-2-leg-2'::uuid, 'parlay-2'::uuid);

-- Trigger the leaderboard calculation
UPDATE strategy_bets SET updated_at = NOW() WHERE strategy_id = 'test-strategy-123'::uuid LIMIT 1;

-- Validate results
SELECT 
  'Expected vs Actual Betting Units' as test_description,
  6 as expected_total_bets, -- 3 single + 1 three-leg parlay + 1 two-leg parlay = 5 betting units
  total_bets as actual_total_bets,
  3 as expected_winning_bets, -- 2 single wins + 1 winning parlay = 3 wins
  winning_bets as actual_winning_bets,
  2 as expected_losing_bets, -- 1 single loss + 1 losing parlay = 2 losses
  losing_bets as actual_losing_bets,
  0 as expected_push_bets,
  push_bets as actual_push_bets
FROM strategy_leaderboard 
WHERE strategy_id = 'test-strategy-123'::uuid;

-- Detailed breakdown validation
SELECT 
  'Betting Unit Breakdown' as test_description,
  'Single Bets: 3 units (2 won, 1 lost)' as singles,
  'Parlay 1: 1 unit (won - all 3 legs won)' as parlay_1,
  'Parlay 2: 1 unit (lost - 1 leg lost)' as parlay_2,
  'Total: 5 betting units (3 won, 2 lost)' as total_summary;

-- ROI Calculation validation
WITH expected_roi AS (
  SELECT 
    -- Single bets profit: (250-100) + (190.91-100) + (-100) = 240.91
    -- Parlay 1 profit: Total parlay payout should be calculated properly
    -- Parlay 2 profit: -100 (total stake)
    -- Expected total stake: 300 (singles) + 100 (parlay1) + 100 (parlay2) = 500
    'ROI Calculation Details' as description
)
SELECT 
  sl.roi_percentage,
  sl.win_rate,
  'ROI should reflect parlay as single units' as note
FROM strategy_leaderboard sl
WHERE strategy_id = 'test-strategy-123'::uuid;

-- Clean up test data
ROLLBACK;

-- Instructions for actual implementation:
/*
1. First, backup your existing data:
   pg_dump -t strategy_leaderboard yourdb > strategy_leaderboard_backup.sql

2. Run the parlay-aware trigger script:
   \i parlay-aware-strategy-leaderboard-trigger.sql

3. Recalculate existing data:
   SELECT recalculate_all_strategy_leaderboard_with_parlays();

4. Validate results by checking a few known strategies:
   SELECT strategy_name, total_bets, winning_bets, losing_bets, roi_percentage, win_rate
   FROM strategy_leaderboard 
   ORDER BY total_bets DESC 
   LIMIT 10;

5. Compare with manual calculations for strategies with known parlays
*/
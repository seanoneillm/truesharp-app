-- Test Analytics Data Insert Script
-- This script creates a test user and sample betting data for analytics testing

-- First, let's insert a test user profile
-- Note: You'll need to replace 'test-user-id' with an actual auth user ID from Supabase Auth

-- Insert test profile (use this after creating a user through Supabase Auth)
-- INSERT INTO profiles (id, username, bio, profile_picture_url, email, is_seller, is_verified_seller, pro, public_profile)
-- VALUES ('YOUR_USER_ID_HERE', 'testuser', 'Test user for analytics', NULL, 'test@example.com', false, false, 'no', true)
-- ON CONFLICT (id) DO UPDATE SET 
--   username = EXCLUDED.username,
--   bio = EXCLUDED.bio,
--   updated_at = NOW();

-- Insert sample betting data for analytics testing
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID

-- Sample MLB bets
INSERT INTO bets (
  user_id, 
  external_bet_id, 
  sportsbook_id, 
  sport, 
  league, 
  bet_type, 
  bet_description, 
  odds, 
  stake, 
  potential_payout, 
  status, 
  profit, 
  home_team, 
  away_team, 
  placed_at,
  resolved_at
) VALUES
-- Won bets
('YOUR_USER_ID_HERE', 'test-1', 'draftkings', 'baseball', 'MLB', 'moneyline', 'Yankees ML', -150, 100, 166.67, 'won', 66.67, 'New York Yankees', 'Boston Red Sox', '2024-01-15 20:00:00', '2024-01-15 23:30:00'),
('YOUR_USER_ID_HERE', 'test-2', 'fanduel', 'baseball', 'MLB', 'spread', 'Dodgers -1.5', +110, 50, 105, 'won', 55, 'Los Angeles Dodgers', 'San Francisco Giants', '2024-01-14 19:00:00', '2024-01-14 22:45:00'),
('YOUR_USER_ID_HERE', 'test-3', 'caesars', 'baseball', 'MLB', 'total', 'Over 8.5', -110, 75, 143.18, 'won', 68.18, 'Houston Astros', 'Texas Rangers', '2024-01-13 20:30:00', '2024-01-13 23:15:00'),

-- Lost bets
('YOUR_USER_ID_HERE', 'test-4', 'betmgm', 'baseball', 'MLB', 'moneyline', 'Red Sox ML', +130, 100, 230, 'lost', -100, 'Boston Red Sox', 'New York Yankees', '2024-01-12 19:30:00', '2024-01-12 22:45:00'),
('YOUR_USER_ID_HERE', 'test-5', 'draftkings', 'baseball', 'MLB', 'spread', 'Giants +1.5', -120, 60, 110, 'lost', -60, 'San Francisco Giants', 'Los Angeles Dodgers', '2024-01-11 22:00:00', '2024-01-12 01:30:00'),

-- NBA bets
('YOUR_USER_ID_HERE', 'test-6', 'fanduel', 'basketball', 'NBA', 'moneyline', 'Lakers ML', +105, 80, 164, 'won', 84, 'Los Angeles Lakers', 'Boston Celtics', '2024-01-10 20:00:00', '2024-01-10 22:30:00'),
('YOUR_USER_ID_HERE', 'test-7', 'caesars', 'basketball', 'NBA', 'spread', 'Celtics -5.5', -110, 110, 210, 'lost', -110, 'Boston Celtics', 'Los Angeles Lakers', '2024-01-09 20:30:00', '2024-01-09 23:00:00'),
('YOUR_USER_ID_HERE', 'test-8', 'betmgm', 'basketball', 'NBA', 'total', 'Under 225.5', +100, 90, 180, 'won', 90, 'Golden State Warriors', 'Phoenix Suns', '2024-01-08 22:00:00', '2024-01-09 00:45:00'),

-- NFL bets  
('YOUR_USER_ID_HERE', 'test-9', 'draftkings', 'american_football', 'NFL', 'spread', 'Chiefs -7.5', -110, 120, 229.09, 'won', 109.09, 'Kansas City Chiefs', 'Denver Broncos', '2024-01-07 20:20:00', '2024-01-07 23:45:00'),
('YOUR_USER_ID_HERE', 'test-10', 'fanduel', 'american_football', 'NFL', 'moneyline', 'Bills ML', -180, 90, 140, 'won', 50, 'Buffalo Bills', 'Miami Dolphins', '2024-01-06 13:00:00', '2024-01-06 16:30:00'),

-- Pending bets
('YOUR_USER_ID_HERE', 'test-11', 'caesars', 'baseball', 'MLB', 'moneyline', 'Astros ML', -140, 70, 120, 'pending', 0, 'Houston Astros', 'Seattle Mariners', '2024-01-16 20:00:00', NULL),
('YOUR_USER_ID_HERE', 'test-12', 'betmgm', 'basketball', 'NBA', 'spread', 'Warriors -3.5', -105, 85, 165.95, 'pending', 0, 'Golden State Warriors', 'Los Angeles Clippers', '2024-01-16 22:30:00', NULL);

-- Instructions:
-- 1. Create a user account through the Supabase Auth UI or login page
-- 2. Get the user ID from the auth.users table in Supabase dashboard  
-- 3. Replace 'YOUR_USER_ID_HERE' with the actual user ID
-- 4. Run this script in the Supabase SQL editor
-- 5. The analytics page should now show data for this user

-- To check the data was inserted correctly:
-- SELECT user_id, sport, bet_type, status, stake, profit, placed_at 
-- FROM bets 
-- WHERE user_id = 'YOUR_USER_ID_HERE' 
-- ORDER BY placed_at DESC;

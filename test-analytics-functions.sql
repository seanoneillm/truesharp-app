-- Test script to verify analytics functions are working correctly
-- Run this to test the functions directly in your database

-- Test 1: Check if schema and functions exist
SELECT nspname FROM pg_namespace WHERE nspname = 'analytics';

SELECT proname, pronamespace::regnamespace 
FROM pg_proc 
WHERE pronamespace = 'analytics'::regnamespace;

-- Test 2: Test helper functions
SELECT analytics.american_to_prob(110) AS implied_prob_110;
SELECT analytics.american_to_prob(-110) AS implied_prob_neg_110;

-- Test 3: Check if we have any bets data to work with
SELECT COUNT(*) AS total_bets FROM bets;
SELECT COUNT(DISTINCT user_id) AS unique_users FROM bets;

-- Test 4: Test analytics functions with a real user ID (replace with actual user ID)
-- First, get a real user ID:
SELECT user_id FROM bets LIMIT 1;

-- Test 5: Test each function (replace 'your-user-id' with actual UUID)
-- SELECT * FROM analytics.roi_over_time('your-user-id'::uuid);
-- SELECT * FROM analytics.performance_by_league('your-user-id'::uuid);
-- SELECT * FROM analytics.winrate_vs_expected('your-user-id'::uuid);
-- SELECT * FROM analytics.monthly_performance('your-user-id'::uuid);

-- Test 6: Check materialized views
SELECT COUNT(*) FROM analytics.mv_daily_user_perf;
SELECT COUNT(*) FROM analytics.mv_monthly_user_perf;
SELECT COUNT(*) FROM analytics.mv_league_user_perf;
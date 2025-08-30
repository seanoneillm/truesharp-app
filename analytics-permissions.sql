-- Grant permissions for analytics functions to be accessible via Supabase RPC
-- Run this after running the main analytics-enhancement-fixed.sql

-- Grant usage on analytics schema to authenticated users
GRANT USAGE ON SCHEMA analytics TO authenticated;
GRANT USAGE ON SCHEMA analytics TO anon;

-- Grant execute permissions on all analytics functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO anon;

-- Grant select on materialized views if needed for direct access
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO anon;

-- If you have RLS enabled, you may need to create policies for the materialized views
-- ALTER TABLE analytics.mv_daily_user_perf ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own daily performance" ON analytics.mv_daily_user_perf
--   FOR SELECT USING (auth.uid() = user_id);

-- ALTER TABLE analytics.mv_monthly_user_perf ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own monthly performance" ON analytics.mv_monthly_user_perf
--   FOR SELECT USING (auth.uid() = user_id);

-- ALTER TABLE analytics.mv_league_user_perf ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own league performance" ON analytics.mv_league_user_perf
--   FOR SELECT USING (auth.uid() = user_id);

-- Test if functions are accessible
-- SELECT analytics.american_to_prob(110);
-- SELECT * FROM analytics.roi_over_time('00000000-0000-0000-0000-000000000000'::uuid);
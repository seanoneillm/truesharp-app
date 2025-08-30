-- TrueSharp Analytics Enhancement SQL (Fixed for Existing Schema)
-- Postgres / Supabase functions, materialized views and helpers that power analytics charts
-- Works with existing bets table schema - no schema changes required

-- 0) Create schema for analytics if desired
CREATE SCHEMA IF NOT EXISTS analytics;

-- 1) Helper: american odds -> implied probability (returns numeric 0..1)
CREATE OR REPLACE FUNCTION analytics.american_to_prob(odds integer)
RETURNS numeric 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT CASE
    WHEN odds IS NULL THEN NULL
    WHEN odds > 0 THEN 100.0 / (odds + 100.0)
    ELSE abs(odds) / (abs(odds) + 100.0)
  END;
$$;

-- 2) Helper: normalized net_profit using existing schema
-- Note: Using existing 'profit' column which already exists in your schema
CREATE OR REPLACE FUNCTION analytics.net_profit_for_bet(
  p_profit numeric,
  p_status text,
  p_potential_payout numeric,
  p_stake numeric
)
RETURNS numeric 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT COALESCE(p_profit,
                  CASE
                    WHEN p_status = 'won' THEN (p_potential_payout - p_stake)
                    WHEN p_status = 'lost' THEN -p_stake
                    ELSE 0
                  END);
$$;

-- 3) The league index already exists in your schema, so skip
-- 4) Additional composite indexes for performance (using existing columns)
CREATE INDEX IF NOT EXISTS idx_bets_user_placed_at ON public.bets USING btree (user_id, placed_at);
CREATE INDEX IF NOT EXISTS idx_bets_user_status ON public.bets USING btree (user_id, status);
CREATE INDEX IF NOT EXISTS idx_bets_user_league ON public.bets USING btree (user_id, league);

-- 5) Generic fetch_series RPC
CREATE OR REPLACE FUNCTION analytics.fetch_series(
  p_user uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_x_dim text DEFAULT 'date:day',
  p_y_metric text DEFAULT 'roi',
  p_bucket jsonb DEFAULT '{}'::jsonb,
  p_opts jsonb DEFAULT '{}'::jsonb
)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  _sql text;
  _where text := 'WHERE user_id = $1';
  rec record;
BEGIN
  -- Build dynamic where from p_filters (safe style: only include known keys)
  IF p_filters ? 'leagues' THEN
    _where := _where || ' AND league = ANY (SELECT jsonb_array_elements_text($2->''leagues''))';
  END IF;

  IF p_filters ? 'bet_types' THEN
    _where := _where || ' AND bet_type = ANY (SELECT jsonb_array_elements_text($2->''bet_types''))';
  END IF;

  IF p_filters ? 'date_from' THEN
    _where := _where || ' AND placed_at >= ($2->>''date_from'')::timestamptz';
  END IF;

  IF p_filters ? 'date_to' THEN
    _where := _where || ' AND placed_at <= ($2->>''date_to'')::timestamptz';
  END IF;

  -- Simple implementation for date-based ROI series
  IF p_x_dim LIKE 'date:%' AND p_y_metric = 'roi' THEN
    _sql := format('
      SELECT to_jsonb(t) FROM (
        SELECT date_trunc(%L, placed_at) as x,
               sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) as net_profit,
               sum(stake) as stake,
               CASE WHEN sum(stake) = 0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END as roi_pct,
               count(*) as bets
        FROM bets
        %s
        GROUP BY 1
        ORDER BY 1
      ) t',
      split_part(p_x_dim, ':', 2),
      _where
    );

    FOR rec IN EXECUTE _sql USING p_user, p_filters LOOP
      RETURN NEXT rec.to_jsonb;
    END LOOP;
  END IF;

  -- Fallback: return nothing to indicate caller should use a specialized RPC
  RETURN;
END;
$$;

-- 6) ROI Over Time RPC (daily buckets)
CREATE OR REPLACE FUNCTION analytics.roi_over_time(
  p_user uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_tz text DEFAULT 'UTC',
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE(day timestamptz, net_profit numeric, stake numeric, roi_pct numeric, bets int)
LANGUAGE sql 
STABLE
AS $$
WITH f AS (
  SELECT *
  FROM bets
  WHERE user_id = p_user
    AND (p_from IS NULL OR placed_at >= p_from AT TIME ZONE p_tz)
    AND (p_to IS NULL OR placed_at <= p_to AT TIME ZONE p_tz)
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (SELECT jsonb_array_elements_text(p_filters->'bet_types')::text[]))
    AND (NOT (p_filters ? 'leagues') OR league = ANY (SELECT jsonb_array_elements_text(p_filters->'leagues')::text[]))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (SELECT jsonb_array_elements_text(p_filters->'sportsbooks')::text[]))
    AND (NOT (p_filters ? 'odds_min') OR odds >= (p_filters->>'odds_min')::integer)
    AND (NOT (p_filters ? 'odds_max') OR odds <= (p_filters->>'odds_max')::integer)
    AND (NOT (p_filters ? 'stake_min') OR stake >= (p_filters->>'stake_min')::numeric)
    AND (NOT (p_filters ? 'stake_max') OR stake <= (p_filters->>'stake_max')::numeric)
    AND (NOT (p_filters ? 'is_parlay') OR is_parlay = (p_filters->>'is_parlay')::boolean)
    AND (NOT (p_filters ? 'side') OR side = (p_filters->>'side'))
)
SELECT date_trunc('day', placed_at AT TIME ZONE p_tz) AS day,
       sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       sum(stake) AS stake,
       CASE WHEN sum(stake) = 0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct,
       count(*)::int AS bets
FROM f
GROUP BY 1
ORDER BY 1;
$$;

-- 7) Performance by League (only show leagues with >= 10 bets)
CREATE OR REPLACE FUNCTION analytics.performance_by_league(
  p_user uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_tz text DEFAULT 'UTC',
  p_from timestamptz DEFAULT NULL,
  p_to timestamptz DEFAULT NULL
)
RETURNS TABLE(league text, bets int, stake numeric, net_profit numeric, roi_pct numeric)
LANGUAGE sql 
STABLE
AS $$
WITH f AS (
  SELECT *
  FROM bets
  WHERE user_id = p_user
    AND (p_from IS NULL OR placed_at >= p_from)
    AND (p_to IS NULL OR placed_at <= p_to)
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (SELECT jsonb_array_elements_text(p_filters->'bet_types')::text[]))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (SELECT jsonb_array_elements_text(p_filters->'sportsbooks')::text[]))
    AND (NOT (p_filters ? 'odds_min') OR odds >= (p_filters->>'odds_min')::integer)
    AND (NOT (p_filters ? 'odds_max') OR odds <= (p_filters->>'odds_max')::integer)
    AND (NOT (p_filters ? 'stake_min') OR stake >= (p_filters->>'stake_min')::numeric)
    AND (NOT (p_filters ? 'stake_max') OR stake <= (p_filters->>'stake_max')::numeric)
    AND (NOT (p_filters ? 'is_parlay') OR is_parlay = (p_filters->>'is_parlay')::boolean)
    AND (NOT (p_filters ? 'side') OR side = (p_filters->>'side'))
)
SELECT league,
       count(*)::int AS bets,
       sum(stake) AS stake,
       sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct
FROM f
WHERE league IS NOT NULL
GROUP BY league
HAVING count(*) >= 10
ORDER BY roi_pct DESC NULLS LAST;
$$;

-- 8) Win Rate vs Expected Win Rate RPC (odds buckets)
CREATE OR REPLACE FUNCTION analytics.winrate_vs_expected(
  p_user uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_bins int DEFAULT 10,
  p_min_bets int DEFAULT 5
)
RETURNS TABLE(bucket_label text, bucket_start_pct numeric, bucket_end_pct numeric, bets int, expected_pct numeric, actual_pct numeric)
LANGUAGE sql 
STABLE
AS $$
WITH f AS (
  SELECT *,
    analytics.american_to_prob(odds) AS implied_prob
  FROM bets
  WHERE user_id = p_user
    AND status IN ('won','lost')
    AND odds IS NOT NULL
    AND (NOT (p_filters ? 'leagues') OR league = ANY (SELECT jsonb_array_elements_text(p_filters->'leagues')::text[]))
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (SELECT jsonb_array_elements_text(p_filters->'bet_types')::text[]))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (SELECT jsonb_array_elements_text(p_filters->'sportsbooks')::text[]))
    AND (NOT (p_filters ? 'date_from') OR placed_at >= (p_filters->>'date_from')::timestamptz)
    AND (NOT (p_filters ? 'date_to') OR placed_at <= (p_filters->>'date_to')::timestamptz)
    AND (NOT (p_filters ? 'is_parlay') OR is_parlay = (p_filters->>'is_parlay')::boolean)
    AND (NOT (p_filters ? 'side') OR side = (p_filters->>'side'))
),
b AS (
  SELECT width_bucket(implied_prob, 0::numeric, 1::numeric, p_bins) AS wb,
         count(*) AS n,
         avg(implied_prob) AS exp_prob,
         avg(CASE WHEN status='won' THEN 1.0 ELSE 0.0 END) AS act_prob
  FROM f
  WHERE implied_prob IS NOT NULL
  GROUP BY wb
)
SELECT
  format('%s%% - %s%%', ((wb-1)*100/p_bins)::int, (wb*100/p_bins)::int) AS bucket_label,
  ((wb-1)::numeric)/p_bins AS bucket_start_pct,
  (wb::numeric)/p_bins AS bucket_end_pct,
  n::int AS bets,
  (exp_prob*100)::numeric AS expected_pct,
  (act_prob*100)::numeric AS actual_pct
FROM b
WHERE n >= p_min_bets
ORDER BY wb;
$$;

-- 9) Monthly Performance (last 12 months by default)
CREATE OR REPLACE FUNCTION analytics.monthly_performance(
  p_user uuid,
  p_filters jsonb DEFAULT '{}'::jsonb,
  p_tz text DEFAULT 'UTC',
  p_to timestamptz DEFAULT now()
)
RETURNS TABLE(month timestamptz, bets int, stake numeric, net_profit numeric, roi_pct numeric)
LANGUAGE sql 
STABLE
AS $$
WITH f AS (
  SELECT *
  FROM bets
  WHERE user_id = p_user
    AND placed_at >= date_trunc('month', p_to) - interval '11 months'
    AND placed_at <= p_to
    AND (NOT (p_filters ? 'leagues') OR league = ANY (SELECT jsonb_array_elements_text(p_filters->'leagues')::text[]))
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (SELECT jsonb_array_elements_text(p_filters->'bet_types')::text[]))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (SELECT jsonb_array_elements_text(p_filters->'sportsbooks')::text[]))
    AND (NOT (p_filters ? 'odds_min') OR odds >= (p_filters->>'odds_min')::integer)
    AND (NOT (p_filters ? 'odds_max') OR odds <= (p_filters->>'odds_max')::integer)
    AND (NOT (p_filters ? 'stake_min') OR stake >= (p_filters->>'stake_min')::numeric)
    AND (NOT (p_filters ? 'stake_max') OR stake <= (p_filters->>'stake_max')::numeric)
    AND (NOT (p_filters ? 'is_parlay') OR is_parlay = (p_filters->>'is_parlay')::boolean)
    AND (NOT (p_filters ? 'side') OR side = (p_filters->>'side'))
)
SELECT date_trunc('month', placed_at) AS month,
       count(*)::int AS bets,
       sum(stake) AS stake,
       sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct
FROM f
GROUP BY 1
ORDER BY 1;
$$;

-- 10) Materialized views for hot paths (daily/monthly aggregates)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_daily_user_perf AS
SELECT user_id,
       date_trunc('day', placed_at) AS day,
       count(*) AS bets,
       sum(stake) AS stake,
       sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct
FROM bets
GROUP BY user_id, date_trunc('day', placed_at);

CREATE INDEX IF NOT EXISTS idx_mv_daily_user_perf_user_day ON analytics.mv_daily_user_perf(user_id, day);

-- Monthly aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_monthly_user_perf AS
SELECT user_id,
       date_trunc('month', placed_at) AS month,
       count(*) AS bets,
       sum(stake) AS stake,
       sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct
FROM bets
GROUP BY user_id, date_trunc('month', placed_at);

CREATE INDEX IF NOT EXISTS idx_mv_monthly_user_perf_user_month ON analytics.mv_monthly_user_perf(user_id, month);

-- League performance aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_league_user_perf AS
SELECT user_id,
       league,
       count(*) AS bets,
       sum(stake) AS stake,
       sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(analytics.net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct,
       avg(CASE WHEN status = 'won' THEN 1.0 ELSE 0.0 END) * 100 AS win_rate
FROM bets
WHERE league IS NOT NULL
GROUP BY user_id, league;

CREATE INDEX IF NOT EXISTS idx_mv_league_user_perf_user_league ON analytics.mv_league_user_perf(user_id, league);

-- 11) Functions to refresh materialized views
CREATE OR REPLACE FUNCTION analytics.refresh_daily_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW analytics.mv_daily_user_perf;
END;
$$;

CREATE OR REPLACE FUNCTION analytics.refresh_monthly_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW analytics.mv_monthly_user_perf;
END;
$$;

CREATE OR REPLACE FUNCTION analytics.refresh_league_performance()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW analytics.mv_league_user_perf;
END;
$$;

CREATE OR REPLACE FUNCTION analytics.refresh_all_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW analytics.mv_daily_user_perf;
  REFRESH MATERIALIZED VIEW analytics.mv_monthly_user_perf;
  REFRESH MATERIALIZED VIEW analytics.mv_league_user_perf;
END;
$$;

-- 12) Additional utility functions for odds conversion
CREATE OR REPLACE FUNCTION analytics.american_to_decimal(odds integer)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN odds IS NULL THEN NULL
    WHEN odds > 0 THEN (odds / 100.0) + 1
    ELSE (100.0 / abs(odds)) + 1
  END;
$$;

CREATE OR REPLACE FUNCTION analytics.decimal_to_american(decimal_odds numeric)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN decimal_odds IS NULL THEN NULL
    WHEN decimal_odds >= 2.0 THEN ((decimal_odds - 1) * 100)::integer
    ELSE (-100 / (decimal_odds - 1))::integer
  END;
$$;

-- 13) Bucket helpers for chart building
CREATE OR REPLACE FUNCTION analytics.odds_bucket(odds integer, bucket_size integer DEFAULT 50)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN odds IS NULL THEN 'Unknown'
    WHEN odds > 0 THEN 
      CASE 
        WHEN odds <= bucket_size THEN format('+1 to +%s', bucket_size)
        ELSE format('+%s to +%s', 
          ((odds / bucket_size) * bucket_size), 
          ((odds / bucket_size) * bucket_size) + bucket_size)
      END
    ELSE
      CASE
        WHEN odds >= -bucket_size THEN format('-%s to -1', bucket_size)
        ELSE format('-%s to -%s',
          ((abs(odds) / bucket_size) * bucket_size) + bucket_size,
          ((abs(odds) / bucket_size) * bucket_size))
      END
  END;
$$;

CREATE OR REPLACE FUNCTION analytics.stake_bucket(stake numeric, bucket_size numeric DEFAULT 25.0)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN stake IS NULL THEN 'Unknown'
    WHEN stake <= bucket_size THEN format('$0 - $%s', bucket_size)
    ELSE format('$%s - $%s',
      ((stake / bucket_size)::integer * bucket_size),
      ((stake / bucket_size)::integer * bucket_size) + bucket_size)
  END;
$$;

-- Comments for documentation
COMMENT ON SCHEMA analytics IS 'Analytics functions and materialized views for TrueSharp betting performance tracking';
COMMENT ON FUNCTION analytics.american_to_prob(integer) IS 'Converts American odds to implied probability (0-1)';
COMMENT ON FUNCTION analytics.net_profit_for_bet(numeric, text, numeric, numeric) IS 'Calculates normalized net profit for a bet using existing schema columns';
COMMENT ON FUNCTION analytics.roi_over_time(uuid, jsonb, text, timestamptz, timestamptz) IS 'Returns daily ROI performance over time';
COMMENT ON FUNCTION analytics.performance_by_league(uuid, jsonb, text, timestamptz, timestamptz) IS 'Returns performance breakdown by league (min 10 bets)';
COMMENT ON FUNCTION analytics.winrate_vs_expected(uuid, jsonb, integer, integer) IS 'Returns actual vs expected win rate by odds buckets';
COMMENT ON FUNCTION analytics.monthly_performance(uuid, jsonb, text, timestamptz) IS 'Returns monthly performance for last 12 months';

-- Grant permissions (adjust as needed for your RLS setup)
-- GRANT USAGE ON SCHEMA analytics TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA analytics TO authenticated;
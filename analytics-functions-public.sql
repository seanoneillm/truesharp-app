-- Analytics functions in public schema for Supabase RPC compatibility
-- This creates the functions without the analytics schema prefix

-- 1) Test function
CREATE OR REPLACE FUNCTION public.analytics_test_connection()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'Analytics functions are working!'::text;
$$;

-- 2) Helper functions
CREATE OR REPLACE FUNCTION public.analytics_american_to_prob(odds integer)
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

CREATE OR REPLACE FUNCTION public.analytics_net_profit_for_bet(
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

-- 3) Main analytics functions
CREATE OR REPLACE FUNCTION public.analytics_roi_over_time(
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
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'bet_types'))))
    AND (NOT (p_filters ? 'leagues') OR league = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'leagues'))))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'sportsbooks'))))
    AND (NOT (p_filters ? 'odds_min') OR odds >= (p_filters->>'odds_min')::integer)
    AND (NOT (p_filters ? 'odds_max') OR odds <= (p_filters->>'odds_max')::integer)
    AND (NOT (p_filters ? 'stake_min') OR stake >= (p_filters->>'stake_min')::numeric)
    AND (NOT (p_filters ? 'stake_max') OR stake <= (p_filters->>'stake_max')::numeric)
    AND (NOT (p_filters ? 'is_parlay') OR is_parlay = (p_filters->>'is_parlay')::boolean)
    AND (NOT (p_filters ? 'side') OR side = (p_filters->>'side'))
)
SELECT date_trunc('day', placed_at AT TIME ZONE p_tz) AS day,
       sum(public.analytics_net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       sum(stake) AS stake,
       CASE WHEN sum(stake) = 0 THEN NULL ELSE (sum(public.analytics_net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct,
       count(*)::int AS bets
FROM f
GROUP BY 1
ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.analytics_performance_by_league(
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
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'bet_types'))))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'sportsbooks'))))
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
       sum(public.analytics_net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(public.analytics_net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct
FROM f
WHERE league IS NOT NULL
GROUP BY league
HAVING count(*) >= 10
ORDER BY roi_pct DESC NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.analytics_winrate_vs_expected(
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
    public.analytics_american_to_prob(odds) AS implied_prob
  FROM bets
  WHERE user_id = p_user
    AND status IN ('won','lost')
    AND odds IS NOT NULL
    AND (NOT (p_filters ? 'leagues') OR league = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'leagues'))))
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'bet_types'))))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'sportsbooks'))))
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

CREATE OR REPLACE FUNCTION public.analytics_monthly_performance(
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
    AND (NOT (p_filters ? 'leagues') OR league = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'leagues'))))
    AND (NOT (p_filters ? 'bet_types') OR bet_type = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'bet_types'))))
    AND (NOT (p_filters ? 'sportsbooks') OR sportsbook = ANY (ARRAY(SELECT jsonb_array_elements_text(p_filters->'sportsbooks'))))
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
       sum(public.analytics_net_profit_for_bet(profit, status, potential_payout, stake)) AS net_profit,
       CASE WHEN sum(stake)=0 THEN NULL ELSE (sum(public.analytics_net_profit_for_bet(profit, status, potential_payout, stake))/sum(stake))*100 END AS roi_pct
FROM f
GROUP BY 1
ORDER BY 1;
$$;
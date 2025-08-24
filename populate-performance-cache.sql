-- Populate user_performance_cache for all existing users with bets
INSERT INTO public.user_performance_cache (
  user_id,
  total_bets,
  won_bets,
  lost_bets,
  total_profit,
  total_stake,
  win_rate,
  roi,
  updated_at
)
SELECT 
  b.user_id,
  COUNT(*) as total_bets,
  COUNT(*) FILTER (WHERE b.status = 'won') as won_bets,
  COUNT(*) FILTER (WHERE b.status = 'lost') as lost_bets,
  COALESCE(SUM(b.profit), 0) as total_profit,
  COALESCE(SUM(b.stake), 0) as total_stake,
  CASE 
    WHEN COUNT(*) FILTER (WHERE b.status IN ('won', 'lost')) > 0 
    THEN (COUNT(*) FILTER (WHERE b.status = 'won') * 100.0) / COUNT(*) FILTER (WHERE b.status IN ('won', 'lost'))
    ELSE 0
  END as win_rate,
  CASE 
    WHEN COALESCE(SUM(b.stake), 0) > 0 
    THEN (COALESCE(SUM(b.profit), 0) * 100.0) / COALESCE(SUM(b.stake), 1)
    ELSE 0
  END as roi,
  now() as updated_at
FROM public.bets b
WHERE b.user_id IS NOT NULL
GROUP BY b.user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  total_bets = EXCLUDED.total_bets,
  won_bets = EXCLUDED.won_bets,
  lost_bets = EXCLUDED.lost_bets,
  total_profit = EXCLUDED.total_profit,
  total_stake = EXCLUDED.total_stake,
  win_rate = EXCLUDED.win_rate,
  roi = EXCLUDED.roi,
  updated_at = EXCLUDED.updated_at;

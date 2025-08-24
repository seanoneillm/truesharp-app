-- Create user_performance_cache table
CREATE TABLE IF NOT EXISTS public.user_performance_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  total_bets INTEGER DEFAULT 0,
  won_bets INTEGER DEFAULT 0,
  lost_bets INTEGER DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0.00,
  total_stake DECIMAL(10,2) DEFAULT 0.00,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  roi DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_performance_cache ENABLE ROW LEVEL SECURITY;

-- Create the trigger function
CREATE OR REPLACE FUNCTION trigger_update_performance_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update performance cache for the user
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
  WHERE b.user_id = COALESCE(NEW.user_id, OLD.user_id)
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

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update_strategy_performance function if it doesn't exist
CREATE OR REPLACE FUNCTION update_strategy_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Placeholder function for strategy performance updates
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create user_performance_cache table to support betting triggers
CREATE TABLE IF NOT EXISTS public.user_performance_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bets INTEGER DEFAULT 0,
  won_bets INTEGER DEFAULT 0,
  lost_bets INTEGER DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0.00,
  total_stake DECIMAL(10,2) DEFAULT 0.00,
  win_rate DECIMAL(5,2) DEFAULT 0.00,
  roi DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_performance_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own performance
CREATE POLICY "Users can view own performance cache" ON public.user_performance_cache
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for service role to manage all performance caches
CREATE POLICY "Service role can manage all performance caches" ON public.user_performance_cache
  FOR ALL USING (current_setting('role') = 'service_role');

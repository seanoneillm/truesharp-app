-- Create analytics_settings table for user analytics preferences
-- This table stores user-specific analytics settings

CREATE TABLE IF NOT EXISTS public.analytics_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,  -- references auth.users(id)
  unit_size numeric DEFAULT 1000,  -- Unit size in cents, default $10 (1000 cents)
  show_truesharp_bets boolean DEFAULT true,  -- Show TrueSharp bets toggle
  odds_format text DEFAULT 'american' CHECK (odds_format IN ('american', 'decimal', 'fractional')),  -- Odds format preference
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to ensure one settings record per user
ALTER TABLE public.analytics_settings ADD CONSTRAINT unique_user_analytics_settings UNIQUE (user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_settings_user_id ON analytics_settings (user_id);

-- Add comments for documentation
COMMENT ON TABLE analytics_settings IS 'Stores user-specific analytics settings and preferences';
COMMENT ON COLUMN analytics_settings.user_id IS 'References auth.users.id';
COMMENT ON COLUMN analytics_settings.unit_size IS 'Unit size in cents for bet analysis (e.g., 1000 = $10)';
COMMENT ON COLUMN analytics_settings.show_truesharp_bets IS 'Whether to show TrueSharp recommended bets';
COMMENT ON COLUMN analytics_settings.odds_format IS 'Preferred odds format: american, decimal, or fractional';

-- Create function to automatically create default settings for new users
CREATE OR REPLACE FUNCTION public.create_default_analytics_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.analytics_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create analytics settings for new users
DROP TRIGGER IF EXISTS on_auth_user_created_analytics_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_analytics_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_analytics_settings();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_analytics_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_analytics_settings_updated_at ON public.analytics_settings;
CREATE TRIGGER update_analytics_settings_updated_at
  BEFORE UPDATE ON public.analytics_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_analytics_settings_updated_at();
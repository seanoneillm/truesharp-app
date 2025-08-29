-- Create bettor_accounts table for SharpSports integration
-- This table stores sportsbook account connections per bettor

CREATE TABLE IF NOT EXISTS public.bettor_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bettor_id text NOT NULL,  -- references profiles(sharpsports_bettor_id)
  sharpsports_account_id text NOT NULL UNIQUE,  -- e.g. "BACT_49874992b6514b4c958ae2fb4b5072db"
  book_id text NOT NULL,                         -- SharpSports book.id
  book_name text NOT NULL,                       -- e.g. "Caesars"
  book_abbr text,                                -- e.g. "ca"
  region_name text,                              -- e.g. "New Jersey"
  region_abbr text,                              -- e.g. "nj"
  verified boolean,
  access boolean,
  paused boolean,
  balance numeric,
  latest_refresh_status int,
  latest_refresh_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add sharpsports_bettor_id column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sharpsports_bettor_id text UNIQUE;

-- Add missing columns to bets table for SharpSports integration
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS external_bet_id text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS sport text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS league text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS bet_type text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS bet_description text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS odds int;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS stake numeric;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS potential_payout numeric;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS placed_at timestamptz;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS game_date timestamptz;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS home_team text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS away_team text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS line_value numeric;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS sportsbook text;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS bet_source text DEFAULT 'manual';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bettor_accounts_bettor_id ON bettor_accounts (bettor_id);
CREATE INDEX IF NOT EXISTS idx_bettor_accounts_book_id ON bettor_accounts (book_id);
CREATE INDEX IF NOT EXISTS idx_profiles_sharpsports_bettor_id ON profiles (sharpsports_bettor_id);
CREATE INDEX IF NOT EXISTS idx_bets_external_bet_id ON bets (external_bet_id);
CREATE INDEX IF NOT EXISTS idx_bets_bet_source ON bets (bet_source);

-- Add unique constraint for external_bet_id to prevent duplicates
ALTER TABLE public.bets ADD CONSTRAINT unique_external_bet_id UNIQUE (external_bet_id);

-- Add comments for documentation
COMMENT ON TABLE bettor_accounts IS 'Stores SharpSports sportsbook account connections per bettor';
COMMENT ON COLUMN bettor_accounts.bettor_id IS 'References profiles.sharpsports_bettor_id';
COMMENT ON COLUMN bettor_accounts.sharpsports_account_id IS 'Unique SharpSports account ID';
COMMENT ON COLUMN bettor_accounts.balance IS 'Current account balance from last refresh';
COMMENT ON COLUMN profiles.sharpsports_bettor_id IS 'SharpSports bettor ID (e.g. BTTR_xxx)';
COMMENT ON COLUMN bets.external_bet_id IS 'External bet ID from SharpSports or other providers';
COMMENT ON COLUMN bets.bet_source IS 'Source of the bet: manual, sharpsports, etc.';
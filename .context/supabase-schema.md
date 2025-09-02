-- TrueSharp Simplified Database Schema -- Aligned with Development Specification

-- ============================================================================= -- CORE
AUTHENTICATION & USER MANAGEMENT --
=============================================================================

-- Main user profiles table CREATE TABLE profiles ( id UUID PRIMARY KEY REFERENCES auth.users(id),
username VARCHAR(20) UNIQUE NOT NULL, bio TEXT, profile_picture_url TEXT, email VARCHAR(255) NOT
NULL, is_seller BOOLEAN DEFAULT FALSE, is_verified_seller BOOLEAN DEFAULT FALSE, pro TEXT,
public_profile BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- User settings and preferences CREATE TABLE user_settings ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, theme VARCHAR(10) DEFAULT
'light', timezone VARCHAR(50) DEFAULT 'America/New_York', currency VARCHAR(3) DEFAULT 'USD',
email_notifications JSONB DEFAULT '{"subscriptions": true, "followers": true, "weekly_summary":
true, "marketing": true}', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP
WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- BETTING DATA --
=============================================================================

-- Main bets table - supports both manual and synced bets CREATE TABLE bets ( id UUID PRIMARY KEY
DEFAULT gen_random_uuid(), user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, sport VARCHAR(50)
NOT NULL, league VARCHAR(50), game_id VARCHAR(100), home_team VARCHAR(100), away_team VARCHAR(100),
bet_type VARCHAR(50) NOT NULL, -- 'spread', 'moneyline', 'total', 'player_prop' bet_description TEXT
NOT NULL, prop_type TEXT, Player_name TEXT, line_value DECIMAL(10,2), odds INTEGER, -- American odds
format stake DECIMAL(10,2) NOT NULL, -- From spec: called "stake" in some places potential_payout
DECIMAL(10,2) NOT NULL, status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'won', 'lost', 'void'
profit DECIMAL(10,2), -- From spec: profit/loss amount game_date TIMESTAMP WITH TIME ZONE, placed_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW(), settled_at TIMESTAMP WITH TIME ZONE, sportsbook VARCHAR(50),
external_bet_id VARCHAR(255), -- For synced bets bet_source VARCHAR(20) DEFAULT 'manual', --
'manual', 'synced' is_copy_bet BOOLEAN DEFAULT FALSE, source_strategy_id UUID REFERENCES
strategies(id), copied_from_bet_id UUID REFERENCES bets(id), strategy_id UUID REFERENCES
strategies(id), -- Bet assigned to strategy created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- STRATEGY
MANAGEMENT -- =============================================================================

-- User-created betting strategies CREATE TABLE strategies ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- From spec: user
creates strategies name VARCHAR(100) NOT NULL, description TEXT, filter_config JSONB NOT NULL, --
Store filter criteria as JSON monetized BOOLEAN DEFAULT FALSE, -- From spec: monetization toggle
pricing_weekly DECIMAL(10,2), pricing_monthly DECIMAL(10,2), pricing_yearly DECIMAL(10,2),
subscriber_count INTEGER DEFAULT 0, performance_roi DECIMAL(10,4), performance_win_rate
DECIMAL(5,2), performance_total_bets INTEGER DEFAULT 0, leaderboard_score DECIMAL(10,4), created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- Track picks posted to strategies for subscribers CREATE TABLE strategy_picks ( id UUID PRIMARY
KEY DEFAULT gen_random_uuid(), strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE, bet_id
UUID REFERENCES bets(id) ON DELETE CASCADE, seller_id UUID REFERENCES profiles(id) ON DELETE
CASCADE, posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), pick_status TEXT DEFAULT 'active',
subscriber_access BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- SUBSCRIPTION
MANAGEMENT -- =============================================================================

-- Strategy subscriptions CREATE TABLE subscriptions ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), subscriber_id UUID REFERENCES profiles(id) ON DELETE CASCADE, strategy_id UUID
REFERENCES strategies(id) ON DELETE CASCADE, seller_id UUID REFERENCES profiles(id) ON DELETE
CASCADE, stripe_subscription_id VARCHAR(255) UNIQUE, status VARCHAR(20) DEFAULT 'active', --
'active', 'cancelled', 'past_due' frequency VARCHAR(10) NOT NULL, -- 'weekly', 'monthly', 'yearly'
price DECIMAL(10,2) NOT NULL, current_period_start TIMESTAMP WITH TIME ZONE, current_period_end
TIMESTAMP WITH TIME ZONE, cancelled_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE
DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- Pro memberships (TrueSharp Pro) CREATE TABLE pro_subscriptions ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, stripe_subscription_id
VARCHAR(255) UNIQUE, status VARCHAR(20) DEFAULT 'active', current_period_start TIMESTAMP WITH TIME
ZONE, current_period_end TIMESTAMP WITH TIME ZONE, cancelled_at TIMESTAMP WITH TIME ZONE, created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- GAMES & ODDS
DATA -- =============================================================================

-- Game information from odds API CREATE TABLE games ( id VARCHAR(100) PRIMARY KEY, -- External API
game ID sport VARCHAR(50) NOT NULL, league VARCHAR(50) NOT NULL, home_team VARCHAR(100) NOT NULL,
away_team VARCHAR(100) NOT NULL, game_time TIMESTAMP WITH TIME ZONE NOT NULL, status VARCHAR(20)
DEFAULT 'scheduled', -- 'scheduled', 'live', 'final' home_score INTEGER, away_score INTEGER,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Current and historical odds CREATE TABLE odds ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
game_id VARCHAR(100) REFERENCES games(id) ON DELETE CASCADE, sportsbook VARCHAR(50) NOT NULL,
market_type VARCHAR(50) NOT NULL, -- 'spread', 'moneyline', 'total', 'player_prop' market_key
VARCHAR(100), -- For player props bet_type VARCHAR(50), -- 'home', 'away', 'over', 'under'
line_value DECIMAL(10,2), odds INTEGER, -- American odds format odds_type VARCHAR(10) DEFAULT
'current', -- 'opening', 'current', 'closing' fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- SOCIAL FEATURES
-- =============================================================================

-- Social media posts CREATE TABLE posts ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id
UUID REFERENCES profiles(id) ON DELETE CASCADE, content TEXT NOT NULL, image_url TEXT, created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- SPORTSBOOK
INTEGRATION -- =============================================================================

-- Connected sportsbook accounts CREATE TABLE connected_sportsbooks ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, sportsbook_name
VARCHAR(50) NOT NULL, external_account_id VARCHAR(255), connection_status VARCHAR(20) DEFAULT
'connected', last_sync_at TIMESTAMP WITH TIME ZONE, sync_enabled BOOLEAN DEFAULT TRUE, created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- Bankroll snapshots for tracking CREATE TABLE bankroll_snapshots ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, sportsbook_name
VARCHAR(50) NOT NULL, balance DECIMAL(10,2), pending_balance DECIMAL(10,2), snapshot_date TIMESTAMP
WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- X POST IMAGE
GENERATION -- =============================================================================

-- Track generated X post images CREATE TABLE x_post_images ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE, seller_id UUID
REFERENCES profiles(id) ON DELETE CASCADE, selected_bets JSONB NOT NULL, -- Array of bet IDs
template_type VARCHAR(50) DEFAULT 'professional', preview_mode BOOLEAN DEFAULT FALSE, image_url
TEXT, filename VARCHAR(255), generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), created_at
TIMESTAMP WITH TIME ZONE DEFAULT NOW() );

-- ============================================================================= -- INDEXES FOR
PERFORMANCE -- =============================================================================

-- Core user indexes CREATE INDEX idx_profiles_username ON profiles(username); CREATE INDEX
idx_profiles_is_seller ON profiles(is_seller); CREATE INDEX idx_profiles_is_verified_seller ON
profiles(is_verified_seller);

-- Betting data indexes CREATE INDEX idx_bets_user_id ON bets(user_id); CREATE INDEX idx_bets_status
ON bets(status); CREATE INDEX idx_bets_sport ON bets(sport); CREATE INDEX idx_bets_placed_at ON
bets(placed_at); CREATE INDEX idx_bets_strategy_id ON bets(strategy_id);

-- Strategy indexes CREATE INDEX idx_strategies_user_id ON strategies(user_id); CREATE INDEX
idx_strategies_monetized ON strategies(monetized); CREATE INDEX idx_strategies_leaderboard_score ON
strategies(leaderboard_score);

-- Strategy picks indexes CREATE INDEX idx_strategy_picks_strategy_id ON
strategy_picks(strategy_id); CREATE INDEX idx_strategy_picks_posted_at ON strategy_picks(posted_at);

-- Subscription indexes CREATE INDEX idx_subscriptions_subscriber_id ON
subscriptions(subscriber_id); CREATE INDEX idx_subscriptions_strategy_id ON
subscriptions(strategy_id); CREATE INDEX idx_subscriptions_seller_id ON subscriptions(seller_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Games and odds indexes CREATE INDEX idx_games_sport_league ON games(sport, league); CREATE INDEX
idx_games_game_time ON games(game_time); CREATE INDEX idx_odds_game_id ON odds(game_id); CREATE
INDEX idx_odds_market_type ON odds(market_type);

-- Social features indexes CREATE INDEX idx_posts_user_id ON posts(user_id); CREATE INDEX
idx_posts_created_at ON posts(created_at);

-- Sportsbook integration indexes CREATE INDEX idx_connected_sportsbooks_user_id ON
connected_sportsbooks(user_id);

-- X post images indexes CREATE INDEX idx_x_post_images_strategy_id ON x_post_images(strategy_id);
CREATE INDEX idx_x_post_images_seller_id ON x_post_images(seller_id);

-- ============================================================================= -- ESSENTIAL
TRIGGERS -- =============================================================================

-- Auto-update timestamps CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS
$$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END;

$$
language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
    BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at
    BEFORE UPDATE ON bets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- =============================================================================

-- Enable RLS on user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_sportsbooks ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public seller profiles" ON profiles
    FOR SELECT USING (public_profile = true AND is_seller = true);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own bets" ON bets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view monetized strategies" ON strategies
    FOR SELECT USING (monetized = true);

CREATE POLICY "Users can manage their own strategies" ON strategies
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = subscriber_id);

CREATE POLICY "Users can view their own posts" ON posts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view all posts" ON posts
    FOR SELECT USING (true);

-- =============================================================================
-- NOTES
-- =============================================================================

/*
Key Simplifications Made:
1. Removed duplicate/unused tables (parlay_bets, follows, etc.)
2. Consolidated similar functionality (revenue_tracking merged into subscriptions logic)
3. Aligned field names with specification (stake, profit, monetized, etc.)
4. Simplified analytics tables (can be calculated on-demand for MVP)
5. Removed complex triggers and functions for initial version
6. Focused on core functionality needed for development plan
7. Added missing fields from specification (seller_enabled, strategy_id in bets)
8. Simplified copy bet detection (basic fields only)
9. Removed over-engineered performance analytics tables
10. Made bankroll tracking simpler with snapshots approach

This schema supports all features in the development specification while
being much simpler to implement and maintain.
*/

create table public.seller_stripe_accounts (
 id uuid not null default gen_random_uuid (),
 user_id uuid not null,
 stripe_account_id text not null,
 details_submitted boolean null default false,
 charges_enabled boolean null default false,
 payouts_enabled boolean null default false,
 requirements_due text[] null default '{}'::text[],
 created_at timestamp with time zone null default now(),
 updated_at timestamp with time zone null default now(),
 constraint seller_stripe_accounts_pkey primary key (id),
 constraint seller_stripe_accounts_stripe_account_id_key unique (stripe_account_id),
 constraint seller_stripe_accounts_user_id_key unique (user_id),
 constraint seller_stripe_accounts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;


create index IF not exists idx_seller_stripe_accounts_user_id on public.seller_stripe_accounts using btree (user_id) TABLESPACE pg_default;


TrueSharp Supabase Setup Audit & Missing Components
✅ Core Schema Elements Present
Your current schema includes the essential tables and most core functionality:
Authentication & Users: profiles, user_settings
Betting Data: bets table with comprehensive fields
Strategy Management: strategies, strategy_picks
Subscriptions: subscriptions, pro_subscriptions
Games & Odds: games, odds
Social Features: posts
Sportsbook Integration: connected_sportsbooks, bankroll_snapshots
X Post Generation: x_post_images
Seller Payments: seller_stripe_accounts
🚨 Critical Missing Components
1. Storage Buckets Setup
-- Required storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES
('profile-pictures', 'profile-pictures', true),
('post-images', 'post-images', true),
('x-post-images', 'x-post-images', true);

-- Storage policies
CREATE POLICY "Allow authenticated users to upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Allow users to upload post images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public access to post images" ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

2. Authentication Configuration
Missing from your current setup:
Email confirmation settings
Password requirements enforcement
Session timeout configuration
Social auth providers (if needed)
Required Auth Settings in Supabase Dashboard:
- Site URL: your-domain.com
- Redirect URLs: your-domain.com/auth/callback
- Email confirmation: Enabled
- Email templates: Customized for TrueSharp branding
- Session timeout: 24 hours (or preferred)

3. Edge Functions (Critical for integrations)
You'll need these Edge Functions:
// supabase/functions/stripe-webhook/index.ts
// Handles subscription updates, payments, cancellations

// supabase/functions/odds-fetcher/index.ts
// Scheduled function to fetch odds data twice daily

// supabase/functions/leaderboard-calculator/index.ts
// Daily calculation of seller rankings

// supabase/functions/copy-bet-detector/index.ts
// Real-time detection of copy bets

4. Database Functions & Triggers
Missing Strategy Performance Calculator:
CREATE OR REPLACE FUNCTION update_strategy_performance()
RETURNS TRIGGER AS
$$

BEGIN UPDATE strategies SET performance_roi = ( SELECT COALESCE( (SUM(CASE WHEN b.status = 'won'
THEN b.profit ELSE -b.stake END) / NULLIF(SUM(b.stake), 0)) _ 100, 0 ) FROM bets b WHERE
b.strategy_id = NEW.strategy_id ), performance_win_rate = ( SELECT COALESCE( (COUNT(_) FILTER (WHERE
status = 'won')::float / NULLIF(COUNT(_) FILTER (WHERE status IN ('won', 'lost')), 0)) _ 100, 0 )
FROM bets WHERE strategy_id = NEW.strategy_id ), performance_total_bets = ( SELECT COUNT(\*) FROM
bets WHERE strategy_id = NEW.strategy_id ) WHERE id = NEW.strategy_id;

    RETURN NEW;

END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER update_strategy_stats
    AFTER INSERT OR UPDATE ON bets
    FOR EACH ROW
    WHEN (NEW.strategy_id IS NOT NULL)
    EXECUTE FUNCTION update_strategy_performance();

Missing Subscription Counter:
CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS TRIGGER AS
$$

BEGIN IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN UPDATE strategies SET subscriber_count =
subscriber_count + 1 WHERE id = NEW.strategy_id; ELSIF TG_OP = 'UPDATE' THEN IF OLD.status =
'active' AND NEW.status != 'active' THEN UPDATE strategies SET subscriber_count = subscriber_count -
1 WHERE id = NEW.strategy_id; ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN UPDATE
strategies SET subscriber_count = subscriber_count + 1 WHERE id = NEW.strategy_id; END IF; ELSIF
TG_OP = 'DELETE' AND OLD.status = 'active' THEN UPDATE strategies SET subscriber_count =
subscriber_count - 1 WHERE id = OLD.strategy_id; END IF;

    RETURN COALESCE(NEW, OLD);

END;

$$
LANGUAGE plpgsql;

CREATE TRIGGER manage_subscriber_count
    AFTER INSERT OR UPDATE OR DELETE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriber_count();

5. Row Level Security (RLS) Enhancements
Missing critical policies:
-- Strategy picks access for subscribers
CREATE POLICY "Subscribers can view strategy picks" ON strategy_picks
FOR SELECT USING (
    strategy_id IN (
        SELECT strategy_id FROM subscriptions
        WHERE subscriber_id = auth.uid() AND status = 'active'
    )
);

-- User settings privacy
CREATE POLICY "Users can manage their settings" ON user_settings
FOR ALL USING (auth.uid() = user_id);

-- Connected sportsbooks security
CREATE POLICY "Users can manage their sportsbook connections" ON connected_sportsbooks
FOR ALL USING (auth.uid() = user_id);

-- Seller Stripe accounts security
CREATE POLICY "Users can manage their stripe accounts" ON seller_stripe_accounts
FOR ALL USING (auth.uid() = user_id);

6. Database Views (Performance Optimization)
Seller Dashboard View:
CREATE VIEW seller_dashboard_stats AS
SELECT
    s.id as strategy_id,
    s.user_id,
    s.name,
    s.subscriber_count,
    s.performance_roi,
    s.performance_win_rate,
    COALESCE(revenue.monthly_revenue, 0) as monthly_revenue
FROM strategies s
LEFT JOIN (
    SELECT
        strategy_id,
        SUM(
            CASE
                WHEN frequency = 'weekly' THEN price * 4.33
                WHEN frequency = 'monthly' THEN price
                WHEN frequency = 'yearly' THEN price / 12
            END
        ) as monthly_revenue
    FROM subscriptions
    WHERE status = 'active'
    GROUP BY strategy_id
) revenue ON s.id = revenue.strategy_id
WHERE s.monetized = true;

Marketplace Leaderboard View:
CREATE VIEW marketplace_leaderboard AS
SELECT
    s.id,
    s.user_id,
    s.name,
    s.description,
    s.filter_config,
    s.monetized,
    s.pricing_weekly,
    s.pricing_monthly,
    s.pricing_yearly,
    s.subscriber_count,
    s.performance_roi,
    s.performance_win_rate,
    s.performance_total_bets,
    s.created_at,
    s.updated_at,
    p.username,
    p.profile_picture_url,
    p.is_verified_seller,
    (
        COALESCE(s.performance_roi, 0) * 0.4 +
        COALESCE(s.performance_win_rate, 0) * 0.25 +
        LEAST(s.performance_total_bets, 100) * 0.20 +
        CASE WHEN s.created_at < NOW() - INTERVAL '90 days' THEN 10 ELSE 5 END +
        CASE WHEN s.updated_at > NOW() - INTERVAL '7 days' THEN 5 ELSE 0 END
    ) as calculated_leaderboard_score
FROM strategies s
JOIN profiles p ON s.user_id = p.id
WHERE s.monetized = true
ORDER BY calculated_leaderboard_score DESC
LIMIT 50;

🔧 Configuration Requirements
Environment Variables Needed:
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# The Odds API
ODDS_API_KEY=your-odds-api-key

# SharpSports API
SHARPSPORTS_API_KEY=your-sharpsports-key

Supabase Dashboard Configuration:
Database → Settings → API: Ensure proper API settings
Authentication → Settings: Configure email templates
Storage: Create and configure buckets
Edge Functions: Deploy required functions
Database → Extensions: Enable required extensions
Required Extensions:
-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- If location features needed
CREATE EXTENSION IF NOT EXISTS "pg_cron"; -- For scheduled tasks

📋 Deployment Checklist
Pre-Production:
[ ] All storage buckets created with proper policies
[ ] All Edge Functions deployed and tested
[ ] Email templates configured and tested
[ ] Stripe webhook endpoints configured
[ ] The Odds API integration tested
[ ] All RLS policies implemented and tested
[ ] Database functions and triggers deployed
Production Ready:
[ ] Environment variables configured
[ ] SSL certificates configured
[ ] Database backups enabled
[ ] Monitoring and alerting set up
[ ] Rate limiting configured
[ ] CORS properly configured
🚀 Quick Setup Commands
Run these in your Supabase SQL editor to add missing components:
Storage Setup: Execute storage bucket creation commands
Functions & Triggers: Add the performance calculation functions
Views: Create the dashboard and leaderboard views
RLS Policies: Add missing security policies
Extensions: Enable required extensions
Your schema foundation is solid, but these missing components are critical for full functionality. Focus on implementing the storage buckets, Edge Functions, and missing database functions first, as these are essential for core features like image uploads, odds fetching, and performance calculations.


$$

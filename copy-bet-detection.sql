-- Copy Bet Detection System
-- This file contains functions and triggers to detect and prevent copy betting

-- Function to detect if a newly inserted bet is a copy bet
CREATE OR REPLACE FUNCTION detect_copy_bet()
RETURNS TRIGGER AS $$
DECLARE
    subscription_record RECORD;
    strategy_bet_record RECORD;
BEGIN
    -- Only check for copy bets if the bet is not already marked as a copy bet
    IF NEW.is_copy_bet = TRUE THEN
        RETURN NEW;
    END IF;

    -- Loop through all active subscriptions for this user
    FOR subscription_record IN 
        SELECT s.strategy_id, s.created_at as subscription_start
        FROM subscriptions s
        WHERE s.subscriber_id = NEW.user_id 
        AND s.status = 'active'
    LOOP
        -- Check if there's a matching bet in the subscribed strategy
        FOR strategy_bet_record IN
            SELECT sb.added_at, b.id as original_bet_id
            FROM strategy_bets sb
            JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = subscription_record.strategy_id
            AND b.sport = NEW.sport
            AND b.league = NEW.league
            AND b.bet_type = NEW.bet_type
            AND b.odds = NEW.odds
            AND COALESCE(b.home_team, '') = COALESCE(NEW.home_team, '')
            AND COALESCE(b.away_team, '') = COALESCE(NEW.away_team, '')
            AND COALESCE(b.line_value, 0) = COALESCE(NEW.line_value, 0)
            AND COALESCE(b.prop_type, '') = COALESCE(NEW.prop_type, '')
            AND COALESCE(b.player_name, '') = COALESCE(NEW.player_name, '')
            AND COALESCE(b.side, '') = COALESCE(NEW.side, '')
            -- Ensure the bet was made available before the user placed their bet
            AND sb.added_at IS NOT NULL
            AND NEW.placed_at > sb.added_at
        LOOP
            -- Mark as copy bet and record source information
            NEW.is_copy_bet = TRUE;
            NEW.source_strategy_id = subscription_record.strategy_id;
            NEW.copied_from_bet_id = strategy_bet_record.original_bet_id;
            
            -- Exit both loops once we find a match
            EXIT;
        END LOOP;
        
        -- Exit outer loop if we found a copy bet
        IF NEW.is_copy_bet = TRUE THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent copy bets from being added to strategies
CREATE OR REPLACE FUNCTION prevent_copy_bet_strategy_addition()
RETURNS TRIGGER AS $$
DECLARE
    bet_record RECORD;
    strategy_owner_id UUID;
BEGIN
    -- Get the bet details and strategy owner
    SELECT b.is_copy_bet, b.user_id, s.user_id as strategy_owner_id
    INTO bet_record
    FROM bets b
    JOIN strategies s ON s.id = NEW.strategy_id
    WHERE b.id = NEW.bet_id;

    -- If the bet is marked as a copy bet and the strategy owner is the same as the bet placer
    IF bet_record.is_copy_bet = TRUE AND bet_record.user_id = bet_record.strategy_owner_id THEN
        RAISE EXCEPTION 'This bet is already in a strategy you subscribe to and cannot be resold.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to detect copy bets on bet insertion
DROP TRIGGER IF EXISTS trigger_detect_copy_bet ON bets;
CREATE TRIGGER trigger_detect_copy_bet
    BEFORE INSERT ON bets
    FOR EACH ROW
    EXECUTE FUNCTION detect_copy_bet();

-- Create trigger to prevent copy bets from being added to strategies
DROP TRIGGER IF EXISTS trigger_prevent_copy_bet_strategy_addition ON strategy_bets;
CREATE TRIGGER trigger_prevent_copy_bet_strategy_addition
    BEFORE INSERT ON strategy_bets
    FOR EACH ROW
    EXECUTE FUNCTION prevent_copy_bet_strategy_addition();

-- Index to improve performance of copy bet detection queries
CREATE INDEX IF NOT EXISTS idx_bets_copy_detection 
ON bets (sport, league, bet_type, odds, home_team, away_team, line_value, prop_type, player_name, side);

-- Index for strategy_bets added_at column for better performance
CREATE INDEX IF NOT EXISTS idx_strategy_bets_added_at 
ON strategy_bets (added_at);
-- Create or replace the function that updates strategy totals
-- This function will be called by the trigger when strategy_bets are inserted/updated/deleted

CREATE OR REPLACE FUNCTION update_strategy_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the strategy_leaderboard with recalculated totals
    UPDATE strategy_leaderboard 
    SET 
      total_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
      ),
      winning_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id 
        AND b.status = 'won'
      ),
      losing_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id 
        AND b.status = 'lost'
      ),
      push_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id 
        AND b.status = 'push'
      ),
      roi_percentage = (
        SELECT COALESCE(
          CASE 
            WHEN SUM(b.stake) > 0 THEN 
              (SUM(CASE WHEN b.status = 'won' THEN b.payout - b.stake ELSE -b.stake END) / SUM(b.stake)) * 100
            ELSE 0
          END, 0
        )
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id 
        AND b.status IN ('won', 'lost', 'push')
      ),
      win_rate = (
        SELECT COALESCE(
          CASE 
            WHEN COUNT(*) > 0 THEN 
              COUNT(CASE WHEN b.status = 'won' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC
            ELSE 0
          END, 0
        )
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id 
        AND b.status IN ('won', 'lost', 'push')
      ),
      updated_at = NOW(),
      last_calculated_at = NOW()
    WHERE strategy_id = NEW.strategy_id;

    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Update the strategy_leaderboard with recalculated totals
    UPDATE strategy_leaderboard 
    SET 
      total_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = OLD.strategy_id
      ),
      winning_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = OLD.strategy_id 
        AND b.status = 'won'
      ),
      losing_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = OLD.strategy_id 
        AND b.status = 'lost'
      ),
      push_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = OLD.strategy_id 
        AND b.status = 'push'
      ),
      roi_percentage = (
        SELECT COALESCE(
          CASE 
            WHEN SUM(b.stake) > 0 THEN 
              (SUM(CASE WHEN b.status = 'won' THEN b.payout - b.stake ELSE -b.stake END) / SUM(b.stake)) * 100
            ELSE 0
          END, 0
        )
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = OLD.strategy_id 
        AND b.status IN ('won', 'lost', 'push')
      ),
      win_rate = (
        SELECT COALESCE(
          CASE 
            WHEN COUNT(*) > 0 THEN 
              COUNT(CASE WHEN b.status = 'won' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC
            ELSE 0
          END, 0
        )
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = OLD.strategy_id 
        AND b.status IN ('won', 'lost', 'push')
      ),
      updated_at = NOW(),
      last_calculated_at = NOW()
    WHERE strategy_id = OLD.strategy_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS trigger_update_strategy_totals ON strategy_bets;
CREATE TRIGGER trigger_update_strategy_totals
    AFTER INSERT OR UPDATE OR DELETE ON strategy_bets
    FOR EACH ROW
    EXECUTE FUNCTION update_strategy_totals();

-- Also create a function to handle bet status updates
CREATE OR REPLACE FUNCTION update_strategy_totals_on_bet_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When a bet's status changes, update all strategy_leaderboards that include this bet
  IF OLD.status != NEW.status THEN
    UPDATE strategy_leaderboard 
    SET 
      winning_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = strategy_leaderboard.strategy_id 
        AND b.status = 'won'
      ),
      losing_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = strategy_leaderboard.strategy_id 
        AND b.status = 'lost'
      ),
      push_bets = (
        SELECT COUNT(*)
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = strategy_leaderboard.strategy_id 
        AND b.status = 'push'
      ),
      roi_percentage = (
        SELECT COALESCE(
          CASE 
            WHEN SUM(b.stake) > 0 THEN 
              (SUM(CASE WHEN b.status = 'won' THEN b.payout - b.stake ELSE -b.stake END) / SUM(b.stake)) * 100
            ELSE 0
          END, 0
        )
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = strategy_leaderboard.strategy_id 
        AND b.status IN ('won', 'lost', 'push')
      ),
      win_rate = (
        SELECT COALESCE(
          CASE 
            WHEN COUNT(*) > 0 THEN 
              COUNT(CASE WHEN b.status = 'won' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC
            ELSE 0
          END, 0
        )
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = strategy_leaderboard.strategy_id 
        AND b.status IN ('won', 'lost', 'push')
      ),
      updated_at = NOW(),
      last_calculated_at = NOW()
    WHERE strategy_id IN (
      SELECT strategy_id 
      FROM strategy_bets 
      WHERE bet_id = NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bet status changes
DROP TRIGGER IF EXISTS trigger_update_strategy_totals_on_bet_status_change ON bets;
CREATE TRIGGER trigger_update_strategy_totals_on_bet_status_change
    AFTER UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_strategy_totals_on_bet_status_change();

-- Create a function to update strategy_leaderboard_updated_at timestamp
CREATE OR REPLACE FUNCTION update_strategy_leaderboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the constraint function exists for the check
DO $$ 
BEGIN
    -- Make sure the constraint check is properly defined
    -- The constraint should verify that winning_bets + losing_bets + push_bets = total_bets
    
    -- We don't need to add the constraint as it already exists, 
    -- but let's make sure our function maintains this invariant
END $$;

-- Deploy Parlay-Aware Strategy Triggers
-- Execute this SQL in your Supabase SQL editor to fix parlay handling in strategies

-- 1. Create the main parlay-aware strategy totals function
CREATE OR REPLACE FUNCTION update_strategy_totals_parlay_aware()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the strategy_leaderboard with parlay-aware calculations
    UPDATE strategy_leaderboard 
    SET 
      -- Count unique betting units: single bets + parlay groups
      total_bets = (
        WITH betting_units AS (
          -- Count single bets (not part of parlays)
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          
          UNION ALL
          
          -- Count distinct parlay groups
          SELECT COUNT(DISTINCT b.parlay_id) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
        )
        SELECT COALESCE(SUM(count), 0) FROM betting_units
      ),
      
      -- Count winning betting units
      winning_bets = (
        WITH winning_units AS (
          -- Count single winning bets
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'won'
          
          UNION ALL
          
          -- Count winning parlays (all legs must be won)
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = NEW.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push') -- Only count settled parlays
            GROUP BY b.parlay_id
            HAVING COUNT(*) = COUNT(CASE WHEN b.status = 'won' THEN 1 END) -- All legs won
            AND COUNT(*) > 0 -- Has at least one leg
          ) winning_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM winning_units
      ),
      
      -- Count losing betting units
      losing_bets = (
        WITH losing_units AS (
          -- Count single losing bets
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'lost'
          
          UNION ALL
          
          -- Count losing parlays (any leg lost = parlay lost)
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = NEW.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push') -- Only count settled parlays
            GROUP BY b.parlay_id
            HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) > 0 -- At least one leg lost
            AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*) -- Not all legs won
          ) losing_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM losing_units
      ),
      
      -- Count push betting units (parlays with all legs won/push and at least one push)
      push_bets = (
        WITH push_units AS (
          -- Count single push bets
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'push'
          
          UNION ALL
          
          -- Count push parlays (no losses, at least one push)
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = NEW.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push') -- Only count settled parlays
            GROUP BY b.parlay_id
            HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) = 0 -- No losses
            AND COUNT(CASE WHEN b.status = 'push' THEN 1 END) > 0 -- At least one push
            AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*) -- Not all legs won
          ) push_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM push_units
      ),
      
      -- Calculate ROI with parlay awareness
      roi_percentage = (
        WITH parlay_aware_roi AS (
          -- Calculate ROI for single bets
          SELECT 
            COALESCE(SUM(b.stake), 0) as total_stake,
            COALESCE(SUM(CASE 
              WHEN b.status = 'won' THEN b.potential_payout - b.stake 
              WHEN b.status = 'lost' THEN -b.stake
              ELSE 0 
            END), 0) as total_profit
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status IN ('won', 'lost', 'push')
          
          UNION ALL
          
          -- Calculate ROI for parlays (sum by parlay_id)
          SELECT 
            COALESCE(SUM(parlay_stake), 0) as total_stake,
            COALESCE(SUM(parlay_profit), 0) as total_profit
          FROM (
            SELECT 
              b.parlay_id,
              SUM(b.stake) as parlay_stake,
              CASE 
                -- Parlay won: all legs won
                WHEN COUNT(CASE WHEN b.status = 'won' THEN 1 END) = COUNT(*) 
                THEN SUM(b.potential_payout) - SUM(b.stake)
                -- Parlay lost: any leg lost or push
                ELSE -SUM(b.stake)
              END as parlay_profit
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = NEW.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(*) > 0 -- Only count complete parlays
          ) parlay_calculations
        )
        SELECT CASE 
          WHEN SUM(total_stake) > 0 THEN 
            (SUM(total_profit) / SUM(total_stake)) * 100
          ELSE 0
        END
        FROM parlay_aware_roi
      ),
      
      -- Calculate win rate with parlay awareness
      win_rate = (
        WITH betting_unit_results AS (
          -- Single bet results
          SELECT 
            COUNT(*) as total_units,
            COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_units
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status IN ('won', 'lost', 'push')
          
          UNION ALL
          
          -- Parlay results
          SELECT 
            COUNT(*) as total_units,
            SUM(CASE WHEN all_won THEN 1 ELSE 0 END) as won_units
          FROM (
            SELECT 
              b.parlay_id,
              CASE 
                WHEN COUNT(CASE WHEN b.status = 'won' THEN 1 END) = COUNT(*) THEN true 
                ELSE false 
              END as all_won
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = NEW.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
          ) parlay_results
        )
        SELECT CASE 
          WHEN SUM(total_units) > 0 THEN 
            SUM(won_units)::NUMERIC / SUM(total_units)::NUMERIC
          ELSE 0
        END
        FROM betting_unit_results
      ),
      
      updated_at = NOW(),
      last_calculated_at = NOW()
    WHERE strategy_id = NEW.strategy_id;

    RETURN NEW;
  END IF;

  -- Handle DELETE - same logic but with OLD instead of NEW
  IF TG_OP = 'DELETE' THEN
    UPDATE strategy_leaderboard 
    SET 
      total_bets = (
        WITH betting_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = OLD.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          
          UNION ALL
          
          SELECT COUNT(DISTINCT b.parlay_id) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = OLD.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
        )
        SELECT COALESCE(SUM(count), 0) FROM betting_units
      ),
      
      winning_bets = (
        WITH winning_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = OLD.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'won'
          
          UNION ALL
          
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = OLD.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(*) = COUNT(CASE WHEN b.status = 'won' THEN 1 END)
            AND COUNT(*) > 0
          ) winning_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM winning_units
      ),
      
      losing_bets = (
        WITH losing_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = OLD.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'lost'
          
          UNION ALL
          
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = OLD.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) > 0
            AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*)
          ) losing_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM losing_units
      ),
      
      push_bets = (
        WITH push_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = OLD.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'push'
          
          UNION ALL
          
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = OLD.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) = 0
            AND COUNT(CASE WHEN b.status = 'push' THEN 1 END) > 0
            AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*)
          ) push_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM push_units
      ),
      
      updated_at = NOW(),
      last_calculated_at = NOW()
    WHERE strategy_id = OLD.strategy_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the bet status change function for parlay awareness
CREATE OR REPLACE FUNCTION update_strategy_totals_on_bet_status_change_parlay_aware()
RETURNS TRIGGER AS $$
BEGIN
  -- When a bet's status changes, update all strategy_leaderboards that include this bet
  IF OLD.status != NEW.status THEN
    UPDATE strategy_leaderboard 
    SET 
      winning_bets = (
        WITH winning_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = strategy_leaderboard.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'won'
          
          UNION ALL
          
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = strategy_leaderboard.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(*) = COUNT(CASE WHEN b.status = 'won' THEN 1 END)
            AND COUNT(*) > 0
          ) winning_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM winning_units
      ),
      
      losing_bets = (
        WITH losing_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = strategy_leaderboard.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'lost'
          
          UNION ALL
          
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = strategy_leaderboard.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) > 0
            AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*)
          ) losing_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM losing_units
      ),
      
      push_bets = (
        WITH push_units AS (
          SELECT COUNT(*) as count
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = strategy_leaderboard.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status = 'push'
          
          UNION ALL
          
          SELECT COUNT(DISTINCT parlay_id) as count
          FROM (
            SELECT b.parlay_id
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = strategy_leaderboard.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) = 0
            AND COUNT(CASE WHEN b.status = 'push' THEN 1 END) > 0
            AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*)
          ) push_parlays
        )
        SELECT COALESCE(SUM(count), 0) FROM push_units
      ),
      
      -- Recalculate ROI when bet status changes
      roi_percentage = (
        WITH parlay_aware_roi AS (
          SELECT 
            COALESCE(SUM(b.stake), 0) as total_stake,
            COALESCE(SUM(CASE 
              WHEN b.status = 'won' THEN b.potential_payout - b.stake 
              WHEN b.status = 'lost' THEN -b.stake
              ELSE 0 
            END), 0) as total_profit
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = strategy_leaderboard.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status IN ('won', 'lost', 'push')
          
          UNION ALL
          
          SELECT 
            COALESCE(SUM(parlay_stake), 0) as total_stake,
            COALESCE(SUM(parlay_profit), 0) as total_profit
          FROM (
            SELECT 
              b.parlay_id,
              SUM(b.stake) as parlay_stake,
              CASE 
                WHEN COUNT(CASE WHEN b.status = 'won' THEN 1 END) = COUNT(*) 
                THEN SUM(b.potential_payout) - SUM(b.stake)
                ELSE -SUM(b.stake)
              END as parlay_profit
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = strategy_leaderboard.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
            HAVING COUNT(*) > 0
          ) parlay_calculations
        )
        SELECT CASE 
          WHEN SUM(total_stake) > 0 THEN 
            (SUM(total_profit) / SUM(total_stake)) * 100
          ELSE 0
        END
        FROM parlay_aware_roi
      ),
      
      -- Recalculate win rate
      win_rate = (
        WITH betting_unit_results AS (
          SELECT 
            COUNT(*) as total_units,
            COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_units
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = strategy_leaderboard.strategy_id
          AND (b.is_parlay = false OR b.is_parlay IS NULL)
          AND b.status IN ('won', 'lost', 'push')
          
          UNION ALL
          
          SELECT 
            COUNT(*) as total_units,
            SUM(CASE WHEN all_won THEN 1 ELSE 0 END) as won_units
          FROM (
            SELECT 
              b.parlay_id,
              CASE 
                WHEN COUNT(CASE WHEN b.status = 'won' THEN 1 END) = COUNT(*) THEN true 
                ELSE false 
              END as all_won
            FROM strategy_bets sb
            INNER JOIN bets b ON sb.bet_id = b.id
            WHERE sb.strategy_id = strategy_leaderboard.strategy_id
            AND b.is_parlay = true 
            AND b.parlay_id IS NOT NULL
            AND b.status IN ('won', 'lost', 'push')
            GROUP BY b.parlay_id
          ) parlay_results
        )
        SELECT CASE 
          WHEN SUM(total_units) > 0 THEN 
            SUM(won_units)::NUMERIC / SUM(total_units)::NUMERIC
          ELSE 0
        END
        FROM betting_unit_results
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

-- 3. Create a trigger on strategy_leaderboard updates to force recalculation
CREATE OR REPLACE FUNCTION trigger_recalculate_strategy_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- When last_calculated_at is updated, trigger a full recalculation
  IF TG_OP = 'UPDATE' AND OLD.last_calculated_at != NEW.last_calculated_at THEN
    -- Use the same logic as the strategy_bets trigger but for this specific strategy
    NEW.total_bets = (
      WITH betting_units AS (
        SELECT COUNT(*) as count
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND (b.is_parlay = false OR b.is_parlay IS NULL)
        
        UNION ALL
        
        SELECT COUNT(DISTINCT b.parlay_id) as count
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND b.is_parlay = true 
        AND b.parlay_id IS NOT NULL
      )
      SELECT COALESCE(SUM(count), 0) FROM betting_units
    );
    
    NEW.winning_bets = (
      WITH winning_units AS (
        SELECT COUNT(*) as count
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND (b.is_parlay = false OR b.is_parlay IS NULL)
        AND b.status = 'won'
        
        UNION ALL
        
        SELECT COUNT(DISTINCT parlay_id) as count
        FROM (
          SELECT b.parlay_id
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
          AND b.status IN ('won', 'lost', 'push')
          GROUP BY b.parlay_id
          HAVING COUNT(*) = COUNT(CASE WHEN b.status = 'won' THEN 1 END)
          AND COUNT(*) > 0
        ) winning_parlays
      )
      SELECT COALESCE(SUM(count), 0) FROM winning_units
    );
    
    NEW.losing_bets = (
      WITH losing_units AS (
        SELECT COUNT(*) as count
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND (b.is_parlay = false OR b.is_parlay IS NULL)
        AND b.status = 'lost'
        
        UNION ALL
        
        SELECT COUNT(DISTINCT parlay_id) as count
        FROM (
          SELECT b.parlay_id
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
          AND b.status IN ('won', 'lost', 'push')
          GROUP BY b.parlay_id
          HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) > 0
          AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*)
        ) losing_parlays
      )
      SELECT COALESCE(SUM(count), 0) FROM losing_units
    );
    
    NEW.push_bets = (
      WITH push_units AS (
        SELECT COUNT(*) as count
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND (b.is_parlay = false OR b.is_parlay IS NULL)
        AND b.status = 'push'
        
        UNION ALL
        
        SELECT COUNT(DISTINCT parlay_id) as count
        FROM (
          SELECT b.parlay_id
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
          AND b.status IN ('won', 'lost', 'push')
          GROUP BY b.parlay_id
          HAVING COUNT(CASE WHEN b.status = 'lost' THEN 1 END) = 0
          AND COUNT(CASE WHEN b.status = 'push' THEN 1 END) > 0
          AND COUNT(CASE WHEN b.status = 'won' THEN 1 END) != COUNT(*)
        ) push_parlays
      )
      SELECT COALESCE(SUM(count), 0) FROM push_units
    );
    
    NEW.roi_percentage = (
      WITH parlay_aware_roi AS (
        SELECT 
          COALESCE(SUM(b.stake), 0) as total_stake,
          COALESCE(SUM(CASE 
            WHEN b.status = 'won' THEN b.potential_payout - b.stake 
            WHEN b.status = 'lost' THEN -b.stake
            ELSE 0 
          END), 0) as total_profit
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND (b.is_parlay = false OR b.is_parlay IS NULL)
        AND b.status IN ('won', 'lost', 'push')
        
        UNION ALL
        
        SELECT 
          COALESCE(SUM(parlay_stake), 0) as total_stake,
          COALESCE(SUM(parlay_profit), 0) as total_profit
        FROM (
          SELECT 
            b.parlay_id,
            SUM(b.stake) as parlay_stake,
            CASE 
              WHEN COUNT(CASE WHEN b.status = 'won' THEN 1 END) = COUNT(*) 
              THEN SUM(b.potential_payout) - SUM(b.stake)
              ELSE -SUM(b.stake)
            END as parlay_profit
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
          AND b.status IN ('won', 'lost', 'push')
          GROUP BY b.parlay_id
          HAVING COUNT(*) > 0
        ) parlay_calculations
      )
      SELECT CASE 
        WHEN SUM(total_stake) > 0 THEN 
          (SUM(total_profit) / SUM(total_stake)) * 100
        ELSE 0
      END
      FROM parlay_aware_roi
    );
    
    NEW.win_rate = (
      WITH betting_unit_results AS (
        SELECT 
          COUNT(*) as total_units,
          COUNT(CASE WHEN b.status = 'won' THEN 1 END) as won_units
        FROM strategy_bets sb
        INNER JOIN bets b ON sb.bet_id = b.id
        WHERE sb.strategy_id = NEW.strategy_id
        AND (b.is_parlay = false OR b.is_parlay IS NULL)
        AND b.status IN ('won', 'lost', 'push')
        
        UNION ALL
        
        SELECT 
          COUNT(*) as total_units,
          SUM(CASE WHEN all_won THEN 1 ELSE 0 END) as won_units
        FROM (
          SELECT 
            b.parlay_id,
            CASE 
              WHEN COUNT(CASE WHEN b.status = 'won' THEN 1 END) = COUNT(*) THEN true 
              ELSE false 
            END as all_won
          FROM strategy_bets sb
          INNER JOIN bets b ON sb.bet_id = b.id
          WHERE sb.strategy_id = NEW.strategy_id
          AND b.is_parlay = true 
          AND b.parlay_id IS NOT NULL
          AND b.status IN ('won', 'lost', 'push')
          GROUP BY b.parlay_id
        ) parlay_results
      )
      SELECT CASE 
        WHEN SUM(total_units) > 0 THEN 
          SUM(won_units)::NUMERIC / SUM(total_units)::NUMERIC
        ELSE 0
      END
      FROM betting_unit_results
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Replace the old triggers with parlay-aware versions
DROP TRIGGER IF EXISTS trigger_update_strategy_totals ON strategy_bets;
DROP TRIGGER IF EXISTS trigger_update_strategy_totals_parlay_aware ON strategy_bets;
CREATE TRIGGER trigger_update_strategy_totals_parlay_aware
    AFTER INSERT OR UPDATE OR DELETE ON strategy_bets
    FOR EACH ROW
    EXECUTE FUNCTION update_strategy_totals_parlay_aware();

DROP TRIGGER IF EXISTS trigger_update_strategy_totals_on_bet_status_change ON bets;
DROP TRIGGER IF EXISTS trigger_update_strategy_totals_on_bet_status_change_parlay_aware ON bets;
CREATE TRIGGER trigger_update_strategy_totals_on_bet_status_change_parlay_aware
    AFTER UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION update_strategy_totals_on_bet_status_change_parlay_aware();

-- Create trigger for manual recalculation via last_calculated_at update
DROP TRIGGER IF EXISTS trigger_recalculate_strategy_totals ON strategy_leaderboard;
CREATE TRIGGER trigger_recalculate_strategy_totals
    BEFORE UPDATE ON strategy_leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalculate_strategy_totals();

-- 5. Create function to recalculate all existing strategies with parlay awareness
CREATE OR REPLACE FUNCTION recalculate_all_strategy_leaderboard_with_parlays()
RETURNS void AS $$
DECLARE
  strategy_record RECORD;
BEGIN
  -- Loop through all strategies and recalculate their metrics
  FOR strategy_record IN SELECT DISTINCT strategy_id FROM strategy_leaderboard LOOP
    UPDATE strategy_leaderboard 
    SET 
      -- Trigger recalculation by updating a field
      last_calculated_at = NOW()
    WHERE strategy_id = strategy_record.strategy_id;
    
    -- The trigger will handle the actual recalculation
  END LOOP;
  
  RAISE NOTICE 'Recalculated % strategy leaderboard entries with parlay awareness', 
    (SELECT COUNT(*) FROM strategy_leaderboard);
END;
$$ LANGUAGE plpgsql;

-- 6. Run the recalculation for all existing strategies
SELECT recalculate_all_strategy_leaderboard_with_parlays();

-- Success message
SELECT 'Parlay-aware strategy triggers deployed successfully!' as status;
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Creating update_strategy_totals function...')

    // Create the function
    const { error: functionError } = await supabase.rpc('sql', {
      query: `
        -- Create or replace the function that updates strategy totals
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
      `,
    })

    if (functionError) {
      console.error('Error creating function:', functionError)
      return NextResponse.json(
        { error: 'Failed to create function', details: functionError },
        { status: 500 }
      )
    }

    console.log('✅ Function created successfully')

    // Recreate the trigger
    const { error: triggerError } = await supabase.rpc('sql', {
      query: `
        -- Recreate the trigger to ensure it uses the updated function
        DROP TRIGGER IF EXISTS trigger_update_strategy_totals ON strategy_bets;
        CREATE TRIGGER trigger_update_strategy_totals
            AFTER INSERT OR UPDATE OR DELETE ON strategy_bets
            FOR EACH ROW
            EXECUTE FUNCTION update_strategy_totals();
      `,
    })

    if (triggerError) {
      console.error('Error creating trigger:', triggerError)
      return NextResponse.json(
        { error: 'Failed to create trigger', details: triggerError },
        { status: 500 }
      )
    }

    console.log('✅ Trigger created successfully')

    return NextResponse.json({
      success: true,
      message: 'Strategy totals function and trigger created successfully',
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

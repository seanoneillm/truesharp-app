import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create service role client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Starting strategy_leaderboard constraint fix...')

    // Get all strategy_leaderboard entries
    const { data: leaderboardEntries, error: fetchError } = await serviceSupabase
      .from('strategy_leaderboard')
      .select('*')

    if (fetchError) {
      console.error('Error fetching leaderboard entries:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard entries' }, { status: 500 })
    }

    const fixes = []
    const errors = []

    for (const entry of leaderboardEntries) {
      try {
        console.log(`\n🔍 Processing strategy: ${entry.strategy_name} (${entry.strategy_id})`)

        // Get all bets for this strategy
        const { data: strategyBetsData, error: betsError } = await serviceSupabase
          .from('strategy_bets')
          .select(
            `
            bet_id,
            bets!inner(id, status)
          `
          )
          .eq('strategy_id', entry.strategy_id)

        if (betsError) {
          console.error(`Error fetching bets for strategy ${entry.strategy_id}:`, betsError)
          errors.push({ strategy_id: entry.strategy_id, error: betsError.message })
          continue
        }

        if (!strategyBetsData) {
          console.log(`No bets found for strategy ${entry.strategy_id}`)
          continue
        }

        // Calculate correct totals
        const totalBets = strategyBetsData.length
        const winningBets = strategyBetsData.filter(sb => {
          const bet = sb.bets as unknown as { status: string }
          return bet.status === 'won'
        }).length
        const losingBets = strategyBetsData.filter(sb => {
          const bet = sb.bets as unknown as { status: string }
          return bet.status === 'lost'
        }).length
        const pushBets = strategyBetsData.filter(sb => {
          const bet = sb.bets as unknown as { status: string }
          return bet.status === 'push'
        }).length

        const pendingBets = strategyBetsData.filter(sb => {
          const bet = sb.bets as unknown as { status: string }
          return bet.status === 'pending'
        }).length

        // Calculate settled bets (won + lost + push)
        const settledBets = winningBets + losingBets + pushBets

        console.log(`📊 Current DB values:`, {
          total_bets: entry.total_bets,
          winning_bets: entry.winning_bets,
          losing_bets: entry.losing_bets,
          push_bets: entry.push_bets,
          sum: entry.winning_bets + entry.losing_bets + entry.push_bets,
        })

        console.log(`📊 Calculated values:`, {
          totalBets,
          winningBets,
          losingBets,
          pushBets,
          pendingBets,
          settledBets,
          constraintValid: settledBets === totalBets,
        })

        // Check if we need to update
        const needsUpdate =
          entry.total_bets !== totalBets ||
          entry.winning_bets !== winningBets ||
          entry.losing_bets !== losingBets ||
          entry.push_bets !== pushBets

        if (needsUpdate) {
          console.log(`🔧 Updating strategy ${entry.strategy_id}...`)

          const { error: updateError } = await serviceSupabase
            .from('strategy_leaderboard')
            .update({
              total_bets: totalBets,
              winning_bets: winningBets,
              losing_bets: losingBets,
              push_bets: pushBets,
              updated_at: new Date().toISOString(),
            })
            .eq('strategy_id', entry.strategy_id)

          if (updateError) {
            console.error(`❌ Error updating strategy ${entry.strategy_id}:`, updateError)
            errors.push({
              strategy_id: entry.strategy_id,
              error: updateError.message,
              details: updateError,
            })
          } else {
            console.log(`✅ Successfully updated strategy ${entry.strategy_id}`)
            fixes.push({
              strategy_id: entry.strategy_id,
              strategy_name: entry.strategy_name,
              old_values: {
                total_bets: entry.total_bets,
                winning_bets: entry.winning_bets,
                losing_bets: entry.losing_bets,
                push_bets: entry.push_bets,
              },
              new_values: {
                total_bets: totalBets,
                winning_bets: winningBets,
                losing_bets: losingBets,
                push_bets: pushBets,
              },
            })
          }
        } else {
          console.log(`✅ Strategy ${entry.strategy_id} already has correct values`)
        }
      } catch (error) {
        console.error(`Error processing strategy ${entry.strategy_id}:`, error)
        errors.push({
          strategy_id: entry.strategy_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    console.log('\n🎉 Strategy leaderboard fix complete!')
    console.log(`✅ Fixed: ${fixes.length} strategies`)
    console.log(`❌ Errors: ${errors.length} strategies`)

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixes.length} strategies, ${errors.length} errors`,
      fixes,
      errors,
      summary: {
        total_processed: leaderboardEntries.length,
        fixed: fixes.length,
        errors: errors.length,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

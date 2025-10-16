import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface AddBetsRequest {
  betIds: string[]
  strategyIds: string[]
  userId?: string
}

interface FilterConfig {
  betTypes?: string[]
  leagues?: string[]
  statuses?: string[]
  isParlays?: string[]
  sides?: string[]
  sports?: string[]
  oddsRange?: { min?: number; max?: number }
  stakeRange?: { min?: number; max?: number }
  lineValueRange?: { min?: number; max?: number }
  spreadRange?: { min?: number; max?: number }
  totalRange?: { min?: number; max?: number }
  sportsbooks?: string[]
  customStartDate?: string
  customEndDate?: string
}

interface Bet {
  id: string
  sport: string
  bet_type: string
  side?: string
  is_parlay: boolean
  parlay_id?: string
  sportsbook: string
  odds: number
  stake: number
  line_value?: number
  game_date: string
  status: string
  user_id: string
}

interface Strategy {
  id: string
  sport?: string
  filter_config: FilterConfig
  user_id: string
}

function validateBetAgainstStrategy(bet: Bet, strategy: Strategy): boolean {
  const filters = strategy.filter_config as FilterConfig

  // Check sport/league filter
  if (strategy.sport && strategy.sport !== 'All') {
    const sportVariations = getSportVariations(strategy.sport)
    if (!sportVariations.includes(bet.sport)) {
      return false
    }
  }

  // Check bet type filter
  if (filters.betTypes && !filters.betTypes.includes('All') && filters.betTypes[0]) {
    const betTypeVariations = getBetTypeVariations(filters.betTypes[0])
    if (!betTypeVariations.includes(bet.bet_type)) {
      return false
    }
  }

  // Check sides filter
  if (filters.sides && !filters.sides.includes('All') && bet.side) {
    const allowedSides = filters.sides.map(s => s.toLowerCase())
    if (!allowedSides.includes(bet.side.toLowerCase())) {
      return false
    }
  }

  // Check parlay filter
  if (filters.isParlays && !filters.isParlays.includes('All')) {
    const allowParlay = filters.isParlays.includes('true')
    if (bet.is_parlay !== allowParlay) {
      return false
    }
  }

  // Check sportsbook filter
  if (filters.sportsbooks && filters.sportsbooks.length > 0) {
    const sportsbookVariations = getSportsbookVariations(filters.sportsbooks)
    if (!sportsbookVariations.includes(bet.sportsbook)) {
      return false
    }
  }

  // Check odds range
  if (filters.oddsRange) {
    if (filters.oddsRange.min && bet.odds < filters.oddsRange.min) return false
    if (filters.oddsRange.max && bet.odds > filters.oddsRange.max) return false
  }

  // Check stake range
  if (filters.stakeRange) {
    if (filters.stakeRange.min && bet.stake < filters.stakeRange.min) return false
    if (filters.stakeRange.max && bet.stake > filters.stakeRange.max) return false
  }

  // Check line value range
  if (filters.lineValueRange && bet.line_value) {
    if (filters.lineValueRange.min && bet.line_value < filters.lineValueRange.min) return false
    if (filters.lineValueRange.max && bet.line_value > filters.lineValueRange.max) return false
  }

  return true
}

function getSportVariations(sport: string): string[] {
  const variations = []

  if (sport === 'NFL') {
    variations.push('NFL', 'nfl', 'football', 'Football', 'American Football')
  } else if (sport === 'NBA') {
    variations.push('NBA', 'nba', 'basketball', 'Basketball')
  } else if (sport === 'MLB') {
    variations.push('MLB', 'mlb', 'baseball', 'Baseball')
  } else if (sport === 'NHL') {
    variations.push('NHL', 'nhl', 'hockey', 'Hockey', 'Ice Hockey')
  } else if (sport === 'NCAAF') {
    // NCAAF bets can be stored with sport='football' (synced bets) OR sport='NCAAF' (manual bets)
    variations.push('NCAAF', 'ncaaf', 'football', 'Football', 'College Football', 'college football', 'NCAA Football', 'ncaa football')
  } else if (sport === 'NCAAB' || sport === 'NCAAM' || sport === 'NCAAMB') {
    // NCAAB, NCAAM, and NCAAMB should all be treated as the same league
    // Bets can be stored with sport='basketball' (synced bets) OR specific sport codes (manual bets)
    variations.push('NCAAB', 'NCAAM', 'NCAAMB', 'ncaab', 'ncaam', 'ncaamb', 'basketball', 'Basketball', 'College Basketball', 'college basketball', 'NCAA Basketball', 'ncaa basketball', 'NCAA Men\'s Basketball', 'ncaa men\'s basketball')
  } else if (sport === 'MLS') {
    variations.push('MLS', 'mls', 'Soccer', 'soccer', 'Football', 'football')
  } else if (sport === 'UCL') {
    variations.push('UCL', 'ucl', 'Champions League', 'champions league', 'UEFA Champions League', 'uefa champions league', 'Soccer', 'soccer')
  } else {
    variations.push(sport, sport.toLowerCase(), sport.toUpperCase())
  }

  return variations
}

function getBetTypeVariations(betType: string): string[] {
  const variations = []
  const lowerBetType = betType.toLowerCase()

  if (lowerBetType === 'moneyline') {
    variations.push('moneyline', 'ml', 'money_line')
  } else if (lowerBetType === 'spread') {
    variations.push('spread', 'point_spread', 'ps')
  } else if (lowerBetType === 'total') {
    variations.push('total', 'over_under', 'ou', 'totals')
  } else if (lowerBetType === 'player_prop') {
    variations.push('player_prop', 'prop', 'player_props')
  } else {
    variations.push(betType, lowerBetType, betType.toUpperCase())
  }

  return variations
}

function getSportsbookVariations(sportsbooks: string[]): string[] {
  const variations = []

  for (const sportsbook of sportsbooks) {
    if (sportsbook.toLowerCase() === 'draftkings') {
      variations.push('DraftKings', 'draftkings', 'DK')
    } else if (sportsbook.toLowerCase() === 'fanduel') {
      variations.push('FanDuel', 'fanduel', 'FD')
    } else if (sportsbook.toLowerCase() === 'sportsgameodds') {
      variations.push('SportsGameOdds', 'sportsgameodds')
    } else {
      variations.push(sportsbook, sportsbook.toLowerCase(), sportsbook.toUpperCase())
    }
  }

  return [...new Set(variations)]
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body first to get clientUserId for fallback auth
    const body: AddBetsRequest = await request.json()
    const { betIds, strategyIds, userId: clientUserId } = body

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Use clientUserId for fallback authentication (from iOS app)
    let userId = user?.id
    if (authError || !user) {
      if (clientUserId) {
        console.log('🔄 Using fallback authentication with clientUserId')
        userId = clientUserId
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!betIds || !strategyIds || betIds.length === 0 || strategyIds.length === 0) {
      return NextResponse.json({ error: 'Bet IDs and Strategy IDs are required' }, { status: 400 })
    }

    // Create service role client for database operations
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch the selected bets
    const { data: bets, error: betsError } = await serviceSupabase
      .from('bets')
      .select('*, parlay_id')
      .in('id', betIds)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())

    if (betsError || !bets) {
      return NextResponse.json({ error: 'Failed to fetch bets' }, { status: 500 })
    }

    // Fetch the selected strategies
    const { data: strategies, error: strategiesError } = await serviceSupabase
      .from('strategies')
      .select('*')
      .in('id', strategyIds)
      .eq('user_id', userId)

    if (strategiesError || !strategies) {
      return NextResponse.json({ error: 'Failed to fetch strategies' }, { status: 500 })
    }

    // Check existing strategy_bets to prevent duplicates
    const { data: existingStrategyBets, error: existingError } = await serviceSupabase
      .from('strategy_bets')
      .select('strategy_id, bet_id')
      .in('strategy_id', strategyIds)
      .in('bet_id', betIds)

    if (existingError) {
      return NextResponse.json({ error: 'Failed to check existing strategy bets' }, { status: 500 })
    }

    const existingCombos = new Set(
      existingStrategyBets?.map(sb => `${sb.strategy_id}-${sb.bet_id}`) || []
    )

    // Validate each bet against each strategy and prepare inserts
    const strategyBetsToInsert = []
    const validationResults = []
    const strategyUpdates = new Map()

    for (const bet of bets) {
      for (const strategy of strategies) {
        const comboKey = `${strategy.id}-${bet.id}`

        // Skip if this combo already exists
        if (existingCombos.has(comboKey)) {
          validationResults.push({
            betId: bet.id,
            strategyId: strategy.id,
            valid: false,
            reason: 'Bet already exists in strategy',
          })
          continue
        }

        // Validate bet against strategy filters
        const isValid = validateBetAgainstStrategy(bet, strategy)

        validationResults.push({
          betId: bet.id,
          strategyId: strategy.id,
          valid: isValid,
          reason: isValid ? 'Valid' : 'Bet does not match strategy filters',
        })

        if (isValid) {
          strategyBetsToInsert.push({
            strategy_id: strategy.id,
            bet_id: bet.id,
            added_at: new Date().toISOString(),
            parlay_id: bet.parlay_id || null,
          })

          // Track strategy updates
          if (!strategyUpdates.has(strategy.id)) {
            strategyUpdates.set(strategy.id, 0)
          }
          strategyUpdates.set(strategy.id, strategyUpdates.get(strategy.id) + 1)
        }
      }
    }

    let insertedCount = 0

    // Insert valid strategy_bets
    if (strategyBetsToInsert.length > 0) {
      // Try to insert strategy_bets in smaller batches to avoid constraint issues
      const batchSize = 10
      let totalInserted = 0

      for (let i = 0; i < strategyBetsToInsert.length; i += batchSize) {
        const batch = strategyBetsToInsert.slice(i, i + batchSize)

        try {
          const { error: insertError } = await serviceSupabase.from('strategy_bets').insert(batch)

          if (insertError) {
            console.error(`Error inserting batch ${i}-${i + batch.length}:`, insertError)

            // If we get a constraint violation, try to insert one by one
            if (insertError.code === '23514') {
              console.log('Constraint violation detected, trying individual inserts...')

              for (const item of batch) {
                try {
                  const { error: singleError } = await serviceSupabase
                    .from('strategy_bets')
                    .insert([item])

                  if (singleError) {
                    console.error('Error inserting single item:', singleError)
                  } else {
                    totalInserted++
                  }
                } catch (singleInsertError) {
                  console.error('Single insert failed:', singleInsertError)
                }
              }
            } else {
              // For other errors, just continue to next batch
              continue
            }
          } else {
            totalInserted += batch.length
          }
        } catch (batchError) {
          console.error(`Batch insert failed:`, batchError)
          continue
        }
      }

      insertedCount = totalInserted

      if (insertedCount === 0) {
        return NextResponse.json(
          {
            error: 'Failed to add any bets to strategies due to constraint violations',
          },
          { status: 500 }
        )
      }

      // Send push notifications to subscribers
      for (const [strategyId, betCount] of strategyUpdates) {
        try {
          // Get strategy details for notification
          const { data: strategyData } = await serviceSupabase
            .from('strategies')
            .select('name, user_id')
            .eq('id', strategyId)
            .single()

          // Get seller details
          const { data: sellerData } = await serviceSupabase
            .from('profiles')
            .select('username')
            .eq('id', strategyData?.user_id)
            .single()

          if (strategyData && sellerData) {
            // Call push notification Edge Function
            const pushNotificationUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notifications`
            
            const pushResponse = await fetch(pushNotificationUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                type: 'strategy_bets',
                strategyId: strategyId,
                sellerName: sellerData.username || 'Seller',
                strategyName: strategyData.name,
                betCount: betCount,
              }),
            })

            if (pushResponse.ok) {
              const result = await pushResponse.json()
              console.log(`✅ Push notifications sent for strategy ${strategyData.name}: ${result.subscribersNotified} recipients`)
            } else {
              const error = await pushResponse.text()
              console.error(`❌ Failed to send push notifications for strategy ${strategyData.name}:`, error)
            }
          }
        } catch (notificationError) {
          console.error('Error sending push notifications:', notificationError)
          // Don't fail the main operation if notifications fail
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      validationResults,
      message: `Successfully added ${insertedCount} bet${insertedCount !== 1 ? 's' : ''} to strategies`,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

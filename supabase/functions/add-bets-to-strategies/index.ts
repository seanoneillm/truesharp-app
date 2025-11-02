import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface AddBetsRequest {
  betIds: string[]
  strategyIds: string[]
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
  name: string
  sport?: string
  filter_config: FilterConfig
  user_id: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    variations.push('NCAAF', 'ncaaf', 'football', 'Football', 'College Football', 'college football', 'NCAA Football', 'ncaa football')
  } else if (sport === 'NCAAB' || sport === 'NCAAM' || sport === 'NCAAMB') {
    // NCAAB, NCAAM, and NCAAMB should all be treated as the same sport
    variations.push('NCAAB', 'NCAAM', 'NCAAMB', 'ncaab', 'ncaam', 'ncaamb', 'basketball', 'Basketball', 'College Basketball', 'college basketball', 'NCAA Basketball', 'ncaa basketball', "NCAA Men's Basketball", "ncaa men's basketball")
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { betIds, strategyIds }: AddBetsRequest = await req.json()

    if (!betIds || !strategyIds || betIds.length === 0 || strategyIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Bet IDs and Strategy IDs are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the selected bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*, parlay_id')
      .in('id', betIds)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gt('game_date', new Date().toISOString())

    if (betsError || !bets) {
      console.error('Error fetching bets:', betsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch bets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Fetch the selected strategies
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('*')
      .in('id', strategyIds)
      .eq('user_id', user.id)

    if (strategiesError || !strategies) {
      console.error('Error fetching strategies:', strategiesError)
      return new Response(JSON.stringify({ error: 'Failed to fetch strategies' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check existing strategy_bets to prevent duplicates
    const { data: existingStrategyBets, error: existingError } = await supabase
      .from('strategy_bets')
      .select('strategy_id, bet_id')
      .in('strategy_id', strategyIds)
      .in('bet_id', betIds)

    if (existingError) {
      console.error('Error checking existing strategy bets:', existingError)
      return new Response(JSON.stringify({ error: 'Failed to check existing strategy bets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const existingCombos = new Set(
      existingStrategyBets?.map(sb => `${sb.strategy_id}-${sb.bet_id}`) || []
    )

    // Validate each bet against each strategy and prepare inserts
    const strategyBetsToInsert = []
    const validationResults = []

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
        }
      }
    }

    let insertedCount = 0

    // Insert valid strategy_bets
    if (strategyBetsToInsert.length > 0) {
      const { data: insertResult, error: insertError } = await supabase
        .from('strategy_bets')
        .insert(strategyBetsToInsert)

      if (insertError) {
        console.error('Error inserting strategy bets:', insertError)
        return new Response(JSON.stringify({ error: 'Failed to add bets to strategies' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      insertedCount = strategyBetsToInsert.length
    }

    return new Response(JSON.stringify({
      success: true,
      inserted: insertedCount,
      validationResults,
      message: `Successfully added ${insertedCount} bet${insertedCount !== 1 ? 's' : ''} to strategies`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
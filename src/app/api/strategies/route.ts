import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

interface CreateStrategyRequest {
  name: string
  description: string
  filter_config: FilterConfig
  monetized?: boolean
  pricing_weekly?: number
  pricing_monthly?: number
  pricing_yearly?: number
  userId?: string
}

interface FilterConfig {
  betTypes?: string[]
  leagues?: string[]
  statuses?: string[]
  isParlays?: string[]
  sides?: string[]
  oddsTypes?: string[]
  timeRange?: string
  customStartDate?: string
  customEndDate?: string
  sportsbooks?: string[]
  sports?: string[]
  oddsRange?: { min?: number; max?: number }
  stakeRange?: { min?: number; max?: number }
  lineValueRange?: { min?: number; max?: number }
  spreadRange?: { min?: number; max?: number }
  totalRange?: { min?: number; max?: number }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 Strategy creation API called')

    // Parse request body first to get clientUserId for fallback auth
    const body: CreateStrategyRequest = await request.json()
    const {
      name,
      description,
      filter_config,
      monetized = false,
      pricing_weekly,
      pricing_monthly,
      pricing_yearly,
      userId: clientUserId,
    } = body

    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log('🔐 Auth check result:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8) + '...' || 'undefined...',
      authError: authError?.message || 'No error',
      hasClientUserId: !!clientUserId,
    })

    let finalUser = user

    if (authError || !user) {
      console.log('❌ Authentication failed, trying fallback methods...')

      // Try service role fallback like in betting API
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Try to extract user ID from JWT token
        const authTokenCookie = request.cookies.get('sb-trsogafrxpptszxydycn-auth-token')?.value
        let userId = null

        if (authTokenCookie) {
          try {
            let tokenValue = authTokenCookie
            if (authTokenCookie.startsWith('[') && authTokenCookie.endsWith(']')) {
              const parsed = JSON.parse(authTokenCookie)
              if (Array.isArray(parsed) && parsed.length > 0) {
                tokenValue = parsed[0]
              }
            }

            const tokenParts = tokenValue.split('.')
            if (tokenParts.length === 3 && tokenParts[1]) {
              const payload = JSON.parse(atob(tokenParts[1]))
              userId = payload.sub
              console.log('📋 Extracted user ID from token:', userId?.substring(0, 8) + '...')
            }
          } catch (e) {
            console.log('⚠️ Could not extract user ID from token:', e)
          }
        }

        if (userId) {
          // Validate that this user exists
          const { data: userProfile, error: profileError } = await serviceSupabase
            .from('profiles')
            .select('id, email')
            .eq('id', userId)
            .single()

          if (!profileError && userProfile) {
            console.log('✅ User validated via service role')
            finalUser = {
              id: userId,
              email: userProfile.email,
              aud: 'authenticated',
              role: 'authenticated',
              email_confirmed_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {},
              identities: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          } else {
            console.log('❌ User validation failed:', profileError?.message)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }
        } else if (clientUserId) {
          // Use client-provided user ID as fallback like in betting API
          console.log('🔄 Trying client-provided user ID validation...')
          const { data: userProfile, error: profileError } = await serviceSupabase
            .from('profiles')
            .select('id, email')
            .eq('id', clientUserId)
            .single()

          if (!profileError && userProfile) {
            console.log('✅ User validated via client-provided ID')
            finalUser = {
              id: clientUserId,
              email: userProfile.email,
              aud: 'authenticated',
              role: 'authenticated',
              email_confirmed_at: new Date().toISOString(),
              app_metadata: {},
              user_metadata: {},
              identities: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          } else {
            console.log('❌ Client user validation failed:', profileError?.message)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          }
        } else {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      } catch (fallbackError) {
        console.log('❌ Fallback authentication failed:', fallbackError)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (!finalUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    if (!name || name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: 'Strategy name must be between 1 and 100 characters' },
        { status: 400 }
      )
    }

    // Validate filters according to enhanced strategy creation rules
    const filters = filter_config as FilterConfig

    // Rule 1: Status filter MUST be "All" - no other status filters allowed
    if (!filters.statuses || !filters.statuses.includes('All') || filters.statuses.length !== 1) {
      return NextResponse.json(
        {
          error:
            'Strategy creation requires bet status to be set to "All" only. No specific status filters are allowed.',
        },
        { status: 400 }
      )
    }

    // Rule 2: Either "All" leagues OR exactly ONE specific league must be selected
    const leagues = filters.leagues || []
    const hasAllLeagues = leagues.includes('All')
    const specificLeagues = leagues.filter(l => l !== 'All')

    if (!hasAllLeagues && specificLeagues.length !== 1) {
      return NextResponse.json(
        {
          error:
            'Strategy creation requires either "All" leagues or exactly one specific league to be selected',
        },
        { status: 400 }
      )
    }

    if (hasAllLeagues && specificLeagues.length > 0) {
      return NextResponse.json(
        {
          error: 'Strategy creation cannot have both "All" and specific leagues selected',
        },
        { status: 400 }
      )
    }

    // Rule 3: Either "All" bet types OR exactly ONE specific bet type must be selected
    const allowedBetTypes = [
      'total',
      'moneyline',
      'spread',
      'player_prop',
      'team_prop',
      'game_prop',
    ]
    const betTypes = filters.betTypes || []
    const hasAllBetTypes = betTypes.includes('All')
    const specificBetTypes = betTypes.filter(bt => bt !== 'All' && allowedBetTypes.includes(bt))

    if (!hasAllBetTypes && specificBetTypes.length !== 1) {
      return NextResponse.json(
        {
          error:
            'Strategy creation requires either "All" bet types or exactly one specific bet type to be selected',
        },
        { status: 400 }
      )
    }

    if (hasAllBetTypes && specificBetTypes.length > 0) {
      return NextResponse.json(
        {
          error: 'Strategy creation cannot have both "All" and specific bet types selected',
        },
        { status: 400 }
      )
    }

    // Extract convenience fields for database indexing
    const sport = hasAllLeagues ? 'All' : specificLeagues[0] // Use "All" or the specific league
    const league = sport // In our schema, sport and league are the same

    // Extract the actual bet type for filtering (spread, moneyline, total, etc.)
    const betType = hasAllBetTypes ? 'All' : specificBetTypes[0] // Use "All" or the specific bet type

    console.log('🎯 BET TYPE EXTRACTION DEBUG:')
    console.log('   hasAllBetTypes:', hasAllBetTypes)
    console.log('   specificBetTypes:', specificBetTypes)
    console.log('   FINAL betType for filtering:', betType)

    // Determine parlay category for additional filtering if needed
    let parlayCategoryType = null
    if (filters.isParlays && filters.isParlays.includes('All')) {
      // If isParlays is "All", strategy covers both straight and parlay bets
      parlayCategoryType = null // null means both straight and parlay
    } else if (filters.isParlays && filters.isParlays.includes('true')) {
      parlayCategoryType = 'Parlay' // Only parlay bets
    } else if (filters.isParlays && filters.isParlays.includes('false')) {
      parlayCategoryType = 'Straight' // Only straight bets
    } else {
      // Default to null if isParlays is not properly set
      parlayCategoryType = null
    }

    // Extract comprehensive data from filters for all schema fields
    const strategyData = {
      user_id: finalUser.id,
      name,
      description: description || null,
      filter_config,
      monetized,
      pricing_weekly,
      pricing_monthly,
      pricing_yearly,

      // Array fields from filters - handle "All" or specific selections
      sports: hasAllLeagues ? null : [sport], // null for "All", array for specific
      leagues: hasAllLeagues ? null : specificLeagues, // null for "All", array for specific
      bet_types: specificBetTypes, // Single bet type as required
      sportsbooks:
        filters.sportsbooks && filters.sportsbooks.length > 0 ? filters.sportsbooks : null,

      // Side and parlay preferences
      home_away_preference:
        filters.sides && !filters.sides.includes('All') ? filters.sides.join(',') : null,

      // Ranges as JSONB (if any ranges are specified)
      odds_ranges: filters.oddsRange ? filters.oddsRange : null,
      spread_ranges: filters.spreadRange ? filters.spreadRange : null,
      total_ranges: filters.totalRange ? filters.totalRange : null,

      // Date and time filters
      date_ranges:
        filters.customStartDate || filters.customEndDate
          ? {
              start_date: filters.customStartDate || null,
              end_date: filters.customEndDate || null,
              time_range: filters.timeRange || null,
            }
          : null,

      // Start date field - dedicated field for strategy start date
      start_date: filters.customStartDate || null, // Dedicated field for strategy start date

      // Bet sizing from stake range
      bet_sizing: filters.stakeRange ? filters.stakeRange : null,

      // Index fields for performance
      sport,
      league,
      bet_type: parlayCategoryType, // Database constraint expects null/Parlay/Straight
      odds_range: filters.oddsRange || null,
      spread_range: filters.spreadRange || null,
      total_range: filters.totalRange || null,
    }

    // Create service role client for database operations to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🎯 Strategy creation with comprehensive data mapping')
    console.log('📊 Filters received:', JSON.stringify(filters, null, 2))
    console.log('📋 Strategy data to be saved:', JSON.stringify(strategyData, null, 2))

    // Debug sport normalization specifically
    console.log('🏀 SPORT NORMALIZATION DEBUG:')
    console.log('  Original sport from extraction:', sport)
    console.log('  hasAllLeagues:', hasAllLeagues)
    console.log('  specificLeagues:', specificLeagues)
    console.log('  Filter leagues:', filters.leagues)
    console.log('  Filter sports:', filters.sports)
    console.log('  Will search for sport variations of:', sport)
    console.log('  Strategy is looking for sport:', sport, 'to match against database bets')

    // Insert strategy into database using service role
    const { data: strategy, error: insertError } = await serviceSupabase
      .from('strategies')
      .insert(strategyData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting strategy:', insertError)
      return NextResponse.json({ error: 'Failed to create strategy' }, { status: 500 })
    }

    console.log('✅ Strategy created successfully:', JSON.stringify(strategy, null, 2))

    // Find matching bets for this strategy using service role
    let betsQuery = serviceSupabase
      .from('bets')
      .select('id, profit, stake, status, parlay_id, sport, league, bet_type, side, is_parlay, sportsbook, placed_at')
      .eq('user_id', finalUser.id)

    console.log('🔍 Building bets query with filters:', {
      sport,
      betType,
      hasAllSides: filters.sides && filters.sides.includes('All'),
      hasAllParlays: filters.isParlays && filters.isParlays.includes('All'),
      sportsbooks: filters.sportsbooks,
      sides: filters.sides,
      statuses: filters.statuses,
      customStartDate: filters.customStartDate,
      customEndDate: filters.customEndDate,
    })

    // Debug exactly what filters are being applied
    console.log('🏀 DETAILED FILTER DEBUG:')
    console.log('  Sport for filtering:', sport)
    console.log('  Sport !== "All":', sport !== 'All')
    console.log('  Will apply sport filter:', sport && sport !== 'All')

    // First, let's see what bets this user actually has
    const { data: allUserBets, error: allBetsError } = await serviceSupabase
      .from('bets')
      .select('id, sport, league, bet_type, status, side, is_parlay, sportsbook, created_at')
      .eq('user_id', finalUser.id)
      .limit(50)

    if (!allBetsError && allUserBets) {
      console.log('🔍 User has', allUserBets.length, 'total bets (showing max 50):')
      console.log('🔍 Sample bets:', allUserBets.slice(0, 5))

      const uniqueSports = [...new Set(allUserBets.map(b => b.sport).filter(Boolean))]
      const uniqueLeagues = [...new Set(allUserBets.map(b => b.league).filter(Boolean))]

      console.log('🔍 Unique sports:', uniqueSports)
      console.log('🔍 Unique leagues:', uniqueLeagues)
      console.log('🔍 Unique bet_types:', [...new Set(allUserBets.map(b => b.bet_type))])
      console.log('🔍 Unique statuses:', [...new Set(allUserBets.map(b => b.status))])
      console.log('🔍 Unique sides:', [...new Set(allUserBets.map(b => b.side))])
      console.log('🔍 Unique sportsbooks:', [...new Set(allUserBets.map(b => b.sportsbook))])
      console.log('🔍 Parlay distribution:', {
        parlays: allUserBets.filter(b => b.is_parlay).length,
        straight: allUserBets.filter(b => !b.is_parlay).length,
      })

      // Check for college basketball variations specifically
      const collegeBasketballBets = allUserBets.filter(bet => {
        const sport = bet.sport?.toLowerCase() || ''
        const league = bet.league?.toLowerCase() || ''
        return (
          sport.includes('ncaa') ||
          sport.includes('college') ||
          sport.includes('ncaab') ||
          sport.includes('ncaam') ||
          sport.includes('ncaamb') ||
          league.includes('ncaa') ||
          league.includes('college') ||
          league.includes('ncaab') ||
          league.includes('ncaam') ||
          league.includes('ncaamb')
        )
      })

      if (collegeBasketballBets.length > 0) {
        console.log('🏀 Found', collegeBasketballBets.length, 'college basketball bets:')
        collegeBasketballBets.slice(0, 5).forEach(bet => {
          console.log(`   Bet ${bet.id}: sport="${bet.sport}", league="${bet.league}"`)
        })
      } else {
        console.log('🏀 No college basketball bets found in sample')
      }
    }

    // Initialize variation arrays outside of conditionals for debugging
    let sportVariations: string[] = []
    let betTypeVariations: string[] = []

    // Apply sport/league filter with case-insensitive matching and sport mapping
    // IMPORTANT: Search both 'sport' AND 'league' columns since NCAAF might be in either
    if (sport && sport !== 'All') {
      console.log('🔍 Applying sport/league filter:', sport)

      // Create a list of possible sport variations to match
      if (sport === 'NFL') {
        sportVariations = ['NFL', 'nfl', 'football', 'Football', 'American Football']
      } else if (sport === 'NBA') {
        sportVariations = ['NBA', 'nba', 'basketball', 'Basketball']
      } else if (sport === 'MLB') {
        sportVariations = ['MLB', 'mlb', 'baseball', 'Baseball']
      } else if (sport === 'NHL') {
        sportVariations = ['NHL', 'nhl', 'hockey', 'Hockey', 'Ice Hockey']
      } else if (sport === 'NCAAF') {
        sportVariations = [
          'NCAAF',
          'ncaaf',
          'College Football',
          'college football',
          'NCAA Football',
          'ncaa football',
        ]
      } else if (sport === 'NCAAB' || sport === 'NCAAM' || sport === 'NCAAMB') {
        // NCAAB, NCAAM, and NCAAMB should all be treated as the same sport
        // This must match exactly with iOS normalizeLeague function
        sportVariations = [
          'NCAAB',
          'NCAAM',
          'NCAAMB',
          'ncaab',
          'ncaam',
          'ncaamb',
          "NCAA Men's Basketball",
          "ncaa men's basketball",
          'College Basketball',
          'college basketball',
          'NCAA Basketball',
          'ncaa basketball',
        ]
      } else if (sport === 'MLS') {
        sportVariations = ['MLS', 'mls', 'Soccer', 'soccer', 'Football', 'football']
      } else if (sport === 'UCL') {
        sportVariations = [
          'UCL',
          'ucl',
          'Champions League',
          'champions league',
          'UEFA Champions League',
          'uefa champions league',
        ]
      } else {
        // Default case - try both exact match and lowercase
        sportVariations = [sport, sport.toLowerCase(), sport.toUpperCase()]
      }

      console.log('🔍 Sport variations to match:', sportVariations)

      // Create OR condition to search both sport AND league columns
      const sportConditions = sportVariations.map(variation => `sport.eq.${variation}`).join(',')
      const leagueConditions = sportVariations.map(variation => `league.eq.${variation}`).join(',')
      const combinedConditions = `${sportConditions},${leagueConditions}`

      console.log('🔍 Applying OR filter to both sport and league columns:', combinedConditions)

      // Test query after sport filter to see how many bets match
      const testQuery = serviceSupabase
        .from('bets')
        .select('id, sport, league, bet_type, status, side, is_parlay, sportsbook')
        .eq('user_id', finalUser.id)
        .or(combinedConditions)
        .limit(50)

      const { data: afterSportFilter, error: testError } = await testQuery
      if (!testError && afterSportFilter) {
        console.log('🏀 Bets found after sport filter:', afterSportFilter.length)
        if (afterSportFilter.length > 0) {
          console.log('🏀 Sample matched bets after sport filter:')
          afterSportFilter.slice(0, 10).forEach(bet => {
            console.log(
              `   Bet ${bet.id}: sport="${bet.sport}", league="${bet.league}", bet_type="${bet.bet_type}"`
            )
          })
        } else {
          console.log('🏀 ❌ No bets matched the sport filter!')
          console.log('🏀 Strategy filter requested:', sport)
          console.log('🏀 Sport variations searched for:', sportVariations)
          console.log('🏀 Combined OR condition used:', combinedConditions)
          console.log('🏀 Testing individual conditions...')

          // Test each variation individually to see what matches
          for (const variation of sportVariations.slice(0, 5)) {
            const testIndividual = await serviceSupabase
              .from('bets')
              .select('id, sport, league')
              .eq('user_id', finalUser.id)
              .or(`sport.eq.${variation},league.eq.${variation}`)
              .limit(3)

            const { data: individualMatches } = testIndividual
            if (individualMatches && individualMatches.length > 0) {
              console.log(
                `     "${variation}" matches ${individualMatches.length} bets:`,
                individualMatches.map(b => `${b.sport}|${b.league}`)
              )
            } else {
              console.log(`     "${variation}" matches 0 bets`)
            }
          }
        }
      } else if (testError) {
        console.log('🏀 ❌ Error testing sport filter:', testError)
      }

      // Continue with the original query flow
      betsQuery = betsQuery.or(combinedConditions)
    } else {
      console.log('🔍 No sport filter applied (sport is All)')
    }

    // Apply bet type filter with variations
    if (betType && betType !== 'All') {
      console.log('🔍 Applying bet_type filter:', betType)

      // Create a list of possible bet type variations
      const lowerBetType = betType.toLowerCase()

      if (lowerBetType === 'moneyline') {
        betTypeVariations = ['moneyline', 'ml', 'money_line', 'Moneyline', 'ML', 'Money Line']
      } else if (lowerBetType === 'spread') {
        betTypeVariations = ['spread', 'point_spread', 'ps', 'Spread', 'Point Spread', 'PS']
      } else if (lowerBetType === 'total') {
        betTypeVariations = [
          'total',
          'over_under',
          'ou',
          'totals',
          'Total',
          'Over/Under',
          'OU',
          'Totals',
        ]
      } else if (lowerBetType === 'player_prop') {
        betTypeVariations = [
          'player_prop',
          'prop',
          'player_props',
          'Player Prop',
          'Prop',
          'Player Props',
          'player prop',
        ]
      } else if (lowerBetType === 'team_prop') {
        betTypeVariations = ['team_prop', 'team_props', 'Team Prop', 'Team Props', 'team prop']
      } else if (lowerBetType === 'game_prop') {
        betTypeVariations = ['game_prop', 'game_props', 'Game Prop', 'Game Props', 'game prop']
      } else {
        // Default case - try both exact match and lowercase
        betTypeVariations = [betType, lowerBetType, betType.toUpperCase()]
      }

      console.log('🔍 Bet type variations to match:', betTypeVariations)
      betsQuery = betsQuery.in('bet_type', betTypeVariations)
    } else {
      console.log('🔍 No bet_type filter applied (betType is All or null)')
    }

    // Apply other filters with proper null handling
    if (filters.sides && !filters.sides.includes('All') && filters.sides.length > 0) {
      console.log('🔍 Applying sides filter:', filters.sides)

      // Map sides to common variations and handle case sensitivity
      const sideVariations = []
      for (const side of filters.sides) {
        const lowerSide = side.toLowerCase()
        if (lowerSide === 'home') {
          sideVariations.push('home', 'Home', 'HOME', 'h', 'H')
        } else if (lowerSide === 'away') {
          sideVariations.push('away', 'Away', 'AWAY', 'a', 'A')
        } else if (lowerSide === 'over') {
          sideVariations.push('over', 'Over', 'OVER', 'o', 'O')
        } else if (lowerSide === 'under') {
          sideVariations.push('under', 'Under', 'UNDER', 'u', 'U')
        } else {
          sideVariations.push(side, lowerSide, side.toUpperCase())
        }
      }

      console.log('🔍 Side variations to match:', sideVariations)
      betsQuery = betsQuery.in('side', sideVariations)
    } else {
      console.log('🔍 No sides filter applied (sides is All or empty)')
    }

    if (filters.isParlays && !filters.isParlays.includes('All')) {
      const isParlay = filters.isParlays.includes('true')
      console.log('🔍 Applying parlay filter - is_parlay:', isParlay)
      betsQuery = betsQuery.eq('is_parlay', isParlay)
    } else {
      console.log('🔍 No parlay filter applied (isParlays is All or empty)')
    }

    if (filters.sportsbooks && filters.sportsbooks.length > 0) {
      console.log('🔍 Applying sportsbooks filter:', filters.sportsbooks)
      // Handle sportsbook name variations
      const sportsbookVariations = []
      for (const sportsbook of filters.sportsbooks) {
        const lowerSportsbook = sportsbook.toLowerCase()
        if (lowerSportsbook === 'draftkings' || lowerSportsbook === 'dk') {
          sportsbookVariations.push('DraftKings', 'draftkings', 'DK', 'dk', 'Draft Kings')
        } else if (lowerSportsbook === 'fanduel' || lowerSportsbook === 'fd') {
          sportsbookVariations.push('FanDuel', 'fanduel', 'FD', 'fd', 'Fan Duel')
        } else if (lowerSportsbook === 'caesars' || lowerSportsbook === 'cz') {
          sportsbookVariations.push('Caesars', 'caesars', 'CZ', 'cz', 'Caesars Sportsbook')
        } else if (lowerSportsbook === 'betmgm' || lowerSportsbook === 'mgm') {
          sportsbookVariations.push('BetMGM', 'betmgm', 'MGM', 'mgm', 'Bet MGM')
        } else if (lowerSportsbook === 'sportsgameodds' || lowerSportsbook === 'sgo') {
          sportsbookVariations.push('SportsGameOdds', 'sportsgameodds', 'SGO', 'sgo')
        } else {
          sportsbookVariations.push(sportsbook, sportsbook.toLowerCase(), sportsbook.toUpperCase())
        }
      }
      betsQuery = betsQuery.in('sportsbook', [...new Set(sportsbookVariations)])
    } else {
      console.log('🔍 No sportsbooks filter applied')
    }

    // Add additional filters that might be missing
    if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes('All')) {
      console.log('🔍 Applying status filter:', filters.statuses)

      // Handle status variations
      const statusVariations = []
      for (const status of filters.statuses) {
        const lowerStatus = status.toLowerCase()
        if (lowerStatus === 'won') {
          statusVariations.push('won', 'Won', 'WON', 'win', 'Win', 'WIN')
        } else if (lowerStatus === 'lost') {
          statusVariations.push(
            'lost',
            'Lost',
            'LOST',
            'lose',
            'Lose',
            'LOSE',
            'loss',
            'Loss',
            'LOSS'
          )
        } else if (lowerStatus === 'pending') {
          statusVariations.push('pending', 'Pending', 'PENDING', 'open', 'Open', 'OPEN')
        } else if (lowerStatus === 'void') {
          statusVariations.push(
            'void',
            'Void',
            'VOID',
            'push',
            'Push',
            'PUSH',
            'cancelled',
            'Cancelled',
            'CANCELLED'
          )
        } else {
          statusVariations.push(status, lowerStatus, status.toUpperCase())
        }
      }

      betsQuery = betsQuery.in('status', statusVariations)
    } else {
      console.log('🔍 No status filter applied')
    }

    // Add date range filter if specified - use placed_at instead of created_at for bet timing
    if (filters.customStartDate) {
      console.log('🔍 Applying start date filter:', filters.customStartDate)
      betsQuery = betsQuery.gte('placed_at', filters.customStartDate)
    }
    if (filters.customEndDate) {
      console.log('🔍 Applying end date filter:', filters.customEndDate)
      betsQuery = betsQuery.lte('placed_at', filters.customEndDate)
    }

    // Add a check to see what we would get without the sport filter
    if (sport && sport !== 'All') {
      console.log('🔍 DEBUG: Checking bets without sport filter first...')
      const debugQuery = serviceSupabase
        .from('bets')
        .select('id, sport, league, bet_type, status, sportsbook, created_at')
        .eq('user_id', finalUser.id)
        .limit(10)

      const { data: debugBets, error: debugError } = await debugQuery

      if (!debugError && debugBets && debugBets.length > 0) {
        console.log('🔍 DEBUG: Sample bets without sport filter:')
        debugBets.forEach(bet => {
          console.log(
            `   Bet: sport="${bet.sport}", league="${bet.league}", bet_type="${bet.bet_type}", status="${bet.status}", sportsbook="${bet.sportsbook}", date="${bet.created_at}"`
          )
        })

        // Check specifically for NCAAF in both sport and league columns
        const ncaafBets = debugBets.filter(bet => {
          const sportMatch =
            bet.sport &&
            (bet.sport.toLowerCase().includes('ncaaf') ||
              bet.sport.toLowerCase().includes('college football') ||
              bet.sport.toLowerCase().includes('college') ||
              bet.sport.toLowerCase().includes('ncaa'))
          const leagueMatch =
            bet.league &&
            (bet.league.toLowerCase().includes('ncaaf') ||
              bet.league.toLowerCase().includes('college football') ||
              bet.league.toLowerCase().includes('college') ||
              bet.league.toLowerCase().includes('ncaa'))
          return sportMatch || leagueMatch
        })
        console.log(
          '🔍 DEBUG: NCAAF-related bets found in sport OR league columns:',
          ncaafBets.length
        )
        if (ncaafBets.length > 0) {
          console.log(
            '🔍 DEBUG: NCAAF bet examples:',
            ncaafBets.map(b => ({ sport: b.sport, league: b.league, bet_type: b.bet_type }))
          )
        }
      }
    }

    const { data: matchingBets, error: betsError } = await betsQuery

    if (betsError) {
      console.error('Error fetching matching bets:', betsError)
      return NextResponse.json({ error: 'Failed to find matching bets' }, { status: 500 })
    }

    console.log('🔍 Found matching bets for strategy:', matchingBets?.length || 0)
    if (matchingBets && matchingBets.length > 0) {
      console.log('🔍 Sample matching bets:', matchingBets.slice(0, 2))
      console.log('🔍 Bet statuses:', [...new Set(matchingBets.map(b => b.status))])
    } else {
      console.log('❌ No matching bets found. Final query conditions were:')
      console.log(
        '   Sport filter:',
        sport,
        sport !== 'All' ? `(variations: ${JSON.stringify(sportVariations)})` : '(no filter)'
      )
      console.log(
        '   BetType filter:',
        betType,
        betType !== 'All' ? `(variations: ${JSON.stringify(betTypeVariations)})` : '(no filter)'
      )
      console.log('   Date filters:', {
        startDate: filters.customStartDate || 'none',
        endDate: filters.customEndDate || 'none',
      })
      console.log('   Other filters:', {
        sides: filters.sides,
        isParlays: filters.isParlays,
        sportsbooks: filters.sportsbooks,
        statuses: filters.statuses,
      })
    }

    // Insert strategy_bets relationships
    if (matchingBets && matchingBets.length > 0) {
      const strategyBets = matchingBets.map(bet => ({
        strategy_id: strategy.id,
        bet_id: bet.id,
        parlay_id: bet.parlay_id || null,
      }))

      const { error: strategyBetsError } = await serviceSupabase
        .from('strategy_bets')
        .insert(strategyBets)

      if (strategyBetsError) {
        console.error('Error inserting strategy_bets:', strategyBetsError)
        // Continue with strategy creation even if linking fails
      } else {
        console.log('✅ Successfully inserted', strategyBets.length, 'strategy_bets relationships')
      }

      // Get user profile for username
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('username')
        .eq('id', finalUser.id)
        .single()

      // Insert into strategy_leaderboard with initial zero values
      // The parlay-aware triggers will calculate the correct values automatically
      const { error: leaderboardError } = await serviceSupabase
        .from('strategy_leaderboard')
        .insert({
          strategy_id: strategy.id,
          user_id: finalUser.id,
          strategy_name: name,
          username: profile?.username || 'Unknown',
          total_bets: 0, // Will be calculated by trigger
          winning_bets: 0, // Will be calculated by trigger
          losing_bets: 0, // Will be calculated by trigger
          push_bets: 0, // Will be calculated by trigger
          roi_percentage: 0, // Will be calculated by trigger
          win_rate: 0, // Will be calculated by trigger
          primary_sport: sport,
          bet_type: betType,
          is_monetized: monetized,
          subscription_price_weekly: pricing_weekly,
          subscription_price_monthly: pricing_monthly,
          subscription_price_yearly: pricing_yearly,
        })

      if (leaderboardError) {
        console.error('Error inserting strategy_leaderboard:', leaderboardError)
        // Continue with strategy creation even if leaderboard fails
      } else {
        console.log('✅ Successfully inserted strategy_leaderboard entry')

        // Force trigger calculation by updating the strategy_leaderboard entry
        // This will cause the parlay-aware triggers to calculate the correct metrics
        const { error: triggerError } = await serviceSupabase
          .from('strategy_leaderboard')
          .update({ last_calculated_at: new Date().toISOString() })
          .eq('strategy_id', strategy.id)

        if (triggerError) {
          console.error('Error triggering leaderboard calculation:', triggerError)
        } else {
          console.log('✅ Triggered parlay-aware leaderboard calculation')
        }
      }

      // Strategy performance metrics will be calculated by the triggers
    } else {
      console.log('⚠️ No matching bets found - creating leaderboard entry with zero metrics')

      // Get user profile for username even when no bets
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('username')
        .eq('id', finalUser.id)
        .single()

      // Insert into strategy_leaderboard with zero metrics
      const { error: leaderboardError } = await serviceSupabase
        .from('strategy_leaderboard')
        .insert({
          strategy_id: strategy.id,
          user_id: finalUser.id,
          strategy_name: name,
          username: profile?.username || 'Unknown',
          total_bets: 0,
          winning_bets: 0,
          losing_bets: 0,
          push_bets: 0,
          roi_percentage: 0,
          win_rate: 0,
          primary_sport: sport,
          bet_type: betType,
          is_monetized: monetized,
          subscription_price_weekly: pricing_weekly,
          subscription_price_monthly: pricing_monthly,
          subscription_price_yearly: pricing_yearly,
        })

      if (leaderboardError) {
        console.error('Error inserting strategy_leaderboard (zero metrics):', leaderboardError)
      } else {
        console.log('✅ Successfully inserted strategy_leaderboard entry with zero metrics')
      }
    }

    return NextResponse.json({
      success: true,
      strategy: {
        ...strategy,
        performance_total_bets: 'Will be calculated by triggers',
      },
    })
  } catch (error) {
    console.error('Error in strategy creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get strategies from strategy_leaderboard table with strategy details
    const { data: leaderboardStrategies, error } = await supabase
      .from('strategy_leaderboard')
      .select(
        `
        *,
        strategies!inner(start_date, date_ranges, filter_config)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Strategies found:', leaderboardStrategies?.length || 0)

    // Transform leaderboard data to match expected format for frontend
    const transformedStrategies =
      leaderboardStrategies?.map(strategy => {
        // Extract start_date from strategies join or date_ranges
        const strategyData = strategy.strategies
        const startDate =
          strategyData?.start_date ||
          strategyData?.date_ranges?.start_date ||
          strategyData?.filter_config?.customStartDate ||
          null

        return {
          // Use leaderboard data directly
          id: strategy.strategy_id,
          name: strategy.strategy_name,
          description: strategy.description || '',
          status: 'active',
          filters: {
            sports: strategy.primary_sport ? [strategy.primary_sport] : [],
            betTypes: strategy.bet_type ? [strategy.bet_type] : [],
            leagues: [],
            statuses: [],
            isParlays: [],
            sides: [],
            oddsTypes: [],
            timeRange: 'All time',
            sportsbooks: [],
            customStartDate: startDate,
          },
          created_at: strategy.created_at,
          updated_at: strategy.updated_at,
          user_id: strategy.user_id,
          start_date: startDate,

          // Leaderboard performance data
          roi_percentage: strategy.roi_percentage || 0,
          win_rate: strategy.win_rate || 0,
          total_bets: strategy.total_bets || 0,
          winning_bets: strategy.winning_bets || 0,
          losing_bets: strategy.losing_bets || 0,
          push_bets: strategy.push_bets || 0,
          primary_sport: strategy.primary_sport,
          bet_type: strategy.bet_type,
          verification_status: strategy.verification_status || 'unverified',
          is_verified_seller: strategy.is_verified_seller || false,
          overall_rank: strategy.overall_rank,
          sport_rank: strategy.sport_rank,
          is_eligible: strategy.is_eligible || false,
          minimum_bets_met: strategy.minimum_bets_met || false,
          is_monetized: strategy.is_monetized || false,
          subscription_price_weekly: strategy.subscription_price_weekly,
          subscription_price_monthly: strategy.subscription_price_monthly,
          subscription_price_yearly: strategy.subscription_price_yearly,
        }
      }) || []

    return NextResponse.json({
      strategies: transformedStrategies,
    })
  } catch (error) {
    console.error('Error in GET strategies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id: strategyId, ...updates } = body

    if (!strategyId) {
      return NextResponse.json({ error: 'Strategy ID is required' }, { status: 400 })
    }

    // Verify strategy belongs to user and get current strategy data
    const { data: strategy, error: fetchError } = await supabase
      .from('strategies')
      .select(
        'id, name, description, monetized, pricing_weekly, pricing_monthly, pricing_yearly, stripe_product_id'
      )
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found or access denied' }, { status: 404 })
    }

    // Create service role client for database operations to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')

    console.log('🔐 Environment check in PATCH:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length,
    })

    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if we need to create/update Stripe products
    const isBeingMonetized = updates.monetized === true && strategy.monetized !== true
    const isPricingUpdated =
      updates.pricing_weekly !== strategy.pricing_weekly ||
      updates.pricing_monthly !== strategy.pricing_monthly ||
      updates.pricing_yearly !== strategy.pricing_yearly
    const shouldCreateStripeProduct =
      isBeingMonetized || (strategy.monetized && isPricingUpdated && !strategy.stripe_product_id)

    if (shouldCreateStripeProduct) {
      console.log('🎯 Creating/updating Stripe product for strategy:', strategyId)

      try {
        // Get seller's Stripe Connect account
        const { data: sellerProfile, error: accountError } = await serviceSupabase
          .from('profiles')
          .select('stripe_connect_account_id')
          .eq('id', user.id)
          .single()

        if (accountError || !sellerProfile?.stripe_connect_account_id) {
          console.warn('⚠️ No Stripe Connect account found for seller')
          return NextResponse.json(
            {
              error: 'Stripe Connect account required',
              details:
                'Please complete your seller onboarding first. Go to Settings to set up your payout account.',
            },
            { status: 400 }
          )
        }

        // Import stripe here to avoid issues with server-side imports
        const { stripe } = await import('@/lib/stripe')

        // Verify the Connect account is ready to accept payments
        const connectAccount = await stripe.accounts.retrieve(
          sellerProfile.stripe_connect_account_id
        )
        if (!connectAccount.details_submitted || !connectAccount.charges_enabled) {
          console.warn('⚠️ Stripe Connect account not ready for charges')
          return NextResponse.json(
            {
              error: 'Seller account setup incomplete',
              details:
                'Please complete your Stripe onboarding process to enable monetization. Check your Settings page.',
            },
            { status: 400 }
          )
        }

        // Create Stripe product on the platform account (for application fees + transfers)
        const product = await stripe.products.create({
          name: `${updates.name || strategy.name} - Strategy Subscription`,
          description:
            updates.description ||
            strategy.description ||
            `Access to ${updates.name || strategy.name} betting strategy`,
          metadata: {
            strategy_id: strategyId,
            user_id: user.id,
            strategy_name: updates.name || strategy.name,
            connect_account_id: sellerProfile.stripe_connect_account_id,
          },
        })
        // Note: No stripeAccount parameter - product created on platform account

        // Create prices for each frequency that has a value
        const priceIds: Record<string, string | null> = {
          weekly: null,
          monthly: null,
          yearly: null,
        }

        const weeklyPrice = updates.pricing_weekly || strategy.pricing_weekly
        const monthlyPrice = updates.pricing_monthly || strategy.pricing_monthly
        const yearlyPrice = updates.pricing_yearly || strategy.pricing_yearly

        if (weeklyPrice && weeklyPrice > 0) {
          const weeklyPriceObj = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(weeklyPrice * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'week',
            },
            metadata: {
              strategy_id: strategyId,
              frequency: 'weekly',
            },
          })
          priceIds.weekly = weeklyPriceObj.id
        }

        if (monthlyPrice && monthlyPrice > 0) {
          const monthlyPriceObj = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(monthlyPrice * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            metadata: {
              strategy_id: strategyId,
              frequency: 'monthly',
            },
          })
          priceIds.monthly = monthlyPriceObj.id
        }

        if (yearlyPrice && yearlyPrice > 0) {
          const yearlyPriceObj = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(yearlyPrice * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'year',
            },
            metadata: {
              strategy_id: strategyId,
              frequency: 'yearly',
            },
          })
          priceIds.yearly = yearlyPriceObj.id
        }

        // Add Stripe IDs to updates
        updates.stripe_product_id = product.id
        updates.stripe_price_weekly_id = priceIds.weekly
        updates.stripe_price_monthly_id = priceIds.monthly
        updates.stripe_price_yearly_id = priceIds.yearly
        updates.creator_account_id = sellerProfile.stripe_connect_account_id

        console.log('✅ Stripe product created:', product.id, 'with prices:', priceIds)
      } catch (stripeError) {
        console.error('❌ Error creating Stripe product:', stripeError)
        return NextResponse.json(
          {
            error: 'Failed to create Stripe products',
            details: stripeError instanceof Error ? stripeError.message : 'Unknown error',
          },
          { status: 500 }
        )
      }
    }

    // Update strategy using service role
    const { error: updateError } = await serviceSupabase
      .from('strategies')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', strategyId)

    if (updateError) {
      console.error('Error updating strategy:', updateError)
      return NextResponse.json({ error: 'Failed to update strategy' }, { status: 500 })
    }

    // Update strategy_leaderboard if relevant fields are being updated
    const leaderboardUpdates: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
    }

    // Add strategy name if updated
    if (updates.name !== undefined) {
      leaderboardUpdates.strategy_name = updates.name
    }

    // Add monetization status if updated
    if (updates.monetized !== undefined) {
      leaderboardUpdates.is_monetized = updates.monetized
    }

    // Always update pricing fields if they're provided (even if null)
    if (updates.pricing_weekly !== undefined) {
      leaderboardUpdates.subscription_price_weekly = updates.pricing_weekly
    }
    if (updates.pricing_monthly !== undefined) {
      leaderboardUpdates.subscription_price_monthly = updates.pricing_monthly
    }
    if (updates.pricing_yearly !== undefined) {
      leaderboardUpdates.subscription_price_yearly = updates.pricing_yearly
    }

    // Only update leaderboard if there are relevant changes
    if (Object.keys(leaderboardUpdates).length > 1) {
      // More than just updated_at
      console.log('Updating strategy_leaderboard with:', leaderboardUpdates)

      const { error: leaderboardError } = await serviceSupabase
        .from('strategy_leaderboard')
        .update(leaderboardUpdates)
        .eq('strategy_id', strategyId)

      if (leaderboardError) {
        console.error('Error updating strategy leaderboard:', leaderboardError)

        // Check if the strategy_leaderboard entry exists
        const { data: existingEntry, error: checkError } = await serviceSupabase
          .from('strategy_leaderboard')
          .select('id, strategy_id')
          .eq('strategy_id', strategyId)
          .single()

        if (checkError || !existingEntry) {
          console.warn('Strategy_leaderboard entry does not exist, attempting to create it...')

          // Get strategy details for leaderboard creation
          const { data: strategyDetails, error: strategyError } = await serviceSupabase
            .from('strategies')
            .select(
              'user_id, name, monetized, pricing_weekly, pricing_monthly, pricing_yearly, performance_roi, performance_win_rate, performance_total_bets'
            )
            .eq('id', strategyId)
            .single()

          if (strategyError || !strategyDetails) {
            console.error('Error fetching strategy for leaderboard creation:', strategyError)
            return NextResponse.json(
              { error: 'Failed to update strategy leaderboard' },
              { status: 500 }
            )
          }

          // Get user details
          const { data: userProfile, error: userError } = await serviceSupabase
            .from('profiles')
            .select('username, is_verified_seller')
            .eq('id', strategyDetails.user_id)
            .single()

          if (userError || !userProfile) {
            console.error('Error fetching user for leaderboard creation:', userError)
            return NextResponse.json(
              { error: 'Failed to update strategy leaderboard' },
              { status: 500 }
            )
          }

          // Create leaderboard entry
          const { error: createError } = await serviceSupabase.from('strategy_leaderboard').insert({
            strategy_id: strategyId,
            user_id: strategyDetails.user_id,
            strategy_name: strategyDetails.name,
            username: userProfile.username,
            is_verified_seller: userProfile.is_verified_seller || false,
            total_bets: strategyDetails.performance_total_bets || 0,
            winning_bets: 0,
            losing_bets: 0,
            push_bets: 0,
            roi_percentage: strategyDetails.performance_roi || 0,
            win_rate: (strategyDetails.performance_win_rate || 0) / 100,
            is_monetized: strategyDetails.monetized || false,
            subscription_price_weekly: strategyDetails.pricing_weekly,
            subscription_price_monthly: strategyDetails.pricing_monthly,
            subscription_price_yearly: strategyDetails.pricing_yearly,
            is_eligible: (strategyDetails.performance_total_bets || 0) >= 10,
            minimum_bets_met: (strategyDetails.performance_total_bets || 0) >= 10,
          })

          if (createError) {
            console.error('Error creating leaderboard entry:', createError)
            return NextResponse.json(
              { error: 'Failed to create strategy leaderboard entry' },
              { status: 500 }
            )
          }

          // Retry the update
          const { error: retryError } = await serviceSupabase
            .from('strategy_leaderboard')
            .update(leaderboardUpdates)
            .eq('strategy_id', strategyId)

          if (retryError) {
            console.error('Failed to update leaderboard after creating entry:', retryError)
            return NextResponse.json(
              { error: 'Failed to update strategy leaderboard' },
              { status: 500 }
            )
          }
        } else {
          console.error('Strategy_leaderboard entry exists but update failed:', leaderboardError)
          return NextResponse.json(
            { error: 'Failed to update strategy leaderboard' },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH strategy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get('id')

    if (!strategyId) {
      return NextResponse.json({ error: 'Strategy ID is required' }, { status: 400 })
    }

    // Verify strategy belongs to user
    const { data: strategy, error: fetchError } = await supabase
      .from('strategies')
      .select('id')
      .eq('id', strategyId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !strategy) {
      return NextResponse.json({ error: 'Strategy not found or access denied' }, { status: 404 })
    }

    // Delete strategy (cascades to strategy_bets and strategy_leaderboard)
    const { error: deleteError } = await supabase.from('strategies').delete().eq('id', strategyId)

    if (deleteError) {
      console.error('Error deleting strategy:', deleteError)
      return NextResponse.json({ error: 'Failed to delete strategy' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE strategy:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

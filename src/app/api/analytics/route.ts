import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

interface Bet {
  id: string
  user_id: string
  external_bet_id?: string
  sport: string
  league: string
  bet_type: string
  bet_description: string
  odds: number
  stake: number
  potential_payout: number
  status: string
  placed_at: string
  settled_at?: string
  game_date: string
  created_at?: string
  prop_type?: string
  player_name?: string
  home_team?: string
  away_team?: string
  profit?: number
  sportsbook?: string
  line_value?: number
  bet_source: string
  is_copy_bet: boolean
  game_id?: string
  source_strategy_id?: string
  copied_from_bet_id?: string
  strategy_id?: string
  updated_at?: string
  oddid?: string
  side?: string
  odd_source?: string
  parlay_id?: string
  is_parlay: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    
    console.log('Analytics API - userId parameter:', userIdParam?.substring(0, 8) + '...')
    
    const supabase = await createServerSupabaseClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Analytics API - session user:', user?.id?.substring(0, 8) + '...', 'auth error:', authError?.message)
    
    // Use userId from parameter if session auth fails (like bet submission)
    let finalUserId = user?.id
    let querySupabase = supabase
    
    if ((authError || !user) && userIdParam) {
      console.log('Session auth failed, validating userId parameter with service role')
      
      // Validate the userId parameter with service role
      const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      
      const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(userIdParam)
      
      if (userData?.user && !userError) {
        finalUserId = userIdParam
        querySupabase = adminSupabase // Use service role for querying
        console.log('Successfully validated userId parameter with service role - using admin client for queries')
      } else {
        console.log('Failed to validate userId parameter:', userError?.message)
        return NextResponse.json({ error: 'Unauthorized - invalid user parameter' }, { status: 401 })
      }
    } else if (authError || !user) {
      console.log('No authentication available')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('Using final user ID:', finalUserId?.substring(0, 8) + '...')

    const timeframe = searchParams.get('timeframe') || '30d'
    const startDateParam = searchParams.get('start_date')
    const endDateParam = searchParams.get('end_date')
    const sport = searchParams.get('sport')
    const betType = searchParams.get('bet_type')
    const status = searchParams.get('status')
    const isParlay = searchParams.get('is_parlay')
    const side = searchParams.get('side')
    const oddsType = searchParams.get('odds_type')
    const minOdds = searchParams.get('min_odds')
    const maxOdds = searchParams.get('max_odds')
    const minStake = searchParams.get('min_stake')
    const maxStake = searchParams.get('max_stake')

    // Calculate date range based on custom date filters or timeframe
    const now = new Date()
    let startDate: Date
    let endDate: Date | null = null
    
    // If custom start date is provided, use it instead of timeframe
    if (startDateParam) {
      startDate = new Date(startDateParam)
      // If end date is also provided, use it; otherwise, use current date
      if (endDateParam) {
        endDate = new Date(endDateParam)
      }
    } else {
      // Use timeframe logic as fallback
      switch (timeframe) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0) // All time
      }
    }
    // First, get all user bets to properly handle parlay grouping
    let query = querySupabase
      .from('bets')
      .select('*')
      .eq('user_id', finalUserId)
      .eq('is_copy_bet', false)
      .gte('placed_at', startDate.toISOString())
    
    // Add end date filter if provided
    if (endDate) {
      query = query.lte('placed_at', endDate.toISOString())
    }
    
    const { data: allBets, error } = await query.order('placed_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let bets = (allBets ?? []) as Bet[]
    
    // Apply post-query filtering while preserving parlay integrity
    if (sport) {
      // Handle multiple sports - convert to case-insensitive array
      const sportsList = sport.split(',').map(s => s.trim().toLowerCase()).filter(s => s)
      
      // For parlays: include if ANY leg matches ANY of the sport filters
      // For straight bets: include if the bet matches ANY of the sport filters
      bets = bets.filter(bet => {
        if (bet.is_parlay && bet.parlay_id) {
          // Check if any leg of this parlay matches any sport filter
          const parlayLegs = allBets.filter(b => b.parlay_id === bet.parlay_id)
          return parlayLegs.some(leg => sportsList.includes(leg.sport.toLowerCase()))
        } else {
          // Straight bet - check if it matches any sport filter
          return sportsList.includes(bet.sport.toLowerCase())
        }
      })
    }
    
    if (betType) {
      // Handle multiple bet types
      const betTypesList = betType.split(',').map(bt => bt.trim().toLowerCase()).filter(bt => bt)
      bets = bets.filter(bet => betTypesList.includes(bet.bet_type.toLowerCase()))
    }
    
    if (status && status !== 'all') {
      const statusList = status.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '')
      if (statusList.length > 0) {
        bets = bets.filter(bet => statusList.includes(bet.status.toLowerCase()))
      }
    }
    
    if (isParlay) {
      bets = bets.filter(bet => bet.is_parlay === (isParlay === 'true'))
    }
    
    if (side) {
      const sidesList = side.split(',').map(s => s.trim().toLowerCase()).filter(s => s)
      bets = bets.filter(bet => bet.side && sidesList.includes(bet.side.toLowerCase()))
    }
    
    if (minStake) {
      bets = bets.filter(bet => bet.stake >= parseFloat(minStake))
    }
    
    if (maxStake) {
      bets = bets.filter(bet => bet.stake <= parseFloat(maxStake))
    }
    
    if (minOdds) {
      bets = bets.filter(bet => bet.odds >= parseInt(minOdds))
    }
    
    if (maxOdds) {
      bets = bets.filter(bet => bet.odds <= parseInt(maxOdds))
    }
    
    // Apply underdog/favorite filter based on odds
    if (oddsType) {
      const oddsTypesList = oddsType.split(',').map(ot => ot.trim().toLowerCase()).filter(ot => ot)
      bets = bets.filter(bet => {
        const isFavorite = bet.odds < 0
        const isUnderdog = bet.odds > 0
        
        return oddsTypesList.some(type => {
          if (type === 'favorite') return isFavorite
          if (type === 'underdog') return isUnderdog
          return false
        })
      })
    }
    
    console.log(`Found ${bets.length} bets for user ${finalUserId?.substring(0, 8)}...`)
    if (bets.length > 0) {
      console.log('Sample bets:', bets.slice(0, 3).map(b => ({ 
        id: b.id.substring(0, 8) + '...', 
        sport: b.sport, 
        status: b.status, 
        stake: b.stake,
        placed_at: b.placed_at,
        is_copy_bet: b.is_copy_bet
      })))
    }

    // Calculate analytics using proper profit handling
    const totalBets = bets.length
    const settledBets = bets.filter(bet => ['won', 'lost', 'void'].includes(bet.status))
    const wonBets = bets.filter(bet => bet.status === 'won')
    const voidBets = bets.filter(bet => bet.status === 'void')
    
    const totalStake = settledBets.reduce((sum, bet) => sum + bet.stake, 0)
    
    // Enhanced profit calculation
    const netProfit = settledBets.reduce((sum, bet) => {
      if (bet.status === 'void') return sum // Void bets don't affect profit
      
      let profit = bet.profit
      if (profit === null || profit === undefined) {
        if (bet.status === 'won') {
          profit = bet.potential_payout - bet.stake
        } else if (bet.status === 'lost') {
          profit = -bet.stake
        } else {
          profit = 0
        }
      }
      return sum + profit
    }, 0)
    
    const winRate = settledBets.filter(b => b.status !== 'void').length > 0 ? 
      (wonBets.length / settledBets.filter(b => b.status !== 'void').length) * 100 : 0
    const roi = totalStake > 0 ? (netProfit / totalStake) * 100 : 0
    const avgBetSize = totalBets > 0 ? totalStake / totalBets : 0
    
    // Calculate Expected Value and CLV
    let totalClv = 0
    let clvCount = 0
    const expectedValue = settledBets.reduce((sum, bet) => {
      if (bet.status === 'void') return sum
      
      // Calculate CLV if line_value is available
      if (bet.line_value !== null && bet.line_value !== undefined) {
        const clv = ((bet.line_value - bet.odds) / bet.odds) * 100
        totalClv += clv
        clvCount++
      }
      
      // Calculate EV based on implied probability
      const impliedProb = bet.odds > 0 ? 100 / (bet.odds + 100) : Math.abs(bet.odds) / (Math.abs(bet.odds) + 100)
      const ev = (bet.potential_payout * impliedProb) - bet.stake
      return sum + ev
    }, 0)
    
    const avgClv = clvCount > 0 ? totalClv / clvCount : null
    
    // Separate straight bets and parlays
    const straightBets = settledBets.filter(bet => !bet.is_parlay)
    const parlayBets = settledBets.filter(bet => bet.is_parlay)

    // Enhanced breakdowns
    interface BreakdownStats {
      bets: number
      won: number
      stake: number
      profit: number
    }
    
    const convertBreakdownToStats = (breakdown: Record<string, BreakdownStats>, keyName: string) => {
      return Object.entries(breakdown).map(([key, stats]) => ({
        [keyName]: key,
        bets: stats.bets,
        winRate: stats.bets > 0 ? (stats.won / stats.bets) * 100 : 0,
        roi: stats.stake > 0 ? (stats.profit / stats.stake) * 100 : 0,
        profit: stats.profit
      }))
    }
    
    // Sport breakdown
    const sportBreakdown = bets.reduce((acc, bet) => {
      if (!acc[bet.sport]) {
        acc[bet.sport] = { bets: 0, won: 0, stake: 0, profit: 0 }
      }
      const stats = acc[bet.sport]!
      stats.bets += 1
      stats.stake += bet.stake
      
      let betProfit = bet.profit
      if (betProfit === null || betProfit === undefined) {
        if (bet.status === 'won') {
          betProfit = bet.potential_payout - bet.stake
        } else if (bet.status === 'lost') {
          betProfit = -bet.stake
        } else {
          betProfit = 0
        }
      }
      stats.profit += betProfit
      
      if (bet.status === 'won') {
        stats.won += 1
      }
      return acc
    }, {} as Record<string, BreakdownStats>)
    
    // Bet type breakdown
    const betTypeBreakdown = bets.reduce((acc, bet) => {
      const betTypeKey = bet.bet_type || 'Unknown'
      if (!acc[betTypeKey]) {
        acc[betTypeKey] = { bets: 0, won: 0, stake: 0, profit: 0 }
      }
      const stats = acc[betTypeKey]!
      stats.bets += 1
      stats.stake += bet.stake
      
      let betProfit = bet.profit
      if (betProfit === null || betProfit === undefined) {
        if (bet.status === 'won') {
          betProfit = bet.potential_payout - bet.stake
        } else if (bet.status === 'lost') {
          betProfit = -bet.stake
        } else {
          betProfit = 0
        }
      }
      stats.profit += betProfit
      
      if (bet.status === 'won') {
        stats.won += 1
      }
      return acc
    }, {} as Record<string, BreakdownStats>)
    
    // Prop type breakdown
    const propTypeBreakdown = bets.reduce((acc, bet) => {
      const propTypeKey = bet.prop_type || 'Standard'
      if (!acc[propTypeKey]) {
        acc[propTypeKey] = { bets: 0, won: 0, stake: 0, profit: 0 }
      }
      const stats = acc[propTypeKey]
      stats.bets += 1
      stats.stake += bet.stake
      
      let betProfit = bet.profit
      if (betProfit === null || betProfit === undefined) {
        if (bet.status === 'won') {
          betProfit = bet.potential_payout - bet.stake
        } else if (bet.status === 'lost') {
          betProfit = -bet.stake
        } else {
          betProfit = 0
        }
      }
      stats.profit += betProfit
      
      if (bet.status === 'won') {
        stats.won += 1
      }
      return acc
    }, {} as Record<string, BreakdownStats>)
    
    // Side breakdown
    const sideBreakdown = bets.reduce((acc, bet) => {
      const sideKey = bet.side || 'N/A'
      if (!acc[sideKey]) {
        acc[sideKey] = { bets: 0, won: 0, stake: 0, profit: 0 }
      }
      const stats = acc[sideKey]
      stats.bets += 1
      stats.stake += bet.stake
      
      let betProfit = bet.profit
      if (betProfit === null || betProfit === undefined) {
        if (bet.status === 'won') {
          betProfit = bet.potential_payout - bet.stake
        } else if (bet.status === 'lost') {
          betProfit = -bet.stake
        } else {
          betProfit = 0
        }
      }
      stats.profit += betProfit
      
      if (bet.status === 'won') {
        stats.won += 1
      }
      return acc
    }, {} as Record<string, BreakdownStats>)

    // Convert to arrays with calculated metrics
    const sportStats = convertBreakdownToStats(sportBreakdown, 'sport')
    const betTypeStats = convertBreakdownToStats(betTypeBreakdown, 'betType')
    const propTypeStats = convertBreakdownToStats(propTypeBreakdown, 'propType')
    const sideStats = convertBreakdownToStats(sideBreakdown, 'side')
    
    // Line movement analysis
    const lineMovementData = bets
      .filter(bet => bet.line_value !== null && bet.line_value !== undefined)
      .map(bet => {
        const clv = ((bet.line_value! - bet.odds) / bet.odds) * 100
        return {
          date: bet.placed_at.split('T')[0],
          clv,
          odds: bet.odds,
          lineValue: bet.line_value!,
          sport: bet.sport,
          betType: bet.bet_type,
          profit: bet.profit || (bet.status === 'won' ? bet.potential_payout - bet.stake : bet.status === 'lost' ? -bet.stake : 0)
        }
      })
      .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())

    // Helper function to group parlay bets for display
    function groupBetsForDisplay(rawBets: Bet[], allBetsForParlays: Bet[]) {
      const groupedBets: Array<Record<string, unknown>> = []
      const processedParlayIds = new Set<string>()
      
      for (const bet of rawBets) {
        if (bet.is_parlay && bet.parlay_id) {
          // Skip if we've already processed this parlay
          if (processedParlayIds.has(bet.parlay_id)) {
            continue
          }
          
          // Find all legs of this parlay from the complete unfiltered dataset
          const parlayLegs = allBetsForParlays.filter(b => b.parlay_id === bet.parlay_id)
          
          // Find the leg with stake/payout data (usually the first, but check for non-zero values)
          const mainLeg = parlayLegs.find(leg => leg.stake > 0 && leg.potential_payout > 0) || parlayLegs[0]
          
          // Create parlay object with enhanced description
          const uniqueSports = [...new Set(parlayLegs.map(leg => leg.sport))].sort()
          const sportsList = uniqueSports.length > 3 ? `${uniqueSports.slice(0, 3).join(', ')}...` : uniqueSports.join(', ')
          
          const parlayBet = {
            id: bet.parlay_id,
            user_id: bet.user_id,
            sport: 'Parlay', // Indicate this is a parlay
            league: 'Multiple',
            bet_type: 'parlay',
            bet_description: `${parlayLegs.length}-leg Parlay (${sportsList})`,
            odds: mainLeg?.odds || 0,
            stake: mainLeg?.stake || 0,
            potential_payout: mainLeg?.potential_payout || 0,
            status: bet.status,
            placed_at: bet.placed_at,
            settled_at: bet.settled_at,
            game_date: bet.game_date,
            profit: mainLeg?.profit || bet.profit,
            sportsbook: bet.sportsbook,
            bet_source: bet.bet_source,
            is_copy_bet: bet.is_copy_bet,
            parlay_id: bet.parlay_id,
            is_parlay: true,
            // Add parlay-specific data
            legs: parlayLegs.map(leg => ({
              id: leg.id,
              sport: leg.sport,
              league: leg.league,
              bet_type: leg.bet_type,
              bet_description: leg.bet_description,
              odds: leg.odds,
              line_value: leg.line_value,
              prop_type: leg.prop_type,
              player_name: leg.player_name,
              home_team: leg.home_team,
              away_team: leg.away_team,
              side: leg.side,
              status: leg.status
            }))
          }
          
          groupedBets.push(parlayBet)
          processedParlayIds.add(bet.parlay_id)
          
        } else {
          // Regular straight bet
          groupedBets.push({
            id: bet.id,
            user_id: bet.user_id,
            sport: bet.sport,
            league: bet.league,
            bet_type: bet.bet_type,
            bet_description: bet.bet_description,
            odds: bet.odds,
            stake: bet.stake,
            potential_payout: bet.potential_payout,
            status: bet.status,
            placed_at: bet.placed_at,
            settled_at: bet.settled_at,
            game_date: bet.game_date,
            prop_type: bet.prop_type,
            player_name: bet.player_name,
            home_team: bet.home_team,
            away_team: bet.away_team,
            profit: bet.profit,
            sportsbook: bet.sportsbook,
            line_value: bet.line_value,
            bet_source: bet.bet_source,
            is_copy_bet: bet.is_copy_bet,
            game_id: bet.game_id,
            side: bet.side,
            parlay_id: bet.parlay_id,
            is_parlay: bet.is_parlay
          })
        }
      }
      
      // Sort by placed_at date (most recent first) and return first 20
      return groupedBets
        .sort((a, b) => new Date(b.placed_at as string).getTime() - new Date(a.placed_at as string).getTime())
        .slice(0, 20)
    }
      
    // Calculate running profit for chart
    let runningProfit = 0
    const chartData = settledBets
      .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())
      .map(bet => {
        let betProfit = bet.profit
        if (betProfit === null || betProfit === undefined) {
          if (bet.status === 'won') {
            betProfit = bet.potential_payout - bet.stake
          } else if (bet.status === 'lost') {
            betProfit = -bet.stake
          } else {
            betProfit = 0
          }
        }
        runningProfit += betProfit
        return {
          date: bet.placed_at.split('T')[0] || '',
          profit: runningProfit
        }
      })

    const analytics = {
      metrics: {
        totalBets,
        winRate: Math.round(winRate * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        totalProfit: Math.round(netProfit * 100) / 100,
        totalStaked: Math.round(totalStake * 100) / 100,
        avgOdds: bets.length > 0 ? bets.reduce((sum, bet) => sum + bet.odds, 0) / bets.length : 0,
        avgStake: Math.round(avgBetSize * 100) / 100,
        biggestWin: Math.max(...settledBets.map(bet => {
          let profit = bet.profit
          if (profit === null || profit === undefined) {
            profit = bet.status === 'won' ? bet.potential_payout - bet.stake : 0
          }
          return profit
        }), 0),
        biggestLoss: Math.abs(Math.min(...settledBets.map(bet => {
          let profit = bet.profit
          if (profit === null || profit === undefined) {
            profit = bet.status === 'lost' ? -bet.stake : 0
          }
          return profit
        }), 0)),
        currentStreak: 0, // TODO: Calculate streak
        streakType: 'none' as const,
        avgClv: avgClv !== null ? Math.round(avgClv * 100) / 100 : null,
        expectedValue: Math.round(expectedValue * 100) / 100,
        profitableSports: sportStats.filter(sport => sport.profit > 0).length,
        variance: 0, // TODO: Calculate variance
        straightBetsCount: straightBets.length,
        parlayBetsCount: parlayBets.length,
        voidBetsCount: voidBets.length
      },
      sportBreakdown: sportStats || [],
      betTypeBreakdown: betTypeStats || [],
      propTypeBreakdown: propTypeStats || [],
      sideBreakdown: sideStats || [],
      lineMovementData: lineMovementData || [],
      dailyProfitData: chartData.map((item, index) => ({
        date: item.date,
        profit: index > 0 ? item.profit - (chartData[index - 1]?.profit || 0) : item.profit,
        cumulativeProfit: item.profit,
        bets: 1
      })),
      monthlyData: [],
      recentBets: groupBetsForDisplay(bets.slice(0, 30), allBets), // Get more raw bets to account for parlay grouping
      topPerformingSports: sportStats.slice(0, 5)
    }

    return NextResponse.json({ data: analytics })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
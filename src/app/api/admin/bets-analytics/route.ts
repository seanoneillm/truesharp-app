import { createServiceRoleClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

interface UnsettledBet {
  id: string
  bet_description: string
  sport: string
  league: string
  bet_type: string
  stake: number
  odds: number
  placed_at: string
  oddid: string | null
  home_team: string | null
  away_team: string | null
  player_name: string | null
  line_value: number | null
  parlay_id: string | null
  is_parlay: boolean
}

interface UnmatchedBetDescription {
  bet_description: string
  count: number
  sport: string
  league: string
  bet_type: string
  latest_occurrence: string
}

interface UnscoredOdds {
  oddid: string
  count: number
  latest_fetch: string
  sample_event: {
    hometeam: string | null
    awayteam: string | null
    marketname: string
    sportsbook: string
    leagueid: string | null
  }
}

interface BetsAnalytics {
  // Core metrics from bets table
  totalBets: number
  totalStakes: number
  totalPotentialPayout: number
  totalProfit: number
  averageStake: number
  averageOdds: number
  
  // Status breakdown from bets table
  pendingBets: number
  wonBets: number
  lostBets: number
  voidBets: number
  cancelledBets: number
  winRate: number
  
  // CRITICAL: Oddid mapping from bets table
  betsWithOddids: number
  betsWithoutOddids: number
  oddidMappingPercentage: number
  
  // Bet source breakdown from bets table
  manualBets: number
  sharpsportsBets: number
  copyBets: number
  
  // TrueSharp specific analytics
  trueSharpStats: {
    totalBets: number
    settledBets: number
    unsettledBets: number
    totalStakes: number
    totalProfit: number
    winRate: number
    settlementRate: number
  }
  
  // Parlay-aware bet counting
  trueBetCount: number // Count parlays as single bets
  parlayStats: {
    totalParlays: number
    totalParlaylegs: number
    averageLegsPerParlay: number
  }
  
  // Unsettled bets with oddid
  unsettledBetsWithOddid: UnsettledBet[]
  
  // Sharpsports bet matches analytics
  sharpSportsMatching: {
    totalNonTrueSharpBets: number
    matchedBets: number
    unmatchedBets: number
    matchingRate: number
    matchesOverTime: Array<{
      date: string
      dateLabel: string
      totalBets: number
      matchedBets: number
      matchingRate: number
    }>
    unmatchedDescriptions: UnmatchedBetDescription[]
  }
  
  // Settlement analysis - odds without scores from last 7 days
  unscoredOdds: UnscoredOdds[]
  
  // Sport/League breakdown from bets table
  betsBySport: Array<{sport: string, count: number, mappedCount: number, mappingRate: number}>
  betsByLeague: Array<{league: string, count: number, mappedCount: number, mappingRate: number}>
  betsByType: Array<{type: string, count: number, mappedCount: number, mappingRate: number}>
  
  // Time series from bets table (placed_at)
  betsPerDayData: Array<{
    date: string
    dateLabel: string
    totalBets: number
    trueBetCount: number // Parlay-aware count
    mappedBets: number
    mappingPercentage: number
    totalStakes: number
    totalProfit: number
  }>
  
  // Recent trends from bets table
  last7DaysData: {
    totalBets: number
    trueBetCount: number
    mappedBets: number
    mappingRate: number
    totalStakes: number
    totalProfit: number
  }
  
  last30DaysData: {
    totalBets: number
    trueBetCount: number
    mappedBets: number
    mappingRate: number
    totalStakes: number
    totalProfit: number
  }
}

// Helper function to fetch all data in chunks
async function fetchAllData(supabase: any, table: string, selectFields: string, orderBy?: string) {
  const CHUNK_SIZE = 1000
  let allData: any[] = []
  let hasMore = true
  let offset = 0

  while (hasMore) {
    console.log(`📊 Fetching ${table} chunk: ${offset} to ${offset + CHUNK_SIZE - 1}`)
    
    let query = supabase
      .from(table)
      .select(selectFields)
      .range(offset, offset + CHUNK_SIZE - 1)
    
    if (orderBy) {
      query = query.order(orderBy, { ascending: true })
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Error fetching ${table}: ${error.message}`)
    }
    
    if (data && data.length > 0) {
      allData = allData.concat(data)
      offset += CHUNK_SIZE
      hasMore = data.length === CHUNK_SIZE // If we got less than chunk size, we're done
    } else {
      hasMore = false
    }
  }
  
  console.log(`✅ Successfully fetched ${allData.length} records from ${table}`)
  return allData
}

export async function GET(request: NextRequest) {
  try {
    // First, create a client with user session to check admin status
    const userClient = await createServerSupabaseClient(request)

    // Get the current user
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - No user session' }, { status: 401 })
    }

    // Check if user is admin
    const adminUserIds = [
      '0e16e4f5-f206-4e62-8282-4188ff8af48a',
      '28991397-dae7-42e8-a822-0dffc6ff49b7', 
      'dfd44121-8e88-4c83-ad95-9fb8a4224908'
    ]
    
    const isAdmin = adminUserIds.includes(user.id)
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    console.log(`🔑 Admin user ${user.id} accessing ALL-TIME bets analytics`)
    
    // Use service role client for admin operations (bypasses RLS)
    const supabase = await createServiceRoleClient()
    
    const now = new Date()
    console.log(`🎯 ALL-TIME Enhanced Bets Analytics for admin user: ${user.id}`)
    console.log(`📅 Fetching ALL historical data (no time restrictions)`)

    // Fetch ALL bets data using chunked approach
    console.log('🚀 Starting to fetch ALL bets data...')
    const betsData = await fetchAllData(
      supabase,
      'bets',
      `id,
       sport,
       league,
       bet_type,
       bet_description,
       odds,
       stake,
       potential_payout,
       profit,
       status,
       placed_at,
       settled_at,
       bet_source,
       is_copy_bet,
       oddid,
       home_team,
       away_team,
       line_value,
       prop_type,
       player_name,
       sportsbook,
       parlay_id,
       is_parlay`,
      'placed_at'
    )

    // Fetch ALL sharpsports matches data using chunked approach
    console.log('🚀 Starting to fetch ALL sharpsports matches data...')
    const matchesData = await fetchAllData(
      supabase,
      'sharpsports_bet_matches',
      `bet_id,
       game_id,
       odd_id,
       bet_description,
       marketname,
       matched_at`,
      'matched_at'
    )

    const bets = betsData || []
    const matches = matchesData || []
    console.log(`✅ COMPLETE DATA RETRIEVAL:`) 
    console.log(`📊 Total bets processed: ${bets.length}`)
    console.log(`📊 Total matches processed: ${matches.length}`)

    // Parlay-aware bet counting
    const uniqueParlayIds = new Set(bets.filter(b => b.parlay_id).map(b => b.parlay_id))
    const singleBets = bets.filter(b => !b.parlay_id)
    const trueBetCount = singleBets.length + uniqueParlayIds.size
    const totalParlaylegs = bets.filter(b => b.parlay_id).length
    const averageLegsPerParlay = uniqueParlayIds.size > 0 ? totalParlaylegs / uniqueParlayIds.size : 0

    // Core metrics from bets table
    const totalBets = bets.length
    const totalStakes = bets.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
    const totalPotentialPayout = bets.reduce((sum, bet) => sum + (Number(bet.potential_payout) || 0), 0)
    const totalProfit = bets.reduce((sum, bet) => sum + (Number(bet.profit) || 0), 0)
    const averageStake = totalBets > 0 ? totalStakes / totalBets : 0
    const averageOdds = bets.length > 0 ? bets.reduce((sum, bet) => sum + (Number(bet.odds) || 0), 0) / bets.length : 0

    // Status breakdown from bets table
    const pendingBets = bets.filter(b => b.status === 'pending').length
    const wonBets = bets.filter(b => b.status === 'won').length
    const lostBets = bets.filter(b => b.status === 'lost').length
    const voidBets = bets.filter(b => b.status === 'void').length
    const cancelledBets = bets.filter(b => b.status === 'cancelled').length
    const settledBets = wonBets + lostBets
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0

    // CRITICAL: Oddid mapping from bets table
    const betsWithOddids = bets.filter(b => b.oddid !== null && b.oddid !== '').length
    const betsWithoutOddids = totalBets - betsWithOddids
    const oddidMappingPercentage = totalBets > 0 ? (betsWithOddids / totalBets) * 100 : 0

    // Source breakdown from bets table
    const manualBets = bets.filter(b => b.bet_source === 'manual').length
    const sharpsportsBets = bets.filter(b => b.bet_source === 'sharpsports').length
    const copyBets = bets.filter(b => b.is_copy_bet === true).length

    // TrueSharp specific analytics
    const trueSharpBets = bets.filter(b => b.sportsbook === 'TrueSharp')
    const trueSharpSettled = trueSharpBets.filter(b => b.status === 'won' || b.status === 'lost')
    const trueSharpWon = trueSharpBets.filter(b => b.status === 'won')
    const trueSharpStakes = trueSharpBets.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
    const trueSharpProfit = trueSharpBets.reduce((sum, bet) => sum + (Number(bet.profit) || 0), 0)
    
    const trueSharpStats = {
      totalBets: trueSharpBets.length,
      settledBets: trueSharpSettled.length,
      unsettledBets: trueSharpBets.length - trueSharpSettled.length,
      totalStakes: Math.round(trueSharpStakes * 100) / 100,
      totalProfit: Math.round(trueSharpProfit * 100) / 100,
      winRate: trueSharpSettled.length > 0 ? (trueSharpWon.length / trueSharpSettled.length) * 100 : 0,
      settlementRate: trueSharpBets.length > 0 ? (trueSharpSettled.length / trueSharpBets.length) * 100 : 0
    }

    // Get unsettled bets with oddid (sorted by most recent first)
    const unsettledBetsWithOddid: UnsettledBet[] = bets
      .filter(b => b.status === 'pending' && b.oddid)
      .sort((a, b) => new Date(b.placed_at || 0).getTime() - new Date(a.placed_at || 0).getTime())
      .map(b => ({
        id: b.id,
        bet_description: b.bet_description || '',
        sport: b.sport || '',
        league: b.league || '',
        bet_type: b.bet_type || '',
        stake: Number(b.stake) || 0,
        odds: Number(b.odds) || 0,
        placed_at: b.placed_at || '',
        oddid: b.oddid,
        home_team: b.home_team,
        away_team: b.away_team,
        player_name: b.player_name,
        line_value: b.line_value,
        parlay_id: b.parlay_id,
        is_parlay: b.is_parlay || false
      }))

    // Sharpsports matching analytics
    const matchedBetIds = new Set(matches.map(m => m.bet_id))
    const nonTrueSharpBets = bets.filter(b => b.sportsbook !== 'TrueSharp')
    const matchedNonTrueSharpBets = nonTrueSharpBets.filter(b => matchedBetIds.has(b.id))
    
    // Get unmatched bet descriptions
    const unmatchedBets = nonTrueSharpBets.filter(b => !matchedBetIds.has(b.id))
    const unmatchedByDescription = unmatchedBets.reduce((acc, bet) => {
      const desc = bet.bet_description || 'Unknown'
      if (!acc[desc]) {
        acc[desc] = {
          bet_description: desc,
          count: 0,
          sport: bet.sport || '',
          league: bet.league || '',
          bet_type: bet.bet_type || '',
          latest_occurrence: bet.placed_at || ''
        }
      }
      acc[desc].count += 1
      if (bet.placed_at && bet.placed_at > acc[desc].latest_occurrence) {
        acc[desc].latest_occurrence = bet.placed_at
      }
      return acc
    }, {} as Record<string, UnmatchedBetDescription>)

    const unmatchedDescriptions = (Object.values(unmatchedByDescription) as UnmatchedBetDescription[])
      .sort((a, b) => b.count - a.count)
      .slice(0, 50) // Top 50 most common unmatched descriptions

    const sharpSportsMatching = {
      totalNonTrueSharpBets: nonTrueSharpBets.length,
      matchedBets: matchedNonTrueSharpBets.length,
      unmatchedBets: unmatchedBets.length,
      matchingRate: nonTrueSharpBets.length > 0 ? (matchedNonTrueSharpBets.length / nonTrueSharpBets.length) * 100 : 0,
      matchesOverTime: [] as any[], // Will be populated below
      unmatchedDescriptions
    }

    // Sport breakdown from bets table
    const sportGroups = bets.reduce((acc, bet) => {
      const sport = bet.sport || 'unknown'
      if (!acc[sport]) {
        acc[sport] = { total: 0, mapped: 0 }
      }
      acc[sport].total += 1
      if (bet.oddid !== null && bet.oddid !== '') {
        acc[sport].mapped += 1
      }
      return acc
    }, {} as Record<string, { total: number, mapped: number }>)

    const betsBySport = Object.entries(sportGroups).map(([sport, data]) => {
      const groupData = data as { total: number, mapped: number }
      return {
        sport,
        count: groupData.total,
        mappedCount: groupData.mapped,
        mappingRate: groupData.total > 0 ? (groupData.mapped / groupData.total) * 100 : 0
      }
    }).sort((a, b) => b.count - a.count)

    // League breakdown from bets table
    const leagueGroups = bets.reduce((acc, bet) => {
      const league = bet.league || 'unknown'
      if (!acc[league]) {
        acc[league] = { total: 0, mapped: 0 }
      }
      acc[league].total += 1
      if (bet.oddid !== null && bet.oddid !== '') {
        acc[league].mapped += 1
      }
      return acc
    }, {} as Record<string, { total: number, mapped: number }>)

    const betsByLeague = Object.entries(leagueGroups).map(([league, data]) => {
      const groupData = data as { total: number, mapped: number }
      return {
        league,
        count: groupData.total,
        mappedCount: groupData.mapped,
        mappingRate: groupData.total > 0 ? (groupData.mapped / groupData.total) * 100 : 0
      }
    }).sort((a, b) => b.count - a.count)

    // Bet type breakdown from bets table
    const typeGroups = bets.reduce((acc, bet) => {
      const type = bet.bet_type || 'unknown'
      if (!acc[type]) {
        acc[type] = { total: 0, mapped: 0 }
      }
      acc[type].total += 1
      if (bet.oddid !== null && bet.oddid !== '') {
        acc[type].mapped += 1
      }
      return acc
    }, {} as Record<string, { total: number, mapped: number }>)

    const betsByType = Object.entries(typeGroups).map(([type, data]) => {
      const groupData = data as { total: number, mapped: number }
      return {
        type,
        count: groupData.total,
        mappedCount: groupData.mapped,
        mappingRate: groupData.total > 0 ? (groupData.mapped / groupData.total) * 100 : 0
      }
    }).sort((a, b) => b.count - a.count)

    // Time series data - last 30 days for chart visualization
    const daysCount = 30
    const betsPerDayData: BetsAnalytics['betsPerDayData'] = []

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const dayBets = bets.filter(b => {
        const placedAt = new Date(b.placed_at || '')
        return placedAt >= date && placedAt < nextDate
      })

      const dayMappedBets = dayBets.filter(b => b.oddid !== null && b.oddid !== '').length
      const dayMappingPercentage = dayBets.length > 0 ? (dayMappedBets / dayBets.length) * 100 : 0
      const dayStakes = dayBets.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
      const dayProfit = dayBets.reduce((sum, bet) => sum + (Number(bet.profit) || 0), 0)
      
      // Calculate parlay-aware count for this day
      const dayUniqueParlayIds = new Set(dayBets.filter(b => b.parlay_id).map(b => b.parlay_id))
      const daySingleBets = dayBets.filter(b => !b.parlay_id)
      const dayTrueBetCount = daySingleBets.length + dayUniqueParlayIds.size

      betsPerDayData.push({
        date: dateStr || '',
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalBets: dayBets.length,
        trueBetCount: dayTrueBetCount,
        mappedBets: dayMappedBets,
        mappingPercentage: Math.round(dayMappingPercentage * 100) / 100,
        totalStakes: Math.round(dayStakes * 100) / 100,
        totalProfit: Math.round(dayProfit * 100) / 100
      })
    }

    // Recent trends from bets table
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const recentBets7d = bets.filter(b => new Date(b.placed_at || '') >= last7Days)
    const recentMapped7d = recentBets7d.filter(b => b.oddid !== null && b.oddid !== '').length
    const recentStakes7d = recentBets7d.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
    const recentProfit7d = recentBets7d.reduce((sum, bet) => sum + (Number(bet.profit) || 0), 0)
    
    // Calculate parlay-aware count for recent periods
    const recent7dUniqueParlayIds = new Set(recentBets7d.filter(b => b.parlay_id).map(b => b.parlay_id))
    const recent7dSingleBets = recentBets7d.filter(b => !b.parlay_id)
    const recent7dTrueBetCount = recent7dSingleBets.length + recent7dUniqueParlayIds.size

    const recentBets30d = bets.filter(b => new Date(b.placed_at || '') >= last30Days)
    const recentMapped30d = recentBets30d.filter(b => b.oddid !== null && b.oddid !== '').length
    const recentStakes30d = recentBets30d.reduce((sum, bet) => sum + (Number(bet.stake) || 0), 0)
    const recentProfit30d = recentBets30d.reduce((sum, bet) => sum + (Number(bet.profit) || 0), 0)
    
    const recent30dUniqueParlayIds = new Set(recentBets30d.filter(b => b.parlay_id).map(b => b.parlay_id))
    const recent30dSingleBets = recentBets30d.filter(b => !b.parlay_id)
    const recent30dTrueBetCount = recent30dSingleBets.length + recent30dUniqueParlayIds.size

    const last7DaysData = {
      totalBets: recentBets7d.length,
      trueBetCount: recent7dTrueBetCount,
      mappedBets: recentMapped7d,
      mappingRate: recentBets7d.length > 0 ? (recentMapped7d / recentBets7d.length) * 100 : 0,
      totalStakes: Math.round(recentStakes7d * 100) / 100,
      totalProfit: Math.round(recentProfit7d * 100) / 100
    }

    const last30DaysData = {
      totalBets: recentBets30d.length,
      trueBetCount: recent30dTrueBetCount,
      mappedBets: recentMapped30d,
      mappingRate: recentBets30d.length > 0 ? (recentMapped30d / recentBets30d.length) * 100 : 0,
      totalStakes: Math.round(recentStakes30d * 100) / 100,
      totalProfit: Math.round(recentProfit30d * 100) / 100
    }

    // Calculate sharpsports matching over time - last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)

      const dayBets = nonTrueSharpBets.filter(b => {
        const placedAt = new Date(b.placed_at || '')
        return placedAt >= date && placedAt < nextDate
      })

      const dayMatchedBets = dayBets.filter(b => matchedBetIds.has(b.id)).length
      const dayMatchingRate = dayBets.length > 0 ? (dayMatchedBets / dayBets.length) * 100 : 0

      sharpSportsMatching.matchesOverTime.push({
        date: dateStr || '',
        dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalBets: dayBets.length,
        matchedBets: dayMatchedBets,
        matchingRate: Math.round(dayMatchingRate * 100) / 100
      })
    }

    // Fetch odds without scores from last 7 days (excluding today) for settlement analysis
    console.log('📊 Fetching odds without scores for settlement analysis...')
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0) // Start of today
    
    const { data: oddsData, error: oddsError } = await supabase
      .from('odds')
      .select(`
        oddid,
        hometeam,
        awayteam,
        marketname,
        sportsbook,
        leagueid,
        fetched_at,
        score
      `)
      .is('score', null)
      .gte('fetched_at', sevenDaysAgo.toISOString())
      .lt('fetched_at', todayStart.toISOString())
      .order('fetched_at', { ascending: false })

    if (oddsError) {
      console.error('❌ Error fetching odds data:', oddsError)
    } else {
      console.log(`📊 Query date range: ${sevenDaysAgo.toISOString()} to ${todayStart.toISOString()}`)
      console.log(`📊 Found ${oddsData?.length || 0} raw odds records without scores`)
    }

    // Group and analyze odds without scores
    const unscoredOddsMap = new Map<string, {
      oddid: string
      count: number
      latest_fetch: string
      sample_event: {
        hometeam: string | null
        awayteam: string | null
        marketname: string
        sportsbook: string
        leagueid: string | null
      }
    }>()

    if (oddsData) {
      // Helper function to create a grouping key for similar events
      const createGroupingKey = (oddid: string, hometeam: string | null, awayteam: string | null): string => {
        // Remove common variations and normalize team names for grouping
        const normalizeTeam = (team: string | null): string => {
          if (!team) return ''
          return team
            .toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/[^a-z0-9_]/g, '')
            .replace(/_+/g, '_')
            .trim()
        }

        const homeKey = normalizeTeam(hometeam)
        const awayKey = normalizeTeam(awayteam)
        
        // Create a key that groups similar events together
        // For player props, use the oddid as is since it should contain player info
        // For team-based events, use normalized team names
        if (homeKey && awayKey) {
          return `${homeKey}_vs_${awayKey}_${oddid}`
        } else {
          return oddid || 'unknown'
        }
      }

      oddsData.forEach(odds => {
        // Use oddid or fallback to a combination of other fields if oddid is null
        const effectiveOddid = odds.oddid || `${odds.sportsbook || 'unknown'}_${odds.marketname || 'unknown'}_${odds.hometeam || ''}_${odds.awayteam || ''}`
        
        const groupingKey = createGroupingKey(effectiveOddid, odds.hometeam, odds.awayteam)
        
        if (unscoredOddsMap.has(groupingKey)) {
          const existing = unscoredOddsMap.get(groupingKey)!
          existing.count += 1
          // Keep the latest fetch time
          if (odds.fetched_at && odds.fetched_at > existing.latest_fetch) {
            existing.latest_fetch = odds.fetched_at
          }
        } else {
          unscoredOddsMap.set(groupingKey, {
            oddid: effectiveOddid,
            count: 1,
            latest_fetch: odds.fetched_at || '',
            sample_event: {
              hometeam: odds.hometeam,
              awayteam: odds.awayteam,
              marketname: odds.marketname || '',
              sportsbook: odds.sportsbook || '',
              leagueid: odds.leagueid
            }
          })
        }
      })
    }

    const unscoredOdds = Array.from(unscoredOddsMap.values())
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .slice(0, 100) // Top 100 most common unscored odds

    console.log(`📈 Found ${unscoredOdds.length} unique unscored odds groups from last 7 days`)

    const analytics: BetsAnalytics = {
      // Core metrics from bets table
      totalBets,
      totalStakes: Math.round(totalStakes * 100) / 100,
      totalPotentialPayout: Math.round(totalPotentialPayout * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      averageStake: Math.round(averageStake * 100) / 100,
      averageOdds: Math.round(averageOdds),

      // Status breakdown from bets table
      pendingBets,
      wonBets,
      lostBets,
      voidBets,
      cancelledBets,
      winRate: Math.round(winRate * 100) / 100,

      // CRITICAL: Oddid mapping from bets table
      betsWithOddids,
      betsWithoutOddids,
      oddidMappingPercentage: Math.round(oddidMappingPercentage * 100) / 100,

      // Source breakdown from bets table
      manualBets,
      sharpsportsBets,
      copyBets,

      // TrueSharp specific analytics
      trueSharpStats,

      // Parlay-aware bet counting
      trueBetCount,
      parlayStats: {
        totalParlays: uniqueParlayIds.size,
        totalParlaylegs,
        averageLegsPerParlay: Math.round(averageLegsPerParlay * 100) / 100
      },

      // Unsettled bets with oddid
      unsettledBetsWithOddid,

      // Sharpsports bet matches analytics
      sharpSportsMatching,

      // Settlement analysis - odds without scores from last 7 days
      unscoredOdds,

      // Breakdowns from bets table
      betsBySport,
      betsByLeague,
      betsByType,

      // Time series from bets table
      betsPerDayData,

      // Recent trends from bets table
      last7DaysData,
      last30DaysData
    }

    console.log(`✅ Enhanced bets analytics calculated for admin ${user.id}`)
    console.log(`📈 Key metrics: ${totalBets} total bets, ${trueBetCount} true bets (parlay-aware)`)
    console.log(`🎯 TrueSharp: ${trueSharpStats.totalBets} bets, ${trueSharpStats.settlementRate.toFixed(1)}% settled`)
    console.log(`🔗 SharpSports matching: ${sharpSportsMatching.matchingRate.toFixed(1)}% of non-TrueSharp bets matched`)

    return NextResponse.json({ 
      success: true, 
      data: analytics,
      metadata: {
        timeframe: 'all-time',
        generatedAt: now.toISOString(),
        totalBetsProcessed: bets.length,
        totalMatchesProcessed: matches.length,
        fetchMethod: 'chunked (1000 per chunk)',
        dataSource: 'bets table + sharpsports_bet_matches table (ALL-TIME)',
        adminUserId: user.id,
        isServiceRoleAccess: true,
        chartPeriod: 'last 30 days'
      }
    })

  } catch (error) {
    console.error('❌ Enhanced Bets Analytics API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
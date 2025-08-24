import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// SportsGameOdds API sport mappings
const SPORT_MAPPINGS = {
  'NFL': { sportID: 'FOOTBALL', leagueID: 'NFL', sport_key: 'americanfootball_nfl' },
  'NBA': { sportID: 'BASKETBALL', leagueID: 'NBA', sport_key: 'basketball_nba' },
  'MLB': { sportID: 'BASEBALL', leagueID: 'MLB', sport_key: 'baseball_mlb' },
  'NHL': { sportID: 'HOCKEY', leagueID: 'NHL', sport_key: 'icehockey_nhl' },
  'NCAAF': { sportID: 'FOOTBALL', leagueID: 'NCAAF', sport_key: 'americanfootball_ncaaf' },
  'NCAAB': { sportID: 'BASKETBALL', leagueID: 'NCAAB', sport_key: 'basketball_ncaab' },
  'MLS': { sportID: 'SOCCER', leagueID: 'MLS', sport_key: 'soccer_mls' }
}

// Cache for API responses (5 minutes)
const cache = new Map<string, { data: unknown, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Transform SportsGameOdds v2 event to our format
function transformSportsGameOddsEvent(event: Record<string, unknown>): Record<string, unknown> {
  console.log('🔄 Transforming event:', event.eventID, 'for teams:', event.teams)
  
  const status = event.status as Record<string, unknown> || {}
  const teams = event.teams as Record<string, unknown> || {}
  const homeTeam = teams.home as Record<string, unknown> || {}
  const awayTeam = teams.away as Record<string, unknown> || {}
  const homeNames = homeTeam.names as Record<string, unknown> || {}
  const awayNames = awayTeam.names as Record<string, unknown> || {}
  
  return {
    eventID: event.eventID,
    sportID: event.sportID,
    leagueID: event.leagueID,
    status: status.displayShort || 'scheduled',
    teams: {
      home: {
        teamID: homeTeam.teamID,
        name: homeNames.long || homeTeam.name || 'Unknown Home Team',
        shortName: homeNames.short || homeNames.medium,
        score: homeTeam.score
      },
      away: {
        teamID: awayTeam.teamID,
        name: awayNames.long || awayTeam.name || 'Unknown Away Team',
        shortName: awayNames.short || awayNames.medium,
        score: awayTeam.score
      }
    },
    startTime: status.startsAt || new Date().toISOString(), // Use current time if no startTime provided
    odds: event.odds || {}
  }
}

// Fallback function to get games from database when API is rate limited
async function getFallbackGamesFromDatabase(
  sportMapping: { sportID: string, leagueID: string, sport_key: string }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('🔍 Fetching cached games from database for:', sportMapping.sport_key)
    
    // Get recent games from database (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        odds (*)
      `)
      .eq('sport_key', sportMapping.sport_key)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Database error:', error)
      return { games: [], count: 0, lastUpdated: new Date().toISOString() }
    }
    
    console.log('📋 Found', games?.length || 0, 'cached games in database')
    
    // Transform database games to API format
    const transformedGames = games?.map(game => ({
      ...game,
      markets: transformDatabaseOddsToMarkets(game.odds || [])
    })) || []
    
    return {
      games: transformedGames,
      count: transformedGames.length,
      lastUpdated: new Date().toISOString(),
      source: 'database_cache'
    }
    
  } catch (error) {
    console.error('❌ Error fetching fallback games:', error)
    return { games: [], count: 0, lastUpdated: new Date().toISOString() }
  }
}

// Transform database odds to market format
function transformDatabaseOddsToMarkets(odds: Array<Record<string, unknown>>) {
  const markets: Record<string, Array<Record<string, unknown>>> = {
    moneyline: [],
    spread: [],
    total: [],
    playerProps: []
  }
  
  // Group odds by market type and sportsbook
  const oddsGroups: Record<string, Array<Record<string, unknown>>> = {}
  
  odds.forEach(odd => {
    const key = `${odd.market_type}_${odd.sportsbook_key}`
    if (!oddsGroups[key]) {
      oddsGroups[key] = []
    }
    oddsGroups[key].push(odd)
  })
  
  // Transform grouped odds to market format
  Object.entries(oddsGroups).forEach(([key, oddGroup]) => {
    const [marketType, sportsbook] = key.split('_')
    
    if (marketType === 'moneyline' && oddGroup.length >= 1) {
      const homeOdd = oddGroup.find(o => o.home_odds !== null)
      const awayOdd = oddGroup.find(o => o.away_odds !== null)
      
      if (homeOdd || awayOdd) {
        markets.moneyline.push({
          sportsbook,
          homeOdds: homeOdd?.home_odds || null,
          awayOdds: awayOdd?.away_odds || null
        })
      }
    }
    // Add more market transformations as needed
  })
  
  return markets
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'NFL'
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const forceRefresh = searchParams.get('refresh') === 'true'

    console.log('🔍 API called with:', { sport, dateParam, forceRefresh })

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'SportsGameOdds API key not configured' },
        { status: 500 }
      )
    }

    const sportMapping = SPORT_MAPPINGS[sport as keyof typeof SPORT_MAPPINGS]
    if (!sportMapping) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `${sport}-${dateParam}`
    const cached = cache.get(cacheKey)
    if (cached && !forceRefresh && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📋 Using cached data for:', cacheKey)
      return NextResponse.json(cached.data)
    }

    console.log('🔍 Fetching games from SportsGameOdds API:', {
      sport,
      date: dateParam,
      sportMapping
    })

    let gamesData;
    
    try {
      // Try to fetch real data from SportsGameOdds API v2
      const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?leagueID=${sportMapping.leagueID}&type=match`
      console.log('🌐 Making API request to:', apiUrl)
      
      const response = await fetch(apiUrl, {
        headers: {
          'X-API-Key': API_KEY!,  // Capital X format as per documentation
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`SportsGameOdds API error: ${response.status} ${response.statusText}`)
      }

      gamesData = await response.json()
      console.log('📊 Real API response:', gamesData?.data?.length || 0, 'games')
      
      // SportsGameOdds v2 returns {success: true, data: [...]}
      if (!gamesData?.success || !gamesData?.data || gamesData.data.length === 0) {
        console.log('⚠️ No games from real API')
        return NextResponse.json({
          games: [],
          count: 0,
          lastUpdated: new Date().toISOString()
        })
      } else {
        // Transform SportsGameOdds data to our format
        console.log('✅ Processing real SportsGameOdds data')
        gamesData = {
          events: gamesData.data.map(transformSportsGameOddsEvent)
        }
      }
      
    } catch (apiError) {
      console.log('⚠️ SportsGameOdds API error:', apiError)
      
      // If rate limited (429) or other API error, try to serve cached games from database
      if (apiError instanceof Error && apiError.message.includes('429')) {
        console.log('🔄 Rate limited - serving games from database cache')
        const fallbackGames = await getFallbackGamesFromDatabase(sportMapping)
        if (fallbackGames.games.length > 0) {
          return NextResponse.json(fallbackGames)
        }
      }
      
      return NextResponse.json({
        error: `API Error: ${apiError}`,
        games: [],
        count: 0
      }, { status: 500 })
    }
    
    // Transform and save to database
    const transformedGames = await transformAndSaveGames(gamesData, sportMapping)

    // Cache the response
    cache.set(cacheKey, {
      data: transformedGames,
      timestamp: Date.now()
    })

    return NextResponse.json(transformedGames)

  } catch (error) {
    console.error('❌ Error in SportsGameOdds API route:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch games data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

function generateMockGames(sport: string, date: string | undefined) {
  const validDate = date || new Date().toISOString().split('T')[0]
  
  // Generate mock games based on sport
  const teams = getTeamsForSport(sport)
  const games = []

  if (!teams || teams.length === 0) {
    return { events: [] }
  }

  for (let i = 0; i < Math.min(Math.floor(teams.length / 2), 5); i++) {
    const homeTeam = teams[i * 2]
    const awayTeam = teams[i * 2 + 1]
    
    if (!homeTeam || !awayTeam) continue
    
    games.push({
      eventID: `mock-${sport}-${validDate}-${i}`,
      eventTime: new Date(validDate + 'T00:00:00.000Z').toISOString(),
      eventStatus: 'upcoming',
      homeTeam: {
        name: homeTeam.name,
        abbreviation: homeTeam.abbreviation,
        score: null
      },
      awayTeam: {
        name: awayTeam.name,
        abbreviation: awayTeam.abbreviation,
        score: null
      },
      sportsbooks: [
        {
          bookmakerID: 'fanduel',
          markets: [
            {
              betTypeID: 'moneyline',
              homeOdds: -150 + Math.floor(Math.random() * 100),
              awayOdds: 130 + Math.floor(Math.random() * 100)
            },
            {
              betTypeID: 'spread',
              homeLine: -3.5 + Math.random() * 7,
              homeOdds: -110,
              awayLine: 3.5 - Math.random() * 7,
              awayOdds: -110
            },
            {
              betTypeID: 'total',
              totalLine: 45.5 + Math.random() * 20,
              overOdds: -110,
              underOdds: -110
            }
          ]
        }
      ]
    })
  }

  return { events: games }
}

function getTeamsForSport(sport: string) {
  const teamMap: Record<string, Array<{name: string, abbreviation: string}>> = {
    'NFL': [
      { name: 'Kansas City Chiefs', abbreviation: 'KC' },
      { name: 'Buffalo Bills', abbreviation: 'BUF' },
      { name: 'Cincinnati Bengals', abbreviation: 'CIN' },
      { name: 'Baltimore Ravens', abbreviation: 'BAL' },
      { name: 'Miami Dolphins', abbreviation: 'MIA' },
      { name: 'New York Jets', abbreviation: 'NYJ' },
      { name: 'Tennessee Titans', abbreviation: 'TEN' },
      { name: 'Jacksonville Jaguars', abbreviation: 'JAX' },
      { name: 'Houston Texans', abbreviation: 'HOU' },
      { name: 'Indianapolis Colts', abbreviation: 'IND' }
    ],
    'NBA': [
      { name: 'Boston Celtics', abbreviation: 'BOS' },
      { name: 'Denver Nuggets', abbreviation: 'DEN' },
      { name: 'Milwaukee Bucks', abbreviation: 'MIL' },
      { name: 'Phoenix Suns', abbreviation: 'PHX' },
      { name: 'Philadelphia 76ers', abbreviation: 'PHI' },
      { name: 'Memphis Grizzlies', abbreviation: 'MEM' },
      { name: 'Sacramento Kings', abbreviation: 'SAC' },
      { name: 'Golden State Warriors', abbreviation: 'GSW' }
    ],
    'MLB': [
      { name: 'Los Angeles Dodgers', abbreviation: 'LAD' },
      { name: 'Houston Astros', abbreviation: 'HOU' },
      { name: 'Atlanta Braves', abbreviation: 'ATL' },
      { name: 'New York Yankees', abbreviation: 'NYY' },
      { name: 'Toronto Blue Jays', abbreviation: 'TOR' },
      { name: 'Philadelphia Phillies', abbreviation: 'PHI' }
    ],
    'NHL': [
      { name: 'Boston Bruins', abbreviation: 'BOS' },
      { name: 'Toronto Maple Leafs', abbreviation: 'TOR' },
      { name: 'New York Rangers', abbreviation: 'NYR' },
      { name: 'Carolina Hurricanes', abbreviation: 'CAR' },
      { name: 'Florida Panthers', abbreviation: 'FLA' },
      { name: 'Tampa Bay Lightning', abbreviation: 'TB' }
    ]
  }

  return teamMap[sport] || teamMap['NFL']
}

async function transformAndSaveGames(
  rawData: { events: Array<Record<string, unknown>> },
  sportMapping: { sportID: string, leagueID: string, sport_key: string }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const transformedGames: Array<Record<string, unknown>> = []

  try {
    // Process each game from the API response
    const events = rawData?.events || []
    console.log('🔄 Processing events:', events.length)
    
    for (const event of events) {
      try {
        const teams = event.teams as Record<string, unknown>
        const homeTeam = teams?.home as Record<string, unknown>
        const awayTeam = teams?.away as Record<string, unknown>
        
        // Transform SportsGameOdds event to our Game format
        const gameData = {
          odds_api_id: event.eventID,
          sport_key: sportMapping.sport_key,
          home_team_key: formatTeamKey(homeTeam?.name as string),
          away_team_key: formatTeamKey(awayTeam?.name as string),
          home_team_name: homeTeam?.name || '',
          away_team_name: awayTeam?.name || '',
          game_time: event.startTime ? new Date(event.startTime as string).toISOString() : new Date().toISOString(),
          status: event.status || 'upcoming',
          home_score: homeTeam?.score || null,
          away_score: awayTeam?.score || null,
          last_updated: new Date().toISOString()
        }

        console.log('🔄 Saving game data:', gameData.odds_api_id, gameData.home_team_name, 'vs', gameData.away_team_name)

        // Insert or update game in database
        const { data: savedGame, error: gameError } = await supabase
          .from('games')
          .upsert(gameData, {
            onConflict: 'odds_api_id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (gameError) {
          console.error('❌ Error saving game:', gameError)
          console.error('❌ Game data that failed:', gameData)
          continue
        }

        console.log('✅ Saved game:', savedGame.id)

        // Process and save odds data for SportsGameOdds format
        if (event.odds && savedGame) {
          await saveOddsDataSportsGameOdds(savedGame.id, event.odds as Record<string, unknown>)
        }

        transformedGames.push({
          ...savedGame,
          markets: transformSportsGameOddsMarkets(event.odds as Record<string, unknown> || {})
        })

      } catch (eventError) {
        console.error('❌ Error processing event:', eventError, event)
        continue
      }
    }

    console.log(`✅ Successfully processed ${transformedGames.length} games`)
    return {
      games: transformedGames,
      count: transformedGames.length,
      lastUpdated: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Error in transformAndSaveGames:', error)
    throw error
  }
}

// Save odds data in SportsGameOdds format
async function saveOddsDataSportsGameOdds(
  gameId: string,
  odds: Record<string, unknown>
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const oddsRecords: Array<Record<string, unknown>> = []

    // Helper function to safely parse and limit odds values (integers)
    const safeParseOdds = (value: string | number | undefined | null): number | null => {
      if (!value) return null
      const parsed = parseFloat(String(value))
      if (isNaN(parsed)) return null
      // Round to integer and limit to reasonable betting odds range
      const rounded = Math.round(parsed)
      return Math.min(Math.max(rounded, -9999), 9999)
    }

    // Helper function to safely parse and limit point values (decimals)
    const safeParsePoints = (value: string | number | undefined | null): number | null => {
      if (!value) return null
      const parsed = parseFloat(String(value))
      if (isNaN(parsed)) return null
      // Limit to database precision and reasonable point spread range
      const limited = Math.min(Math.max(parsed, -99.9), 99.9)
      return Math.round(limited * 10) / 10 // Round to 1 decimal place
    }

    // SportsGameOdds odds structure: { "oddID": { oddData }, ... }
    for (const [, oddData] of Object.entries(odds)) {
      const odd = oddData as Record<string, unknown>
      
      const marketName = odd.marketName as string || 'unknown'
      const betType = odd.betTypeID as string || 'unknown'
      
      let oddsRecord: Record<string, unknown> = {
        game_id: gameId,
        sportsbook_key: 'sportsGameOdds',
        market_type: marketName.toLowerCase(),
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        is_current_line: true,
        is_opening_line: false,
        line_movement_direction: null,
        steam_move: false
      }

      // Map different bet types
      if (betType === 'ml') { // Moneyline
        oddsRecord = {
          ...oddsRecord,
          home_point: null,
          away_point: null,
          home_odds: odd.sideID === 'home' ? safeParseOdds(odd.bookOdds as string) : null,
          away_odds: odd.sideID === 'away' ? safeParseOdds(odd.bookOdds as string) : null,
          total_point: null,
          over_odds: null,
          under_odds: null
        }
      } else if (betType === 'sp') { // Spread
        oddsRecord = {
          ...oddsRecord,
          home_point: odd.sideID === 'home' ? safeParsePoints(odd.bookSpread as string) : null,
          away_point: odd.sideID === 'away' ? safeParsePoints(odd.bookSpread as string) : null,
          home_odds: odd.sideID === 'home' ? safeParseOdds(odd.bookOdds as string) : null,
          away_odds: odd.sideID === 'away' ? safeParseOdds(odd.bookOdds as string) : null,
          total_point: null,
          over_odds: null,
          under_odds: null
        }
      } else if (betType === 'ou') { // Over/Under
        oddsRecord = {
          ...oddsRecord,
          home_point: null,
          away_point: null,
          home_odds: null,
          away_odds: null,
          total_point: safeParsePoints(odd.bookOverUnder as string),
          over_odds: odd.sideID === 'over' ? safeParseOdds(odd.bookOdds as string) : null,
          under_odds: odd.sideID === 'under' ? safeParseOdds(odd.bookOdds as string) : null
        }
      }

      oddsRecords.push(oddsRecord)
    }

    if (oddsRecords.length > 0) {
      const { error } = await supabase
        .from('historical_odds')
        .insert(oddsRecords)

      if (error) {
        console.error('❌ Error saving odds:', error)
      } else {
        console.log(`✅ Saved ${oddsRecords.length} odds records for game ${gameId}`)
      }
    }
  } catch (error) {
    console.error('❌ Error in saveOddsDataSportsGameOdds:', error)
  }
}

// Transform SportsGameOdds markets for frontend
function transformSportsGameOddsMarkets(odds: Record<string, unknown>) {
  const markets: Record<string, unknown[]> = {
    moneyline: [],
    spread: [],
    total: [],
    playerProps: []
  }

  for (const [, oddData] of Object.entries(odds)) {
    const odd = oddData as Record<string, unknown>
    const betType = odd.betTypeID as string
    const sideID = odd.sideID as string

    if (betType === 'ml') {
      markets.moneyline.push({
        sportsbook: 'sportsGameOdds',
        betTypeID: 'moneyline',
        homeOdds: sideID === 'home' ? parseFloat(odd.bookOdds as string || '0') : null,
        awayOdds: sideID === 'away' ? parseFloat(odd.bookOdds as string || '0') : null
      })
    } else if (betType === 'sp') {
      markets.spread.push({
        sportsbook: 'sportsGameOdds',
        betTypeID: 'spread',
        homeLine: sideID === 'home' ? parseFloat(odd.bookSpread as string || '0') : null,
        homeOdds: sideID === 'home' ? parseFloat(odd.bookOdds as string || '0') : null,
        awayLine: sideID === 'away' ? parseFloat(odd.bookSpread as string || '0') : null,
        awayOdds: sideID === 'away' ? parseFloat(odd.bookOdds as string || '0') : null
      })
    } else if (betType === 'ou') {
      markets.total.push({
        sportsbook: 'sportsGameOdds',
        betTypeID: 'total',
        totalLine: parseFloat(odd.bookOverUnder as string || '0'),
        overOdds: sideID === 'over' ? parseFloat(odd.bookOdds as string || '0') : null,
        underOdds: sideID === 'under' ? parseFloat(odd.bookOdds as string || '0') : null
      })
    }
  }

  return markets
}

async function saveOddsData(
  gameId: string,
  sportsbooks: Array<Record<string, unknown>>
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    const oddsRecords: Array<Record<string, unknown>> = []

    for (const sportsbook of sportsbooks) {
      const sportsbookName = sportsbook.bookmakerID || sportsbook.name || 'unknown'

      // Process different market types
      const markets = sportsbook.markets as Array<Record<string, unknown>> || []
      
      for (const market of markets) {
        const marketType = getMarketType(market.betTypeID as string)
        
        // Map to the correct database columns
        if (marketType === 'moneyline') {
          const oddsRecord = {
            game_id: gameId,
            sportsbook_key: sportsbookName,
            market_type: 'h2h', // moneyline is called h2h in the database
            home_odds: market.homeOdds || null,
            away_odds: market.awayOdds || null,
            is_current_line: true,
            timestamp: new Date().toISOString()
          }
          oddsRecords.push(oddsRecord)
        }
        
        if (marketType === 'spread') {
          const oddsRecord = {
            game_id: gameId,
            sportsbook_key: sportsbookName,
            market_type: 'spreads',
            home_odds: market.homeOdds || null,
            away_odds: market.awayOdds || null,
            home_point: market.homeLine || null,
            away_point: market.awayLine || null,
            is_current_line: true,
            timestamp: new Date().toISOString()
          }
          oddsRecords.push(oddsRecord)
        }
        
        if (marketType === 'total') {
          const oddsRecord = {
            game_id: gameId,
            sportsbook_key: sportsbookName,
            market_type: 'totals',
            over_odds: market.overOdds || null,
            under_odds: market.underOdds || null,
            total_point: market.totalLine || null,
            is_current_line: true,
            timestamp: new Date().toISOString()
          }
          oddsRecords.push(oddsRecord)
        }
      }
    }

    // Batch insert odds records
    if (oddsRecords.length > 0) {
      const { error: oddsError } = await supabase
        .from('historical_odds')
        .insert(oddsRecords)

      if (oddsError) {
        console.error('❌ Error saving odds:', oddsError)
      } else {
        console.log(`✅ Saved ${oddsRecords.length} odds records for game ${gameId}`)
      }
    }

  } catch (error) {
    console.error('❌ Error in saveOddsData:', error)
  }
}

function formatTeamKey(teamName: string): string {
  if (!teamName) return 'unknown'
  
  return teamName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function getMarketType(betTypeID: string): string {
  const typeMap: Record<string, string> = {
    'moneyline': 'moneyline',
    'spread': 'spread',
    'total': 'total',
    'total_points': 'total',
    'point_spread': 'spread'
  }
  
  return typeMap[betTypeID] || betTypeID
}

function transformMarkets(sportsbooks: Array<Record<string, unknown>>) {
  const markets: Record<string, Array<Record<string, unknown>>> = {
    moneyline: [],
    spread: [],
    total: [],
    playerProps: []
  }

  for (const sportsbook of sportsbooks) {
    const bookmakerName = sportsbook.bookmakerID || sportsbook.name

    if (sportsbook.markets) {
      const sportsbookMarkets = sportsbook.markets as Array<Record<string, unknown>>
      for (const market of sportsbookMarkets) {
        const marketType = getMarketType(market.betTypeID as string)
        
        if (markets[marketType]) {
          markets[marketType].push({
            sportsbook: bookmakerName,
            ...market
          })
        }

        // Add player props
        if (market.playerProps) {
          const playerProps = market.playerProps as Array<Record<string, unknown>>
          if (markets.playerProps) {
            markets.playerProps.push(...playerProps.map((prop) => ({
              ...prop,
              sportsbook: bookmakerName
            })))
          }
        }
      }
    }
  }

  return markets
}

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
  'MLS': { sportID: 'SOCCER', leagueID: 'MLS', sport_key: 'soccer_mls' },
  'UCL': { sportID: 'SOCCER', leagueID: 'UCL', sport_key: 'soccer_uefa_champs_league' }
}

// Cache for API responses (5 minutes)
const cache = new Map<string, { data: unknown, timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Fallback to database when API is rate limited
async function getFallbackDatabaseData(sportKey: string, dateParam: string) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('📀 Fetching fallback data from database for:', sportKey)
    
    // Get games from database
    // Map sport_key to actual league name used in database
    const sportMappingReverse = Object.entries(SPORT_MAPPINGS).find(([, mapping]) => 
      mapping.sport_key === sportKey
    );
    const league = sportMappingReverse ? sportMappingReverse[0] : sportKey.toUpperCase()
    
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        odds (*)
      `)
      .eq('league', league)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Database fallback error:', error)
      return NextResponse.json({ games: [], count: 0, lastUpdated: new Date().toISOString() })
    }

    console.log('📀 Found', games?.length || 0, 'games in database fallback')

    // Transform database games to frontend format
    const transformedGames = games?.map(game => ({
      ...game,
      markets: transformDatabaseOdds(game.odds || [])
    })) || []

    return NextResponse.json({
      games: transformedGames,
      count: transformedGames.length,
      lastUpdated: new Date().toISOString(),
      source: 'database_fallback'
    })

  } catch (error) {
    console.error('Database fallback error:', error)
    return NextResponse.json({ games: [], count: 0, lastUpdated: new Date().toISOString() })
  }
}

// Transform database odds to frontend market format
function transformDatabaseOdds(odds: any[]) {
  const markets = {
    moneyline: [] as any[],
    spread: [] as any[],
    total: [] as any[],
    playerProps: [] as any[]
  }

  for (const odd of odds) {
    const market = {
      sportsbook: odd.sportsbook_key || 'sportsGameOdds',
      betTypeID: odd.market_type,
      timestamp: odd.timestamp
    }

    switch (odd.market_type) {
      case 'moneyline':
        if (odd.home_odds) {
          markets.moneyline.push({
            ...market,
            homeOdds: odd.home_odds,
            awayOdds: odd.away_odds
          })
        }
        break
      case 'spread':
        if (odd.home_point !== null) {
          markets.spread.push({
            ...market,
            homeLine: odd.home_point,
            homeOdds: odd.home_odds,
            awayLine: odd.away_point,
            awayOdds: odd.away_odds
          })
        }
        break
      case 'total':
        if (odd.total_point !== null) {
          markets.total.push({
            ...market,
            totalLine: odd.total_point,
            overOdds: odd.over_odds,
            underOdds: odd.under_odds
          })
        }
        break
    }
  }

  return markets
}

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'NFL'
    const dateParam = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const customStartDate = searchParams.get('customStartDate') // ISO string (YYYY-MM-DD)
    const forceRefresh = searchParams.get('refresh') === 'true'

    console.log('🔍 API called with:', { sport, dateParam, customStartDate, forceRefresh })

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
    const cacheKey = `${sport}-${dateParam}-${customStartDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached && !forceRefresh && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('📋 Using cached data for:', cacheKey)
      return NextResponse.json(cached.data)
    }

    console.log('🔍 Fetching games from SportsGameOdds API:', {
      sport,
      date: dateParam,
      customStartDate,
      sportMapping
    })

    let gamesData;
    
    try {
      // Calculate date range for fetching games (customStartDate or today + next 7 days)
      // Use proper timezone handling for consistent date matching
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Local midnight
      
      // If customStartDate is provided, use it as the lower bound, otherwise use today
      let startDate: Date;
      if (customStartDate) {
        startDate = new Date(customStartDate + 'T00:00:00.000Z');
      } else {
        startDate = today;
      }
      
      const futureDate = new Date(startDate.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days from start
      
      // Format dates for API (YYYY-MM-DD format)
      const startISO = startDate.toISOString().split('T')[0]
      const futureDateISO = futureDate.toISOString().split('T')[0]

      // Fetch events with pagination (similar to your example)
      let nextCursor: string | null = null
      let allEvents: Record<string, unknown>[] = []

      do {
        const params = new URLSearchParams()
        params.append('leagueID', sportMapping.leagueID)
        params.append('type', 'match')
        params.append('startsAfter', startISO || '')
        params.append('startsBefore', futureDateISO || '')
        params.append('limit', '50')
        if (nextCursor) {
          params.append('cursor', nextCursor)
        }

        const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
        console.log('🌐 Making API request to:', apiUrl)
        console.log('📅 Date range:', { startsAfter: startISO, startsBefore: futureDateISO })
        console.log('🏟️ Sport details:', { 
          sport, 
          leagueID: sportMapping.leagueID, 
          sportID: sportMapping.sportID,
          sport_key: sportMapping.sport_key 
        })
        
        const response = await fetch(apiUrl, {
          headers: {
            'X-API-Key': API_KEY!,  // Capital X format as per documentation
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 429) {
            console.log('⚠️ Rate limited - falling back to database data')
            // Fall back to database data when rate limited
            return await getFallbackDatabaseData(sportMapping.sport_key, (customStartDate || dateParam || ''))
          }
          throw new Error(`SportsGameOdds API error: ${response.status} ${response.statusText}`)
        }

        const pageData = await response.json()
        console.log('📊 API page response:', pageData?.data?.length || 0, 'games')
        
        if (pageData?.success && pageData?.data) {
          allEvents = allEvents.concat(pageData.data)
          nextCursor = pageData.nextCursor
        } else {
          break
        }
        
        // Safety limit to prevent infinite loops
        if (allEvents.length > 500) {
          console.log('⚠️ Hit safety limit of 500 events, stopping pagination')
          break
        }
        
      } while (nextCursor)
      
      console.log('📊 Total events fetched:', allEvents.length)
      
      gamesData = {
        success: true,
        data: allEvents
      }
      
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
          id: event.eventID, // Use eventID as the primary key
          sport: sportMapping.leagueID, // Use league ID directly (e.g., 'MLB', 'NFL', 'NBA')
          league: sportMapping.leagueID, // Keep consistent
          home_team: normalizeTeamName(homeTeam?.name as string),
          away_team: normalizeTeamName(awayTeam?.name as string),
          home_team_name: homeTeam?.name || '',
          away_team_name: awayTeam?.name || '',
          game_time: event.startTime ? new Date(event.startTime as string).toISOString() : new Date().toISOString(),
          status: event.status || 'scheduled',
          home_score: homeTeam?.score || null,
          away_score: awayTeam?.score || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('🔄 Saving game data:', gameData.id, gameData.home_team_name, 'vs', gameData.away_team_name)

        // Insert or update game in database
        const { data: savedGame, error: gameError } = await supabase
          .from('games')
          .upsert(gameData, {
            onConflict: 'id',
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
          console.log(`🎯 Found odds data for game ${savedGame.id}:`, Object.keys(event.odds).length, 'odds entries')
          await saveOddsDataSportsGameOdds(savedGame.id, event.odds as Record<string, unknown>)
        } else {
          console.log(`⚠️ No odds data found for game ${savedGame.id}. Fetching odds separately...`)
          // Fetch odds separately for this event
          try {
            await fetchAndSaveOddsForEvent(savedGame.id, event.eventID as string, sportMapping)
          } catch (oddsError) {
            console.error(`❌ Error fetching odds for event ${event.eventID}:`, oddsError)
          }
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

// Fetch odds separately for an event
async function fetchAndSaveOddsForEvent(
  gameId: string, 
  eventId: string, 
  sportMapping: { sportID: string, leagueID: string, sport_key: string }
) {
  try {
    console.log(`🎯 Fetching odds for event ${eventId}`)
    
    // Fetch odds for this specific event
    const oddsUrl = `${SPORTSGAMEODDS_API_BASE}/events/${eventId}/odds`
    const response = await fetch(oddsUrl, {
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.log(`⚠️ Failed to fetch odds for event ${eventId}: ${response.status}`)
      return
    }

    const oddsData = await response.json()
    console.log(`✅ Fetched odds for event ${eventId}:`, oddsData?.data ? Object.keys(oddsData.data).length : 0, 'odds entries')

    if (oddsData?.success && oddsData?.data) {
      await saveOddsDataSportsGameOdds(gameId, oddsData.data)
    }

  } catch (error) {
    console.error(`❌ Error fetching odds for event ${eventId}:`, error)
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

    // Helper function to truncate strings to database field limits
    const truncateString = (value: string | undefined | null, maxLength: number): string | null => {
      if (!value) return null
      const str = String(value)
      return str.length > maxLength ? str.substring(0, maxLength) : str
    }

    // SportsGameOdds odds structure: { "oddID": { oddData }, ... }
    for (const [, oddData] of Object.entries(odds)) {
      const odd = oddData as Record<string, unknown>
      
      const marketName = odd.marketName as string || 'unknown'
      const betType = odd.betTypeID as string || 'unknown'
      
      let oddsRecord: Record<string, unknown> = {
        eventid: gameId,
        sportsbook: 'SportsGameOdds',
        marketname: truncateString(marketName, 50), // Truncate to 50 chars
        bettypeid: truncateString(betType, 50), // Truncate to 50 chars
        sideid: truncateString(odd.sideID as string, 50), // Truncate to 50 chars
        oddid: odd.oddID as string || null,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      // Map different bet types
      if (betType === 'ml') { // Moneyline
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds as string),
          line: null // No line for moneyline
        }
      } else if (betType === 'sp') { // Spread
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds as string),
          line: (odd.bookSpread || odd.fairSpread) as string || null // Spread line
        }
      } else if (betType === 'ou') { // Over/Under
        oddsRecord = {
          ...oddsRecord,
          bookodds: safeParseOdds(odd.bookOdds as string),
          line: (odd.bookOverUnder || odd.fairOverUnder) as string || null // Over/Under line
        }
      }

      oddsRecords.push(oddsRecord)
    }

    if (oddsRecords.length > 0) {
      // First, update the updated_at timestamp for all records
      const recordsWithTimestamp = oddsRecords.map(record => ({
        ...record,
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from('odds')
        .upsert(recordsWithTimestamp, {
          onConflict: 'eventid,oddid,sportsbook',
          ignoreDuplicates: false
        })

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

    // Batch upsert odds records
    if (oddsRecords.length > 0) {
      // First, update the updated_at timestamp for all records
      const recordsWithTimestamp = oddsRecords.map(record => ({
        ...record,
        updated_at: new Date().toISOString()
      }))

      const { error: oddsError } = await supabase
        .from('odds')
        .upsert(recordsWithTimestamp, {
          onConflict: 'game_id,sportsbook_key,market_type',
          ignoreDuplicates: false
        })

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

function normalizeTeamName(teamName: string): string {
  if (!teamName) return 'Unknown'
  
  // Common MLB team name normalizations to match betting data
  const teamMappings: Record<string, string> = {
    // MLB teams
    'New York Yankees': 'NY Yankees',
    'New York Mets': 'NY Mets', 
    'Los Angeles Dodgers': 'LA Dodgers',
    'Los Angeles Angels': 'LA Angels',
    'Chicago White Sox': 'Chi White Sox',
    'Chicago Cubs': 'Chi Cubs',
    'San Francisco Giants': 'SF Giants',
    'St. Louis Cardinals': 'St Louis Cardinals',
    'Tampa Bay Rays': 'Tampa Bay',
    'Kansas City Royals': 'Kansas City',
    'San Diego Padres': 'San Diego',
    'Colorado Rockies': 'Colorado',
    'Arizona Diamondbacks': 'Arizona',
    'Washington Nationals': 'Washington',
    'Minnesota Twins': 'Minnesota',
    'Cleveland Guardians': 'Cleveland',
    'Detroit Tigers': 'Detroit',
    'Milwaukee Brewers': 'Milwaukee',
    'Cincinnati Reds': 'Cincinnati',
    'Pittsburgh Pirates': 'Pittsburgh',
    'Miami Marlins': 'Miami',
    'Atlanta Braves': 'Atlanta',
    'Philadelphia Phillies': 'Philadelphia',
    'Oakland Athletics': 'Oakland',
    'Seattle Mariners': 'Seattle',
    'Texas Rangers': 'Texas',
    'Houston Astros': 'Houston',
    'Boston Red Sox': 'Boston',
    'Toronto Blue Jays': 'Toronto',
    'Baltimore Orioles': 'Baltimore'
  }
  
  // Return mapped name if available, otherwise clean up the original
  const mapped = teamMappings[teamName]
  if (mapped) return mapped
  
  // Clean up team name while preserving readability
  return teamName
    .replace(/\s+/g, ' ')
    .trim()
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

export class DataNormalizer {
  constructor() {
    this.processedOdds = new Map() // Track oddID entries
  }

  /**
   * Normalize game data from Sports Game Odds API to match database schema
   * Database schema: sport TEXT, home_team TEXT, away_team TEXT, home_team_name TEXT,
   * away_team_name TEXT, game_time TIMESTAMPTZ, status TEXT, home_score INT, away_score INT,
   * id VARCHAR(100), league VARCHAR(50)
   */
  normalizeGameData(apiEvent) {
    try {
      const teams = apiEvent.teams || {}
      const homeTeam = teams.home || {}
      const awayTeam = teams.away || {}
      const status = apiEvent.status || {}

      // Extract team names - try multiple fields
      const homeTeamName = this.extractTeamName(homeTeam)
      const awayTeamName = this.extractTeamName(awayTeam)

      // Create team keys for home_team and away_team fields
      const homeTeamKey = this.formatTeamKey(homeTeamName)
      const awayTeamKey = this.formatTeamKey(awayTeamName)

      const normalizedGame = {
        // Use eventID as the unique identifier
        id: String(apiEvent.eventID),
        sport: this.mapLeagueToSport(apiEvent.leagueID) || this.mapSportID(apiEvent.sportID),
        league: String(apiEvent.leagueID || ''),
        home_team: homeTeamKey,
        away_team: awayTeamKey,
        home_team_name: homeTeamName,
        away_team_name: awayTeamName,
        game_time: this.normalizeDateTime(status.startsAt || apiEvent.startTime),
        status: this.normalizeStatus(status.displayShort || status.status || 'scheduled'),
        home_score: this.normalizeScore(homeTeam.score),
        away_score: this.normalizeScore(awayTeam.score),
      }

      console.log(
        `📋 Normalized game: ${normalizedGame.id} - ${normalizedGame.away_team_name} @ ${normalizedGame.home_team_name}`
      )
      return normalizedGame
    } catch (error) {
      console.error('❌ Error normalizing game data:', error)
      console.error('❌ Raw event data:', JSON.stringify(apiEvent, null, 2))
      throw error
    }
  }

  /**
   * Normalize odds data from Sports Game Odds API
   * Keep the first entry for each oddID, overwrite the second
   */
  normalizeOddsData(apiEvent, gameId) {
    try {
      const odds = apiEvent.odds || {}
      const normalizedOdds = []

      for (const [oddID, oddData] of Object.entries(odds)) {
        // Check if we've seen this oddID before
        const processCount = this.processedOdds.get(oddID) || 0

        if (processCount >= 2) {
          // Skip if we already have 2 entries for this oddID
          continue
        }

        const normalizedOdd = this.normalizeOddEntry(oddData, gameId)
        if (normalizedOdd) {
          normalizedOdds.push(normalizedOdd)
          this.processedOdds.set(oddID, processCount + 1)
        }
      }

      console.log(`📊 Normalized ${normalizedOdds.length} odds entries for game ${gameId}`)
      return normalizedOdds
    } catch (error) {
      console.error('❌ Error normalizing odds data:', error)
      throw error
    }
  }

  /**
   * Normalize individual odd entry to match database schema
   */
  normalizeOddEntry(odd, eventID) {
    return {
      // Database required fields
      eventid: eventID, // References games.id
      sportsbook: 'SportsGameOdds', // Default sportsbook name
      marketname: (odd.marketName || 'Unknown Market').substring(0, 50), // Limit to 50 chars

      // Optional fields from API
      statid: odd.statID ? odd.statID.substring(0, 100) : null,
      bettypeid: odd.betTypeID ? odd.betTypeID.substring(0, 50) : null,
      oddid: odd.oddID ? odd.oddID.substring(0, 100) : null,
      playerid: odd.playerID ? odd.playerID.substring(0, 100) : null,
      periodid: odd.periodID ? odd.periodID.substring(0, 50) : null,
      sideid: odd.sideID ? odd.sideID.substring(0, 50) : null,

      // Odds values - convert odds strings to numbers where possible
      bookodds: this.parseOddsToInteger(odd.bookOdds),
      closebookodds: this.parseOddsToDecimal(odd.fairOdds),

      // Line value from bookOverUnder or fairOverUnder
      line: odd.bookOverUnder || odd.fairOverUnder || null,

      // Score value
      score:
        odd.score !== undefined && odd.score !== null ? String(odd.score).substring(0, 50) : null,

      // Timestamps
      odds_type: 'current',
      fetched_at: new Date().toISOString(),

      // Sportsbook specific odds (can be expanded later)
      fanduelodds: null,
      fanduellink: null,
      espnbetodds: null,
      espnbetlink: null,
      ceasarsodds: null,
      ceasarslink: null,
      mgmodds: null,
      mgmlink: null,
      fanaticsodds: null,
      fanaticslink: null,
      draftkingsodds: null,
      draftkingslink: null,
    }
  }

  /**
   * Parse odds string to integer (for bookodds column)
   */
  parseOddsToInteger(oddsString) {
    if (!oddsString) return null

    // Remove + sign and convert to integer
    const cleaned = String(oddsString).replace(/^\+/, '')
    const parsed = parseInt(cleaned, 10)
    return isNaN(parsed) ? null : parsed
  }

  /**
   * Parse odds string to decimal (for closebookodds column)
   */
  parseOddsToDecimal(oddsString) {
    if (!oddsString) return null

    // Convert American odds to decimal odds
    const cleaned = String(oddsString).replace(/^\+/, '')
    const americanOdds = parseInt(cleaned, 10)

    if (isNaN(americanOdds)) return null

    // Convert American odds to decimal odds
    let decimal
    if (americanOdds > 0) {
      decimal = americanOdds / 100 + 1
    } else {
      decimal = 100 / Math.abs(americanOdds) + 1
    }

    return Math.round(decimal * 100) / 100 // Round to 2 decimal places
  } // Helper methods
  extractTeamName(teamData) {
    if (!teamData) return 'Unknown Team'

    // Try multiple possible name fields
    const names = teamData.names || {}
    return (
      names.long ||
      names.medium ||
      names.short ||
      teamData.name ||
      teamData.teamName ||
      'Unknown Team'
    )
  }

  formatTeamKey(teamName) {
    if (!teamName || teamName === 'Unknown Team') return 'unknown'

    return teamName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 50) // Limit length for database
  }

  mapSportID(sportID) {
    const sportMap = {
      FOOTBALL: 'football',
      BASKETBALL: 'basketball',
      BASEBALL: 'baseball',
      HOCKEY: 'hockey',
      SOCCER: 'soccer',
    }

    return sportMap[sportID] || String(sportID).toLowerCase()
  }

  mapLeagueToSport(leagueID) {
    const leagueToSportMap = {
      MLB: 'baseball',
      NBA: 'basketball',
      NFL: 'football',
      NCAAF: 'football',
      NCAAB: 'basketball',
      NHL: 'hockey',
      MLS: 'soccer',
      UCL: 'soccer',
    }

    return leagueToSportMap[leagueID] || 'unknown'
  }

  normalizeDateTime(dateTime) {
    if (!dateTime) {
      return new Date().toISOString()
    }

    try {
      // Handle various date formats
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date:', dateTime, '- using current time')
        return new Date().toISOString()
      }
      return date.toISOString()
    } catch (error) {
      console.warn('⚠️ Date parsing error:', error, '- using current time')
      return new Date().toISOString()
    }
  }

  normalizeStatus(status) {
    if (!status) return 'scheduled'

    const statusMap = {
      scheduled: 'scheduled',
      upcoming: 'scheduled',
      live: 'live',
      in_progress: 'live',
      final: 'final',
      completed: 'final',
      cancelled: 'cancelled',
      postponed: 'postponed',
    }

    const normalizedStatus = String(status).toLowerCase()
    return statusMap[normalizedStatus] || 'scheduled'
  }

  normalizeScore(score) {
    if (score === null || score === undefined || score === '') {
      return null
    }

    const parsed = parseInt(score, 10)
    return isNaN(parsed) ? null : parsed
  }

  safeParseFloat(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const parsed = parseFloat(value)
    return isNaN(parsed) ? null : parsed
  }

  safeParseInt(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? null : parsed
  }

  // Batch normalization methods
  normalizeEventsBatch(apiEvents) {
    console.log(`🔄 Normalizing ${apiEvents.length} events...`)

    const normalizedData = {
      games: [],
      odds: [],
    }

    for (const event of apiEvents) {
      try {
        // Normalize game data
        const normalizedGame = this.normalizeGameData(event)
        normalizedData.games.push(normalizedGame)

        // Normalize odds data for this game
        const normalizedOdds = this.normalizeOddsData(event, normalizedGame.id)
        normalizedData.odds.push(...normalizedOdds)
      } catch (error) {
        console.error(`❌ Error processing event ${event.eventID}:`, error)
        // Continue processing other events
        continue
      }
    }

    console.log(
      `✅ Normalized ${normalizedData.games.length} games and ${normalizedData.odds.length} odds entries`
    )
    return normalizedData
  }

  // Reset the odds tracking for a new batch
  resetOddsTracking() {
    this.processedOdds.clear()
    console.log('🔄 Reset odds tracking for new batch')
  }
}

export default DataNormalizer

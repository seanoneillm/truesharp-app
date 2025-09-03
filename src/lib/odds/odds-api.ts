// ===========================================
// File 2: src/lib/odds/odds-api.ts
// ===========================================

import { AlternateLine, Future, Game, GameOdds, GameProp, PlayerProp } from '@/lib/types/games'

const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4'

// You'll need to get your API key from https://the-odds-api.com/
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY || 'demo-key'

// Sports available on The Odds API
export const AVAILABLE_SPORTS = [
  { key: 'americanfootball_nfl', title: 'NFL' },
  { key: 'basketball_nba', title: 'NBA' },
  { key: 'baseball_mlb', title: 'MLB' },
  { key: 'icehockey_nhl', title: 'NHL' },
  { key: 'soccer_epl', title: 'Premier League' },
  { key: 'basketball_ncaab', title: 'NCAAM' },
  { key: 'americanfootball_ncaaf', title: 'NCAAF' },
  { key: 'soccer_usa_mls', title: 'MLS' },
  { key: 'tennis_atp_french_open', title: 'ATP Tennis' },
  { key: 'mma_mixed_martial_arts', title: 'MMA' },
]

export async function fetchGamesForSport(sportKey: string, date?: Date): Promise<Game[]> {
  try {
    // Check if API key is properly configured
    if (!API_KEY || API_KEY === 'demo-key') {
      console.warn(
        'Odds API key not configured. Add NEXT_PUBLIC_ODDS_API_KEY to your environment variables.'
      )
      // Return empty array instead of throwing error for demo purposes
      return []
    }

    const params: Record<string, string> = {
      apiKey: API_KEY,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
      dateFormat: 'iso',
    }

    // Add date filtering if date is provided
    if (date) {
      // Validate the date object
      if (isNaN(date.getTime())) {
        console.error('Invalid date provided to fetchGamesForSport:', date)
        throw new Error('Invalid date provided')
      }

      // Set the date range for the entire day in LOCAL timezone to match user selection
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)

      // Convert to ISO format for API (format: YYYY-MM-DDTHH:MM:SSZ without milliseconds)
      const commenceTimeFrom = startDate.toISOString().slice(0, 19) + 'Z'
      const commenceTimeTo = endDate.toISOString().slice(0, 19) + 'Z'

      console.log('🕐 Date filtering params:')
      console.log('  Selected date:', date.toLocaleDateString())
      console.log('  Start (local):', startDate.toLocaleString())
      console.log('  End (local):', endDate.toLocaleString())
      console.log('  API From:', commenceTimeFrom)
      console.log('  API To:', commenceTimeTo)

      // Verify the format matches expected pattern: YYYY-MM-DDTHH:MM:SSZ
      const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      if (!isoPattern.test(commenceTimeFrom) || !isoPattern.test(commenceTimeTo)) {
        console.error('Invalid ISO format generated:', { commenceTimeFrom, commenceTimeTo })
        throw new Error('Failed to generate valid ISO date format')
      }

      params.commenceTimeFrom = commenceTimeFrom
      params.commenceTimeTo = commenceTimeTo
    }

    // Build URL manually to ensure proper encoding
    const searchParams = new URLSearchParams(params)
    const url = `${ODDS_API_BASE_URL}/sports/${sportKey}/odds/?${searchParams.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API Error:', response.status, errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }

    const data = await response.json()

    // Additional client-side filtering to ensure games are only for the selected date
    if (date) {
      return data.filter((game: Game) => {
        const gameDate = new Date(game.commence_time)
        // Convert game time to local timezone for comparison
        const gameYear = gameDate.getFullYear()
        const gameMonth = gameDate.getMonth()
        const gameDay = gameDate.getDate()

        // Compare with the target date (which is already in local timezone)
        const targetYear = date.getFullYear()
        const targetMonth = date.getMonth()
        const targetDay = date.getDate()

        return targetYear === gameYear && targetMonth === gameMonth && targetDay === gameDay
      })
    }

    return data
  } catch (error) {
    console.error(`Error fetching games for ${sportKey}:`, error)
    return []
  }
}

export async function fetchAllGames(date?: Date): Promise<Record<string, Game[]>> {
  const gamesBySport: Record<string, Game[]> = {}

  for (const sport of AVAILABLE_SPORTS) {
    gamesBySport[sport.key] = await fetchGamesForSport(sport.key, date)
  }

  return gamesBySport
}

export function extractGameOdds(game: Game): GameOdds {
  const gameOdds: GameOdds = {
    gameId: game.id,
    moneyline: { home: null, away: null },
    spread: { home: null, away: null },
    total: { over: null, under: null },
  }

  // Get the first bookmaker's odds (you can modify this to find best odds)
  const bookmaker = game.bookmakers[0]
  if (!bookmaker) return gameOdds

  // Extract moneyline odds
  const moneylineMarket = bookmaker.markets.find(m => m.key === 'h2h')
  if (moneylineMarket) {
    const homeOutcome = moneylineMarket.outcomes.find(o => o.name === game.home_team)
    const awayOutcome = moneylineMarket.outcomes.find(o => o.name === game.away_team)

    gameOdds.moneyline.home = homeOutcome?.price || null
    gameOdds.moneyline.away = awayOutcome?.price || null
  }

  // Extract spread odds
  const spreadMarket = bookmaker.markets.find(m => m.key === 'spreads')
  if (spreadMarket) {
    const homeOutcome = spreadMarket.outcomes.find(o => o.name === game.home_team)
    const awayOutcome = spreadMarket.outcomes.find(o => o.name === game.away_team)

    if (homeOutcome && homeOutcome.point !== undefined) {
      gameOdds.spread.home = { price: homeOutcome.price, point: homeOutcome.point }
    }
    if (awayOutcome && awayOutcome.point !== undefined) {
      gameOdds.spread.away = { price: awayOutcome.price, point: awayOutcome.point }
    }
  }

  // Extract total odds
  const totalMarket = bookmaker.markets.find(m => m.key === 'totals')
  if (totalMarket) {
    const overOutcome = totalMarket.outcomes.find(o => o.name === 'Over')
    const underOutcome = totalMarket.outcomes.find(o => o.name === 'Under')

    if (overOutcome && overOutcome.point !== undefined) {
      gameOdds.total.over = { price: overOutcome.price, point: overOutcome.point }
    }
    if (underOutcome && underOutcome.point !== undefined) {
      gameOdds.total.under = { price: underOutcome.price, point: underOutcome.point }
    }
  }

  // Add comprehensive mock data for enhanced betting markets
  gameOdds.playerProps = generateMockPlayerProps(game)
  gameOdds.alternateLines = generateMockAlternateLines(game)
  gameOdds.gameProps = generateMockGameProps(game)
  gameOdds.futures = generateMockFutures(game)

  return gameOdds
}

function generateMockPlayerProps(game: Game): PlayerProp[] {
  const props: PlayerProp[] = []
  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'Bovada', 'PointsBet']

  // Generate player names based on actual teams playing
  const playerNames = getTeamSpecificPlayers(game.home_team, game.away_team, game.sport_key)

  const propTypes = getPropTypesForSport(game.sport_key)

  playerNames.forEach(playerData => {
    propTypes.forEach(propType => {
      const baseValue = getBaseValueForProp(propType, game.sport_key, playerData.position)
      const variance = Math.random() * 6 - 3 // ±3 variance
      const line = Math.max(0.5, baseValue + variance)

      // Generate realistic American odds
      const overOdds = generateRealisticOdds()
      const underOdds = generateRealisticOdds()

      props.push({
        id: `${game.id}-${playerData.name.replace(/\s+/g, '-')}-${propType}`,
        playerName: playerData.name,
        propType,
        line: Math.round(line * 10) / 10, // Round to 1 decimal
        overPrice: overOdds,
        underPrice: underOdds,
        sportsbook: sportsbooks[Math.floor(Math.random() * sportsbooks.length)] || 'DraftKings',
      })
    })
  })

  return props.slice(0, 30) // Increased to 30 props per game
}

function generateMockAlternateLines(game: Game): AlternateLine[] {
  const lines: AlternateLine[] = []
  const sportsbooks = ['DraftKings', 'FanDuel', 'BetMGM']

  // Generate alternate spreads
  for (let i = -10; i <= 10; i += 0.5) {
    if (i !== 0) {
      lines.push({
        id: `${game.id}-spread-home-${i}`,
        type: 'spread',
        team: game.home_team,
        line: i,
        price: -110 + Math.floor(Math.random() * 40 - 20),
        sportsbook: sportsbooks[Math.floor(Math.random() * sportsbooks.length)] || 'DraftKings',
      })
    }
  }

  // Generate alternate totals
  const baseTotalValue = getBaseTotalForSport(game.sport_key)
  for (let i = baseTotalValue - 10; i <= baseTotalValue + 10; i += 0.5) {
    lines.push({
      id: `${game.id}-total-${i}`,
      type: 'total',
      line: i,
      price: -110 + Math.floor(Math.random() * 40 - 20),
      sportsbook: sportsbooks[Math.floor(Math.random() * sportsbooks.length)] || 'DraftKings',
    })
  }

  return lines.slice(0, 15) // Limit to 15 alternate lines
}

function generateMockGameProps(game: Game): GameProp[] {
  const gamePropsData = getGamePropsForSport(game.sport_key)

  if (!gamePropsData || gamePropsData.length === 0) {
    return []
  }

  return gamePropsData.map((propData, index) => ({
    id: `${game.id}-gameprop-${index}`,
    propType: propData.type,
    description: propData.description,
    options: propData.options.map((option: { name: string; basePrice: number }) => ({
      name: option.name,
      price: option.basePrice + Math.floor(Math.random() * 40 - 20),
    })),
  }))
}

function generateMockFutures(game: Game): Future[] {
  const futuresData = getFuturesForSport(game.sport_key)

  if (!futuresData || futuresData.length === 0) {
    return []
  }

  return futuresData.map((futureData, index) => ({
    id: `${game.id}-future-${index}`,
    type: futureData.type,
    description: futureData.description,
    options: futureData.options.map((option: { name: string; basePrice: number }) => ({
      name: option.name,
      price: option.basePrice + Math.floor(Math.random() * 100 - 50),
    })),
  }))
}

// Team rosters for realistic player props
function getTeamSpecificPlayers(
  homeTeam: string,
  awayTeam: string,
  sportKey: string
): Array<{ name: string; position: string; team: string }> {
  const teamRosters = getTeamRostersBySport(sportKey)

  const homePlayers = teamRosters[homeTeam] || []
  const awayPlayers = teamRosters[awayTeam] || []

  // Combine players from both teams, prioritizing star players
  const allPlayers = [...homePlayers, ...awayPlayers]

  if (allPlayers.length === 0) {
    // Fallback to generic players if no team data found
    return getGenericPlayersBySport(sportKey)
  }

  return allPlayers.slice(0, 12) // Top players from both teams
}

function getTeamRostersBySport(
  sportKey: string
): Record<string, Array<{ name: string; position: string; team: string }>> {
  switch (sportKey) {
    case 'basketball_nba':
      return {
        'Los Angeles Lakers': [
          { name: 'LeBron James', position: 'SF', team: 'LAL' },
          { name: 'Anthony Davis', position: 'PF', team: 'LAL' },
          { name: 'Russell Westbrook', position: 'PG', team: 'LAL' },
          { name: 'Austin Reaves', position: 'SG', team: 'LAL' },
        ],
        'Boston Celtics': [
          { name: 'Jayson Tatum', position: 'SF', team: 'BOS' },
          { name: 'Jaylen Brown', position: 'SG', team: 'BOS' },
          { name: 'Marcus Smart', position: 'PG', team: 'BOS' },
          { name: 'Robert Williams III', position: 'C', team: 'BOS' },
        ],
        'Golden State Warriors': [
          { name: 'Stephen Curry', position: 'PG', team: 'GSW' },
          { name: 'Klay Thompson', position: 'SG', team: 'GSW' },
          { name: 'Draymond Green', position: 'PF', team: 'GSW' },
          { name: 'Andrew Wiggins', position: 'SF', team: 'GSW' },
        ],
        'Denver Nuggets': [
          { name: 'Nikola Jokić', position: 'C', team: 'DEN' },
          { name: 'Jamal Murray', position: 'PG', team: 'DEN' },
          { name: 'Michael Porter Jr.', position: 'SF', team: 'DEN' },
          { name: 'Aaron Gordon', position: 'PF', team: 'DEN' },
        ],
      }
    case 'americanfootball_nfl':
      return {
        'Buffalo Bills': [
          { name: 'Josh Allen', position: 'QB', team: 'BUF' },
          { name: 'Stefon Diggs', position: 'WR', team: 'BUF' },
          { name: 'Von Miller', position: 'LB', team: 'BUF' },
          { name: 'James Cook', position: 'RB', team: 'BUF' },
        ],
        'Kansas City Chiefs': [
          { name: 'Patrick Mahomes', position: 'QB', team: 'KC' },
          { name: 'Travis Kelce', position: 'TE', team: 'KC' },
          { name: 'Tyreek Hill', position: 'WR', team: 'KC' },
          { name: 'Clyde Edwards-Helaire', position: 'RB', team: 'KC' },
        ],
        'San Francisco 49ers': [
          { name: 'Brock Purdy', position: 'QB', team: 'SF' },
          { name: 'Christian McCaffrey', position: 'RB', team: 'SF' },
          { name: 'Deebo Samuel', position: 'WR', team: 'SF' },
          { name: 'George Kittle', position: 'TE', team: 'SF' },
        ],
        'Philadelphia Eagles': [
          { name: 'Jalen Hurts', position: 'QB', team: 'PHI' },
          { name: 'A.J. Brown', position: 'WR', team: 'PHI' },
          { name: 'Saquon Barkley', position: 'RB', team: 'PHI' },
          { name: 'Dallas Goedert', position: 'TE', team: 'PHI' },
        ],
      }
    case 'baseball_mlb':
      return {
        'Los Angeles Dodgers': [
          { name: 'Mookie Betts', position: 'OF', team: 'LAD' },
          { name: 'Freddie Freeman', position: '1B', team: 'LAD' },
          { name: 'Walker Buehler', position: 'P', team: 'LAD' },
          { name: 'Will Smith', position: 'C', team: 'LAD' },
        ],
        'New York Yankees': [
          { name: 'Aaron Judge', position: 'OF', team: 'NYY' },
          { name: 'Gerrit Cole', position: 'P', team: 'NYY' },
          { name: 'Gleyber Torres', position: '2B', team: 'NYY' },
          { name: 'Giancarlo Stanton', position: 'DH', team: 'NYY' },
        ],
        'Atlanta Braves': [
          { name: 'Ronald Acuña Jr.', position: 'OF', team: 'ATL' },
          { name: 'Freddie Freeman', position: '1B', team: 'ATL' },
          { name: 'Spencer Strider', position: 'P', team: 'ATL' },
          { name: 'Ozzie Albies', position: '2B', team: 'ATL' },
        ],
      }
    case 'icehockey_nhl':
      return {
        'Edmonton Oilers': [
          { name: 'Connor McDavid', position: 'C', team: 'EDM' },
          { name: 'Leon Draisaitl', position: 'C', team: 'EDM' },
          { name: 'Zach Hyman', position: 'LW', team: 'EDM' },
          { name: 'Evan Bouchard', position: 'D', team: 'EDM' },
        ],
        'Boston Bruins': [
          { name: 'David Pastrnak', position: 'RW', team: 'BOS' },
          { name: 'Brad Marchand', position: 'LW', team: 'BOS' },
          { name: 'Charlie McAvoy', position: 'D', team: 'BOS' },
          { name: 'Linus Ullmark', position: 'G', team: 'BOS' },
        ],
        'Toronto Maple Leafs': [
          { name: 'Auston Matthews', position: 'C', team: 'TOR' },
          { name: 'Mitch Marner', position: 'RW', team: 'TOR' },
          { name: 'William Nylander', position: 'RW', team: 'TOR' },
          { name: 'Morgan Rielly', position: 'D', team: 'TOR' },
        ],
      }
    default:
      return {}
  }
}

function getGenericPlayersBySport(
  sportKey: string
): Array<{ name: string; position: string; team: string }> {
  const genericPlayers: Record<string, Array<{ name: string; position: string; team: string }>> = {
    basketball_nba: [
      { name: 'Star Player A', position: 'PG', team: 'Team A' },
      { name: 'Star Player B', position: 'SG', team: 'Team B' },
      { name: 'Star Player C', position: 'SF', team: 'Team A' },
      { name: 'Star Player D', position: 'PF', team: 'Team B' },
    ],
    americanfootball_nfl: [
      { name: 'Quarterback A', position: 'QB', team: 'Team A' },
      { name: 'Running Back A', position: 'RB', team: 'Team A' },
      { name: 'Wide Receiver A', position: 'WR', team: 'Team B' },
      { name: 'Tight End A', position: 'TE', team: 'Team B' },
    ],
    default: [
      { name: 'Player A', position: 'Player', team: 'Team A' },
      { name: 'Player B', position: 'Player', team: 'Team B' },
    ],
  }

  return genericPlayers[sportKey] || genericPlayers.default || []
}

function getPropTypesForSport(sportKey: string): string[] {
  const propsBySort: Record<string, string[]> = {
    basketball_nba: [
      'Points',
      'Rebounds',
      'Assists',
      '3-Pointers Made',
      'Steals',
      'Blocks',
      'Turnovers',
      'Free Throws Made',
      'Points + Rebounds + Assists',
      'Double-Double',
    ],
    americanfootball_nfl: [
      'Passing Yards',
      'Passing TDs',
      'Interceptions',
      'Completions',
      'Rushing Yards',
      'Rushing TDs',
      'Receiving Yards',
      'Receptions',
      'Receiving TDs',
      'Longest Reception',
    ],
    baseball_mlb: [
      'Hits',
      'Home Runs',
      'RBIs',
      'Runs Scored',
      'Total Bases',
      'Stolen Bases',
      'Strikeouts (Pitcher)',
      'Walks',
      'Earned Runs',
      'Innings Pitched',
    ],
    icehockey_nhl: [
      'Goals',
      'Assists',
      'Points',
      'Shots on Goal',
      'Penalty Minutes',
      'Saves',
      'Goals Against',
      'Save Percentage',
      'Time on Ice',
    ],
    default: ['Performance Metric A', 'Performance Metric B', 'Performance Metric C'],
  }

  return propsBySort[sportKey] || propsBySort['default'] || []
}

function getBaseValueForProp(propType: string, _sportKey: string, position?: string): number {
  // Position-adjusted base values for more realism
  const baseValues: Record<string, number> = {
    // NBA Props
    Points: position === 'PG' ? 22 : position === 'C' ? 20 : 24,
    Rebounds: position === 'C' ? 12 : position === 'PF' ? 9 : 6,
    Assists: position === 'PG' ? 8 : position === 'SG' ? 4 : 3,
    '3-Pointers Made': position === 'C' ? 0.5 : 2.5,
    Steals: 1.2,
    Blocks: position === 'C' ? 1.5 : 0.8,
    Turnovers: 3.2,
    'Free Throws Made': 4.5,
    'Points + Rebounds + Assists': position === 'PG' ? 35 : 32,
    'Double-Double': 0.5, // Probability prop

    // NFL Props
    'Passing Yards': position === 'QB' ? 265 : 0,
    'Passing TDs': position === 'QB' ? 1.8 : 0,
    Interceptions: position === 'QB' ? 0.8 : 0,
    Completions: position === 'QB' ? 24 : 0,
    'Rushing Yards': position === 'RB' ? 75 : position === 'QB' ? 35 : 0,
    'Rushing TDs': position === 'RB' ? 0.7 : 0,
    'Receiving Yards': position === 'WR' ? 65 : position === 'TE' ? 45 : 0,
    Receptions: position === 'WR' ? 5.5 : position === 'TE' ? 4.5 : 0,
    'Receiving TDs': position === 'WR' ? 0.6 : position === 'TE' ? 0.5 : 0,
    'Longest Reception': 18.5,

    // MLB Props
    Hits: position === 'P' ? 0 : 1.2,
    'Home Runs': position === 'P' ? 0 : 0.6,
    RBIs: position === 'P' ? 0 : 1.3,
    'Runs Scored': position === 'P' ? 0 : 1.1,
    'Total Bases': position === 'P' ? 0 : 2.2,
    'Stolen Bases': position === 'P' ? 0 : 0.3,
    'Strikeouts (Pitcher)': position === 'P' ? 6.5 : 0,
    Walks: position === 'P' ? 2.5 : 0,
    'Earned Runs': position === 'P' ? 3.2 : 0,
    'Innings Pitched': position === 'P' ? 5.5 : 0,

    // NHL Props
    Goals: position === 'G' ? 0 : position === 'D' ? 0.3 : 0.7,
    'Hockey Assists': position === 'G' ? 0 : position === 'D' ? 0.6 : 0.8,
    'Hockey Points': position === 'G' ? 0 : position === 'D' ? 0.9 : 1.5,
    'Shots on Goal': position === 'G' ? 0 : position === 'D' ? 2.5 : 3.2,
    'Penalty Minutes': position === 'G' ? 0 : 2.0,
    Saves: position === 'G' ? 28 : 0,
    'Goals Against': position === 'G' ? 2.8 : 0,
    'Save Percentage': position === 'G' ? 0.915 : 0, // As decimal
    'Time on Ice': position === 'G' ? 0 : position === 'D' ? 22 : 16, // Minutes
  }

  return baseValues[propType] || 10
}

// Generate realistic American odds
function generateRealisticOdds(): number {
  const oddsOptions = [
    -130, -125, -120, -115, -110, -105, +100, +105, +110, +115, +120, +125, +130, +135, +140,
  ]
  return oddsOptions[Math.floor(Math.random() * oddsOptions.length)] || -110
}

function getBaseTotalForSport(sportKey: string): number {
  const baseTotals: Record<string, number> = {
    basketball_nba: 225,
    americanfootball_nfl: 47,
    baseball_mlb: 8.5,
    icehockey_nhl: 6.5,
    default: 45,
  }

  return baseTotals[sportKey] || baseTotals['default'] || 45
}

function getGamePropsForSport(
  sportKey: string
): Array<{
  type: string
  description: string
  options: Array<{ name: string; basePrice: number }>
}> {
  const propsBySort: Record<
    string,
    Array<{
      type: string
      description: string
      options: Array<{ name: string; basePrice: number }>
    }>
  > = {
    basketball_nba: [
      {
        type: 'first_basket',
        description: 'First Basket Scorer',
        options: [
          { name: 'LeBron James', basePrice: 450 },
          { name: 'Stephen Curry', basePrice: 500 },
          { name: 'Any Other Player', basePrice: 200 },
        ],
      },
      {
        type: 'team_total_3pm',
        description: 'Team 3-Pointers Made',
        options: [
          { name: 'Over 12.5', basePrice: -110 },
          { name: 'Under 12.5', basePrice: -110 },
        ],
      },
    ],
    americanfootball_nfl: [
      {
        type: 'first_touchdown',
        description: 'First Touchdown Scorer',
        options: [
          { name: 'Josh Allen', basePrice: 650 },
          { name: 'Stefon Diggs', basePrice: 800 },
          { name: 'Any Other Player', basePrice: 300 },
        ],
      },
      {
        type: 'total_touchdowns',
        description: 'Total Touchdowns in Game',
        options: [
          { name: 'Over 5.5', basePrice: -105 },
          { name: 'Under 5.5', basePrice: -115 },
        ],
      },
    ],
    default: [
      {
        type: 'game_prop',
        description: 'Special Game Prop',
        options: [
          { name: 'Option A', basePrice: -110 },
          { name: 'Option B', basePrice: -110 },
        ],
      },
    ],
  }

  return propsBySort[sportKey] || propsBySort['default'] || []
}

function getFuturesForSport(
  sportKey: string
): Array<{
  type: string
  description: string
  options: Array<{ name: string; basePrice: number }>
}> {
  const futuresBySort: Record<
    string,
    Array<{
      type: string
      description: string
      options: Array<{ name: string; basePrice: number }>
    }>
  > = {
    basketball_nba: [
      {
        type: 'championship',
        description: 'NBA Championship Winner',
        options: [
          { name: 'Boston Celtics', basePrice: 450 },
          { name: 'Denver Nuggets', basePrice: 550 },
          { name: 'Phoenix Suns', basePrice: 650 },
        ],
      },
    ],
    americanfootball_nfl: [
      {
        type: 'super_bowl',
        description: 'Super Bowl Winner',
        options: [
          { name: 'Buffalo Bills', basePrice: 650 },
          { name: 'Kansas City Chiefs', basePrice: 550 },
          { name: 'San Francisco 49ers', basePrice: 750 },
        ],
      },
    ],
    default: [
      {
        type: 'season_winner',
        description: 'Season Championship',
        options: [
          { name: 'Team A', basePrice: 200 },
          { name: 'Team B', basePrice: 300 },
        ],
      },
    ],
  }

  return futuresBySort[sportKey] || futuresBySort.default || []
}

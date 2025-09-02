import { createClient } from '@/lib/supabase'
import { isOverUnderMarket, isYesNoMarket, parseOddID } from './oddid-parser'

export interface OddsData {
  odds: number
  sportsbook: string
  line?: number | string
}

export interface PlayerProp {
  playerId: string
  playerName: string
  market: string
  over?: OddsData
  under?: OddsData
}

export interface TeamProp {
  team: 'home' | 'away'
  teamName: string
  market: string
  over?: OddsData
  under?: OddsData
}

export interface GameProp {
  market: string
  over?: OddsData
  under?: OddsData
}

export interface MLBGameOdds {
  gameId: string
  mainLines: {
    moneyline: { home?: OddsData; away?: OddsData }
    runLine: { home?: OddsData; away?: OddsData }
    total: { over?: OddsData; under?: OddsData }
  }
  playerProps: {
    hitters: PlayerProp[]
    pitchers: PlayerProp[]
  }
  teamProps: TeamProp[]
  gameProps: GameProp[]
}

export interface DatabaseOdd {
  id: string
  eventid: string
  sportsbook: string
  marketname: string
  oddid: string | null
  playerid: string | null
  line: string | null
  bookodds: number | null
  closebookodds: number | null
  // Legacy sportsbook columns (may not be populated)
  fanduelodds?: number | null
  draftkingsodds?: number | null
  espnbetodds?: number | null
  ceasarsodds?: number | null
  mgmodds?: number | null
  fanaticsodds?: number | null
}

const SPORTSBOOK_COLUMNS = [
  'bookodds',
  'fanduelodds',
  'draftkingsodds',
  'espnbetodds',
  'ceasarsodds',
  'mgmodds',
  'fanaticsodds',
] as const

const SPORTSBOOK_NAMES = {
  bookodds: 'SportsGameOdds',
  fanduelodds: 'FanDuel',
  draftkingsodds: 'DraftKings',
  espnbetodds: 'ESPN BET',
  ceasarsodds: 'Caesars',
  mgmodds: 'BetMGM',
  fanaticsodds: 'Fanatics',
} as const

export function processMLBOdds(odds: DatabaseOdd[]): MLBGameOdds[] {
  const gameOddsMap = new Map<string, MLBGameOdds>()

  // Group odds by game
  for (const odd of odds) {
    if (!gameOddsMap.has(odd.eventid)) {
      gameOddsMap.set(odd.eventid, {
        gameId: odd.eventid,
        mainLines: {
          moneyline: {},
          runLine: {},
          total: {},
        },
        playerProps: {
          hitters: [],
          pitchers: [],
        },
        teamProps: [],
        gameProps: [],
      })
    }

    const gameOdds = gameOddsMap.get(odd.eventid)!

    // Skip if no oddID to parse
    if (!odd.oddid) continue

    const parsed = parseOddID(odd.oddid)
    if (!parsed) continue

    // Find best odds across sportsbooks for this market
    const bestOdds = findBestOdds(odd)
    if (!bestOdds) continue

    // Process based on category
    if (parsed.category === 'main_lines') {
      processMainLines(gameOdds, parsed, bestOdds, odd)
    } else if (parsed.category === 'hitters' || parsed.category === 'pitchers') {
      processPlayerProps(gameOdds, parsed, bestOdds, odd)
    } else if (parsed.category === 'team_props') {
      processTeamProps(gameOdds, parsed, bestOdds, odd)
    } else if (parsed.category === 'game_props') {
      processGameProps(gameOdds, parsed, bestOdds, odd)
    }
  }

  return Array.from(gameOddsMap.values())
}

function findBestOdds(odd: DatabaseOdd): OddsData | null {
  let bestOdds: OddsData | null = null

  // Primary check: use bookodds if available
  if (odd.bookodds !== null && odd.bookodds !== undefined) {
    bestOdds = {
      odds: odd.bookodds,
      sportsbook: 'SportsGameOdds',
      line: odd.line ? parseFloat(odd.line) : undefined,
    }
  }

  // Fallback: check legacy sportsbook columns
  for (const column of SPORTSBOOK_COLUMNS) {
    if (column === 'bookodds') continue // Already handled above

    const oddsValue = odd[column as keyof DatabaseOdd] as number | null | undefined
    if (oddsValue !== null && oddsValue !== undefined) {
      const sportsbookName = SPORTSBOOK_NAMES[column as keyof typeof SPORTSBOOK_NAMES]

      // For positive odds, higher is better. For negative odds, closer to 0 is better
      if (!bestOdds || isBetterOdds(oddsValue, bestOdds.odds)) {
        bestOdds = {
          odds: oddsValue,
          sportsbook: sportsbookName,
          line: odd.line ? parseFloat(odd.line) : undefined,
        }
      }
    }
  }

  return bestOdds
}

function isBetterOdds(newOdds: number, currentOdds: number): boolean {
  // For positive odds, higher is better
  if (newOdds > 0 && currentOdds > 0) {
    return newOdds > currentOdds
  }
  // For negative odds, closer to 0 is better (higher absolute value)
  if (newOdds < 0 && currentOdds < 0) {
    return Math.abs(newOdds) < Math.abs(currentOdds)
  }
  // If one is positive and one is negative, positive is always better
  if (newOdds > 0 && currentOdds < 0) {
    return true
  }
  if (newOdds < 0 && currentOdds > 0) {
    return false
  }

  return false
}

function processMainLines(
  gameOdds: MLBGameOdds,
  parsed: any,
  bestOdds: OddsData,
  odd: DatabaseOdd
) {
  const { betType, side } = parsed

  if (betType === 'ml') {
    // Moneyline
    if (side === 'home') {
      gameOdds.mainLines.moneyline.home = bestOdds
    } else if (side === 'away') {
      gameOdds.mainLines.moneyline.away = bestOdds
    }
  } else if (betType === 'sp') {
    // Run line (spread)
    if (side === 'home') {
      gameOdds.mainLines.runLine.home = bestOdds
    } else if (side === 'away') {
      gameOdds.mainLines.runLine.away = bestOdds
    }
  } else if (betType === 'ou') {
    // Total
    if (side === 'over') {
      gameOdds.mainLines.total.over = bestOdds
    } else if (side === 'under') {
      gameOdds.mainLines.total.under = bestOdds
    }
  }
}

function processPlayerProps(
  gameOdds: MLBGameOdds,
  parsed: any,
  bestOdds: OddsData,
  odd: DatabaseOdd
) {
  const { category, identifier, displayName, side } = parsed

  if (!parsed.isPlayerProp) return

  const playerId = identifier
  const playerName = derivePlayerName(playerId)
  const propCategory = category === 'hitters' ? 'hitters' : 'pitchers'

  // Find or create player prop
  let playerProp = gameOdds.playerProps[propCategory].find(
    p => p.playerId === playerId && p.market === displayName
  )

  if (!playerProp) {
    playerProp = {
      playerId,
      playerName,
      market: displayName,
      over: undefined,
      under: undefined,
    }
    gameOdds.playerProps[propCategory].push(playerProp)
  }

  // Assign odds to over/under
  if (side === 'over') {
    playerProp.over = bestOdds
  } else if (side === 'under') {
    playerProp.under = bestOdds
  }
}

function processTeamProps(
  gameOdds: MLBGameOdds,
  parsed: any,
  bestOdds: OddsData,
  odd: DatabaseOdd
) {
  const { identifier, displayName, side } = parsed

  if (identifier !== 'home' && identifier !== 'away') return

  const team = identifier as 'home' | 'away'
  const teamName = team === 'home' ? 'Home Team' : 'Away Team'

  // Find or create team prop
  let teamProp = gameOdds.teamProps.find(p => p.team === team && p.market === displayName)

  if (!teamProp) {
    teamProp = {
      team,
      teamName,
      market: displayName,
      over: undefined,
      under: undefined,
    }
    gameOdds.teamProps.push(teamProp)
  }

  // Assign odds to over/under
  if (side === 'over') {
    teamProp.over = bestOdds
  } else if (side === 'under') {
    teamProp.under = bestOdds
  }
}

function processGameProps(
  gameOdds: MLBGameOdds,
  parsed: any,
  bestOdds: OddsData,
  odd: DatabaseOdd
) {
  const { displayName, side } = parsed

  // Find or create game prop
  let gameProp = gameOdds.gameProps.find(p => p.market === displayName)

  if (!gameProp) {
    gameProp = {
      market: displayName,
      over: undefined,
      under: undefined,
    }
    gameOdds.gameProps.push(gameProp)
  }

  // Assign odds to over/under
  if (side === 'over') {
    gameProp.over = bestOdds
  } else if (side === 'under') {
    gameProp.under = bestOdds
  }
}

function derivePlayerName(playerId: string): string {
  // Convert player ID to display name
  // Example: "TREVOR_LARNACH_1_MLB" -> "Trevor Larnach"

  if (!playerId) return 'Unknown Player'

  // Remove the _1_MLB suffix if present
  const cleanId = playerId.replace(/_\d+_MLB$/, '')

  // Split by underscore and convert to proper case
  const nameParts = cleanId
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())

  return nameParts.join(' ')
}

export function getMainLinesForGame(gameOdds: MLBGameOdds) {
  return gameOdds.mainLines
}

export function getPlayerPropsForGame(gameOdds: MLBGameOdds, category: 'hitters' | 'pitchers') {
  return gameOdds.playerProps[category]
}

export function formatOddsDisplay(odds: number): string {
  if (odds > 0) {
    return `+${odds}`
  }
  return odds.toString()
}

/**
 * Fetch and process MLB odds for a specific game from database
 */
export async function getMLBGameOdds(gameId: string): Promise<MLBGameOdds | null> {
  try {
    const supabase = createClient()

    console.log('🔍 Fetching MLB odds for game:', gameId)

    // Query for all odds for this game, excluding yes/no markets
    const { data: rawOdds, error } = await supabase
      .from('odds')
      .select(
        `
        id,
        eventid,
        sportsbook,
        marketname,
        oddid,
        playerid,
        line,
        bookodds,
        closebookodds,
        fanduelodds,
        draftkingsodds,
        espnbetodds,
        ceasarsodds,
        mgmodds,
        fanaticsodds
      `
      )
      .eq('eventid', gameId)

    if (error) {
      console.error('❌ Error fetching MLB odds:', error)
      return null
    }

    if (!rawOdds || rawOdds.length === 0) {
      console.log('⚠️ No odds found for game:', gameId)
      return null
    }

    console.log(`📊 Found ${rawOdds.length} total odds for game ${gameId}`)

    // Filter out yes/no markets and keep only over/under markets
    const validOdds = rawOdds.filter(odd => {
      if (!odd.oddid) return false

      // Exclude yes/no markets completely
      if (isYesNoMarket(odd.oddid)) {
        return false
      }

      // For player props and some other markets, only include over/under
      const parsed = parseOddID(odd.oddid)
      if (!parsed) return false

      // Main lines can include ml, sp, ou
      if (parsed.category === 'main_lines') {
        return true
      }

      // For player props, team props, game props - only over/under
      return isOverUnderMarket(odd.oddid)
    })

    console.log(`✅ Filtered to ${validOdds.length} valid odds (excluded yes/no markets)`)

    if (validOdds.length === 0) {
      return {
        gameId,
        mainLines: {
          moneyline: {},
          runLine: {},
          total: {},
        },
        playerProps: {
          hitters: [],
          pitchers: [],
        },
        teamProps: [],
        gameProps: [],
      }
    }

    // Process the odds using existing function
    const processedGames = processMLBOdds(validOdds as DatabaseOdd[])
    const gameOdds = processedGames.find(game => game.gameId === gameId)

    if (gameOdds) {
      console.log(`🎯 Processed game odds:`, {
        mainLines: Object.keys(gameOdds.mainLines).length,
        hitters: gameOdds.playerProps.hitters.length,
        pitchers: gameOdds.playerProps.pitchers.length,
        teamProps: gameOdds.teamProps.length,
        gameProps: gameOdds.gameProps.length,
      })
    }

    return gameOdds || null
  } catch (error) {
    console.error('💥 Error processing MLB odds:', error)
    return null
  }
}

/**
 * Fetch MLB odds for multiple games
 */
export async function getMLBGamesOdds(gameIds: string[]): Promise<Record<string, MLBGameOdds>> {
  const results: Record<string, MLBGameOdds> = {}

  console.log(`🔄 Fetching odds for ${gameIds.length} MLB games`)

  // Process games in parallel
  const promises = gameIds.map(async gameId => {
    const odds = await getMLBGameOdds(gameId)
    if (odds) {
      results[gameId] = odds
    }
  })

  await Promise.all(promises)

  console.log(`✅ Successfully fetched odds for ${Object.keys(results).length} games`)

  return results
}

/**
 * Get today's MLB games with odds
 */
export async function getTodaysMLBOdds(): Promise<Record<string, MLBGameOdds>> {
  try {
    const supabase = createClient()

    console.log("📅 Fetching today's MLB games...")

    // Get today's MLB games
    const today = new Date().toISOString().split('T')[0]
    const { data: games, error } = await supabase
      .from('games')
      .select('id, home_team, away_team, game_time')
      .eq('sport', 'baseball')
      .eq('league', 'MLB')
      .gte('game_time', `${today}T00:00:00`)
      .lt('game_time', `${today}T23:59:59`)

    if (error) {
      console.error('❌ Error fetching MLB games:', error)
      return {}
    }

    if (!games || games.length === 0) {
      console.log('⚠️ No MLB games found for today')
      return {}
    }

    console.log(`🎯 Found ${games.length} MLB games for today`)

    const gameIds = games.map(game => game.id)
    return await getMLBGamesOdds(gameIds)
  } catch (error) {
    console.error("💥 Error fetching today's MLB odds:", error)
    return {}
  }
}

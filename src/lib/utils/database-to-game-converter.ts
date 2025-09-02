import { DatabaseOdds, GameWithOdds, getTabForMarket } from '@/lib/types/database'
import { Bookmaker, Game, Market, Outcome } from '@/lib/types/games'

// Convert database odds to Game format with market structure
export function convertDatabaseGamesToGames(gamesWithOdds: GameWithOdds[]): Game[] {
  return gamesWithOdds.map(gameData => convertSingleGameWithOdds(gameData))
}

export function convertSingleGameWithOdds(gameData: GameWithOdds): Game {
  // Group odds by sportsbook
  const oddsBySportsbook = groupOddsBySportsbook(gameData.odds)

  // Convert to bookmaker format
  const bookmakers: Bookmaker[] = Object.entries(oddsBySportsbook).map(([sportsbookName, odds]) => {
    return createBookmakerFromOdds(sportsbookName, odds, gameData)
  })

  return {
    id: gameData.id,
    sport_key: gameData.league.toLowerCase(), // 'mlb'
    sport_title: gameData.league, // 'MLB'
    commence_time: gameData.game_time,
    home_team: gameData.home_team_name || gameData.home_team,
    away_team: gameData.away_team_name || gameData.away_team,
    bookmakers: bookmakers,
  }
}

function groupOddsBySportsbook(odds: DatabaseOdds[]): Record<string, DatabaseOdds[]> {
  const grouped: Record<string, DatabaseOdds[]> = {}

  odds.forEach(odd => {
    if (!grouped[odd.sportsbook]) {
      grouped[odd.sportsbook] = []
    }
    grouped[odd.sportsbook]!.push(odd)
  })

  return grouped
}

function createBookmakerFromOdds(
  sportsbookName: string,
  odds: DatabaseOdds[],
  gameData: GameWithOdds
): Bookmaker {
  // Group odds by market type for this sportsbook
  const marketGroups = groupOddsByMarket(odds)

  const markets: Market[] = []

  // Convert each market group to Market format
  Object.entries(marketGroups).forEach(([marketName, marketOdds]) => {
    const market = convertOddsToMarket(marketName, marketOdds, gameData)
    if (market) {
      markets.push(market)
    }
  })

  return {
    key: sportsbookName.toLowerCase().replace(/\s+/g, '_'),
    title: sportsbookName,
    last_update: odds[0]?.created_at || new Date().toISOString(),
    markets: markets,
  }
}

function groupOddsByMarket(odds: DatabaseOdds[]): Record<string, DatabaseOdds[]> {
  const grouped: Record<string, DatabaseOdds[]> = {}

  odds.forEach(odd => {
    const marketName = normalizeMarketName(odd.marketname)
    if (!grouped[marketName]) {
      grouped[marketName] = []
    }
    grouped[marketName].push(odd)
  })

  return grouped
}

function normalizeMarketName(marketName: string): string {
  const normalized = marketName.toLowerCase().trim()

  // Map common variations to standard names - but only for team-level markets
  if (normalized.includes('moneyline') || normalized.includes('ml') || normalized.includes('h2h')) {
    return 'h2h'
  }
  if (
    normalized.includes('spread') ||
    normalized.includes('point spread') ||
    normalized.includes('run line')
  ) {
    return 'spreads'
  }
  // Only convert to 'totals' if it's a team total, not player props
  if (
    (normalized.includes('total') ||
      normalized.includes('over/under') ||
      normalized.includes('ou')) &&
    !normalized.includes(' over/under') && // player props have " over/under"
    !normalized.includes('hits') &&
    !normalized.includes('runs') &&
    !normalized.includes('strikeouts') &&
    !normalized.includes('home runs')
  ) {
    return 'totals'
  }

  // Keep original name for props and other markets
  return normalized
}

function convertOddsToMarket(
  marketName: string,
  odds: DatabaseOdds[],
  gameData: GameWithOdds
): Market | null {
  if (odds.length === 0) return null

  const outcomes: Outcome[] = []

  // Handle different market types
  if (marketName === 'h2h') {
    // Moneyline market
    odds.forEach(odd => {
      if (odd.bookodds) {
        // Determine if this is home or away team based on the data
        const isHomeTeam =
          odd.hometeam === gameData.home_team || odd.hometeam === gameData.home_team_name
        const isAwayTeam =
          odd.awayteam === gameData.away_team || odd.awayteam === gameData.away_team_name

        if (isHomeTeam) {
          outcomes.push({
            name: gameData.home_team_name || gameData.home_team,
            price: convertAmericanToDecimalOdds(odd.bookodds),
          })
        } else if (isAwayTeam) {
          outcomes.push({
            name: gameData.away_team_name || gameData.away_team,
            price: convertAmericanToDecimalOdds(odd.bookodds),
          })
        }
      }
    })
  } else if (marketName === 'spreads') {
    // Spread market - FIXED to use line field primarily
    odds.forEach(odd => {
      if (odd.bookodds && (odd.line !== null || odd.closebookodds !== null)) {
        const isHomeTeam =
          odd.hometeam === gameData.home_team || odd.hometeam === gameData.home_team_name
        const isAwayTeam =
          odd.awayteam === gameData.away_team || odd.awayteam === gameData.away_team_name

        // Use line field first, then closebookodds as fallback
        const lineValue = odd.line !== null ? odd.line : odd.closebookodds

        if (isHomeTeam && lineValue !== null) {
          outcomes.push({
            name: gameData.home_team_name || gameData.home_team,
            price: convertAmericanToDecimalOdds(odd.bookodds),
            point: Number(lineValue),
          })
        } else if (isAwayTeam && lineValue !== null) {
          outcomes.push({
            name: gameData.away_team_name || gameData.away_team,
            price: convertAmericanToDecimalOdds(odd.bookodds),
            point: Number(lineValue),
          })
        }
      }
    })
  } else if (marketName === 'totals') {
    // Total market - FIXED to use line field primarily
    odds.forEach(odd => {
      if (odd.bookodds && (odd.line !== null || odd.closebookodds !== null)) {
        // Determine if this is over or under based on oddID primarily (most reliable)
        const isOverByOddId = odd.oddid && odd.oddid.includes('-ou-over')
        const isUnderByOddId = odd.oddid && odd.oddid.includes('-ou-under')

        // Use oddID first, then fallback to sideid (don't use market name for totals)
        const isOver =
          isOverByOddId || (!isUnderByOddId && (odd.sideid === 'over' || odd.sideid === 'o'))
        const isUnder =
          isUnderByOddId || (!isOverByOddId && (odd.sideid === 'under' || odd.sideid === 'u'))

        // Use line field first, then closebookodds as fallback
        const lineValue = odd.line !== null ? odd.line : odd.closebookodds

        if (isOver && lineValue !== null) {
          outcomes.push({
            name: 'Over',
            price: convertAmericanToDecimalOdds(odd.bookodds),
            point: Number(lineValue),
          })
        } else if (isUnder && lineValue !== null) {
          outcomes.push({
            name: 'Under',
            price: convertAmericanToDecimalOdds(odd.bookodds),
            point: Number(lineValue),
          })
        }
      }
    })
  } else {
    // Handle player props and other markets
    // Group odds for the same market by Over/Under
    const overUnderGroups = groupOddsByOverUnder(odds)

    overUnderGroups.forEach(group => {
      if (group.odds.bookodds) {
        const outcomeName = group.isOver ? 'Over' : 'Under'
        // Use line field first, then closebookodds as fallback
        const lineValue = group.odds.line !== null ? group.odds.line : group.odds.closebookodds

        outcomes.push({
          name: outcomeName,
          price: convertAmericanToDecimalOdds(group.odds.bookodds),
          ...(lineValue !== null && lineValue !== undefined && { point: Number(lineValue) }),
        })
      }
    })
  }

  if (outcomes.length === 0) return null

  return {
    key: normalizeMarketName(marketName),
    last_update: odds[0]?.created_at || new Date().toISOString(),
    outcomes: outcomes,
  }
}

// Helper function to group player props by Over/Under - ENHANCED for oddID detection
function groupOddsByOverUnder(
  odds: DatabaseOdds[]
): Array<{ isOver: boolean; odds: DatabaseOdds }> {
  return odds.map(odd => {
    // Check oddID first (most reliable), then fallback to other methods
    const isOverByOddId = odd.oddid && odd.oddid.includes('-ou-over')
    const isOver =
      isOverByOddId || odd.sideid === 'over' || odd.marketname.toLowerCase().includes(' over')

    return {
      isOver,
      odds: odd,
    }
  })
}

function convertAmericanToDecimalOdds(americanOdds: number): number {
  if (americanOdds > 0) {
    return americanOdds / 100 + 1
  } else {
    return 100 / Math.abs(americanOdds) + 1
  }
}

// Helper to organize odds by market tabs for the UI
export function organizeOddsByMarketTabs(odds: DatabaseOdds[]): Record<string, DatabaseOdds[]> {
  const organized: Record<string, DatabaseOdds[]> = {
    main: [],
    'player-props': [],
    'team-props': [],
    'game-props': [],
    'period-props': [],
    'alt-lines': [],
  }

  console.log('🔍 Organizing', odds.length, 'odds into tabs...')

  odds.forEach(odd => {
    // Pass oddId to enhanced classification function (handle null case)
    const tabName = getTabForMarket(odd.marketname, odd.oddid || undefined)
    console.log(`📊 Market "${odd.marketname}" (oddId: ${odd.oddid}) → Tab "${tabName}"`)

    if (organized[tabName]) {
      organized[tabName]!.push(odd)
    } else {
      console.warn(`⚠️ Unknown tab "${tabName}" for market "${odd.marketname}", defaulting to main`)
      organized['main']!.push(odd)
    }
  })

  // Log summary
  Object.entries(organized).forEach(([tab, tabOdds]) => {
    if (tabOdds.length > 0) {
      console.log(`✅ ${tab}: ${tabOdds.length} odds`)
    }
  })

  return organized
}

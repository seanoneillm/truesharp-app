/**
 * High-Performance Odds Bulk Processor
 *
 * Takes API response and efficiently converts to consolidated database rows
 * Instead of 1000s of individual records, creates 1 row per (oddid, line) combination
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface ApiOdd {
  oddID: string
  marketName: string
  betTypeID: string
  sideID: string
  bookOdds?: string
  bookSpread?: string
  bookOverUnder?: string
  line?: string
  byBookmaker: Record<
    string,
    {
      odds: string
      lastUpdatedAt: string
      available: boolean
      deeplink?: string
      altLines?: Array<{
        odds: string
        spread?: string
        overUnder?: string
        lastUpdatedAt: string
        available: boolean
        deeplink?: string
      }>
    }
  >
}

interface ConsolidatedOddsRow {
  eventid: string
  oddid: string
  sportsbook: string
  marketname: string
  bettypeid: string
  sideid: string
  line: string | null
  bookodds: number | null
  fetched_at: string
  created_at: string
  updated_at: string

  // All sportsbook columns
  fanduelodds?: number | null
  fanduellink?: string | null
  draftkingsodds?: number | null
  draftkingslink?: string | null
  espnbetodds?: number | null
  espnbetlink?: string | null
  ceasarsodds?: number | null
  ceasarslink?: string | null
  mgmodds?: number | null
  mgmlink?: string | null
  fanaticsodds?: number | null
  fanaticslink?: string | null
  bovadaodds?: number | null
  bovadalink?: string | null
  unibetodds?: number | null
  unibetlink?: string | null
  pointsbetodds?: number | null
  pointsbetlink?: string | null
  williamhillodds?: number | null
  williamhilllink?: string | null
  ballybetodds?: number | null
  ballybetlink?: string | null
  barstoolodds?: number | null
  barstoollink?: string | null
  betonlineodds?: number | null
  betonlinelink?: string | null
  betparxodds?: number | null
  betparxlink?: string | null
  betriversodds?: number | null
  betriverslink?: string | null
  betusodds?: number | null
  betuslink?: string | null
  betfairexchangeodds?: number | null
  betfairexchangelink?: string | null
  betfairsportsbookodds?: number | null
  betfairsportsbooklink?: string | null
  betfredodds?: number | null
  betfredlink?: string | null
  fliffodds?: number | null
  flifflink?: string | null
  fourwindsodds?: number | null
  fourwindslink?: string | null
  hardrockbetodds?: number | null
  hardrockbetlink?: string | null
  lowvigodds?: number | null
  lowviglink?: string | null
  marathonbetodds?: number | null
  marathonbetlink?: string | null
  primesportsodds?: number | null
  primesportslink?: string | null
  prophetexchangeodds?: number | null
  prophetexchangelink?: string | null
  skybetodds?: number | null
  skybetlink?: string | null
  sleeperodds?: number | null
  sleeperlink?: string | null
  stakeodds?: number | null
  stakelink?: string | null
  underdogodds?: number | null
  underdoglink?: string | null
  wynnbetodds?: number | null
  wynnbetlink?: string | null
  thescorebetodds?: number | null
  thescorebetlink?: string | null
  bet365odds?: number | null
  bet365link?: string | null
  circaodds?: number | null
  circalink?: string | null
  pinnacleodds?: number | null
  pinnaclelink?: string | null
  prizepicksodds?: number | null
  prizepickslink?: string | null
}

// Sportsbook mapping for API key to database column
const SPORTSBOOK_MAPPINGS = [
  { key: 'fanduel', odds: 'fanduelodds', link: 'fanduellink' },
  { key: 'draftkings', odds: 'draftkingsodds', link: 'draftkingslink' },
  { key: 'caesars', odds: 'ceasarsodds', link: 'ceasarslink' },
  { key: 'betmgm', odds: 'mgmodds', link: 'mgmlink' },
  { key: 'espnbet', odds: 'espnbetodds', link: 'espnbetlink' },
  { key: 'fanatics', odds: 'fanaticsodds', link: 'fanaticslink' },
  { key: 'bovada', odds: 'bovadaodds', link: 'bovadalink' },
  { key: 'unibet', odds: 'unibetodds', link: 'unibetlink' },
  { key: 'pointsbet', odds: 'pointsbetodds', link: 'pointsbetlink' },
  { key: 'williamhill', odds: 'williamhillodds', link: 'williamhilllink' },
  { key: 'ballybet', odds: 'ballybetodds', link: 'ballybetlink' },
  { key: 'barstool', odds: 'barstoolodds', link: 'barstoollink' },
  { key: 'betonline', odds: 'betonlineodds', link: 'betonlinelink' },
  { key: 'betparx', odds: 'betparxodds', link: 'betparxlink' },
  { key: 'betrivers', odds: 'betriversodds', link: 'betriverslink' },
  { key: 'betus', odds: 'betusodds', link: 'betuslink' },
  { key: 'betfairexchange', odds: 'betfairexchangeodds', link: 'betfairexchangelink' },
  { key: 'betfairsportsbook', odds: 'betfairsportsbookodds', link: 'betfairsportsbooklink' },
  { key: 'betfred', odds: 'betfredodds', link: 'betfredlink' },
  { key: 'fliff', odds: 'fliffodds', link: 'flifflink' },
  { key: 'fourwinds', odds: 'fourwindsodds', link: 'fourwindslink' },
  { key: 'hardrockbet', odds: 'hardrockbetodds', link: 'hardrockbetlink' },
  { key: 'lowvig', odds: 'lowvigodds', link: 'lowviglink' },
  { key: 'marathonbet', odds: 'marathonbetodds', link: 'marathonbetlink' },
  { key: 'primesports', odds: 'primesportsodds', link: 'primesportslink' },
  { key: 'prophetexchange', odds: 'prophetexchangeodds', link: 'prophetexchangelink' },
  { key: 'skybet', odds: 'skybetodds', link: 'skybetlink' },
  { key: 'sleeper', odds: 'sleeperodds', link: 'sleeperlink' },
  { key: 'stake', odds: 'stakeodds', link: 'stakelink' },
  { key: 'underdog', odds: 'underdogodds', link: 'underdoglink' },
  { key: 'wynnbet', odds: 'wynnbetodds', link: 'wynnbetlink' },
  { key: 'thescorebet', odds: 'thescorebetodds', link: 'thescorebetlink' },
  { key: 'bet365', odds: 'bet365odds', link: 'bet365link' },
  { key: 'circa', odds: 'circaodds', link: 'circalink' },
  { key: 'pinnacle', odds: 'pinnacleodds', link: 'pinnaclelink' },
  { key: 'prizepicks', odds: 'prizepicksodds', link: 'prizepickslink' },
]

// Helper function to safely parse odds
const safeParseOdds = (value: string | number | undefined | null): number | null => {
  if (!value) return null
  const parsed = parseFloat(String(value))
  if (isNaN(parsed)) return null
  // Return as integer - database expects INTEGER type, not decimal
  return Math.round(Math.min(Math.max(parsed, -9999), 9999))
}

// Helper function to truncate strings
const truncateString = (value: string | undefined | null, maxLength: number): string | null => {
  if (!value) return null
  const str = String(value)
  return str.length > maxLength ? str.substring(0, maxLength) : str
}

/**
 * Process API response and create consolidated odds rows
 * DRAMATICALLY faster than the current approach
 */
export async function processBulkOdds(
  gameId: string,
  apiOdds: Record<string, ApiOdd>
): Promise<{
  consolidated: ConsolidatedOddsRow[]
  stats: {
    totalApiOdds: number
    consolidatedRows: number
    processingTimeMs: number
    reductionPercent: number
  }
}> {
  const startTime = Date.now()
  // FIXED: Use unique timestamps to prevent trigger rejection
  const baseTime = Date.now()

  console.log(`🚀 Processing ${Object.keys(apiOdds).length} API odds for game ${gameId}`)

  // Group odds by (oddid, line) - this is the key optimization
  const oddsGroups = new Map<string, ConsolidatedOddsRow>()
  let recordIndex = 0

  for (const [, apiOdd] of Object.entries(apiOdds)) {
    // Determine line value
    const lineValue = apiOdd.bookSpread || apiOdd.bookOverUnder || apiOdd.line || null

    // Create unique key for grouping
    const groupKey = `${apiOdd.oddID}|${lineValue || 'null'}`

    // Get or create the consolidated row
    let consolidatedRow = oddsGroups.get(groupKey)

    if (!consolidatedRow) {
      // Create new consolidated row with unique timestamp (use seconds instead of milliseconds)
      const uniqueTimestamp = new Date(baseTime + recordIndex * 1000).toISOString()
      recordIndex++

      consolidatedRow = {
        eventid: gameId,
        oddid: apiOdd.oddID,
        sportsbook: 'SportsGameOdds', // Required field - matches existing records
        marketname: truncateString(apiOdd.marketName, 50) || 'unknown',
        bettypeid: truncateString(apiOdd.betTypeID, 50) || 'unknown',
        sideid: truncateString(apiOdd.sideID, 50) || 'unknown',
        line: lineValue,
        bookodds: safeParseOdds(apiOdd.bookOdds),
        fetched_at: uniqueTimestamp,
        created_at: uniqueTimestamp,
        updated_at: uniqueTimestamp,
      }

      oddsGroups.set(groupKey, consolidatedRow)
    }

    // Add all sportsbook data to this consolidated row
    for (const mapping of SPORTSBOOK_MAPPINGS) {
      // Handle missing byBookmaker property gracefully
      const byBookmaker = apiOdd.byBookmaker || {}
      const bookData = byBookmaker[mapping.key]
      if (bookData && bookData.available) {
        // Set odds and link in the consolidated row
        ;(consolidatedRow as any)[mapping.odds] = safeParseOdds(bookData.odds)
        if (bookData.deeplink) {
          ;(consolidatedRow as any)[mapping.link] = bookData.deeplink
        }

        // Process alternate lines for this sportsbook
        const altLines = (bookData as any).altLines || []
        for (const altLine of altLines) {
          if (altLine.available !== false) {
            // Create unique key for this alternate line
            const altLineValue = altLine.spread || altLine.overUnder || null
            const altGroupKey = `${apiOdd.oddID}|${altLineValue || 'null'}`

            // Get or create consolidated row for this alternate line
            let altConsolidatedRow = oddsGroups.get(altGroupKey)

            if (!altConsolidatedRow) {
              // Create new consolidated row for alternate line with unique timestamp (use seconds)
              const altUniqueTimestamp = new Date(baseTime + recordIndex * 1000).toISOString()
              recordIndex++

              altConsolidatedRow = {
                eventid: gameId,
                oddid: apiOdd.oddID,
                sportsbook: 'SportsGameOdds', // Required field - matches existing records
                marketname: truncateString(apiOdd.marketName, 50) || 'unknown',
                bettypeid: truncateString(apiOdd.betTypeID, 50) || 'unknown',
                sideid: truncateString(apiOdd.sideID, 50) || 'unknown',
                line: altLineValue,
                bookodds: safeParseOdds(altLine.odds),
                fetched_at: altUniqueTimestamp,
                created_at: altUniqueTimestamp,
                updated_at: altUniqueTimestamp,
              }

              oddsGroups.set(altGroupKey, altConsolidatedRow)
            }

            // Add this sportsbook's alternate line data
            ;(altConsolidatedRow as any)[mapping.odds] = safeParseOdds(altLine.odds)
            // Note: altLines typically don't have deeplinks, but check just in case
            if (altLine.deeplink) {
              ;(altConsolidatedRow as any)[mapping.link] = altLine.deeplink
            }
          }
        }
      }
    }
  }

  const consolidated = Array.from(oddsGroups.values())
  const processingTime = Date.now() - startTime

  const stats = {
    totalApiOdds: Object.keys(apiOdds).length,
    consolidatedRows: consolidated.length,
    processingTimeMs: processingTime,
    reductionPercent:
      ((Object.keys(apiOdds).length - consolidated.length) / Object.keys(apiOdds).length) * 100,
  }

  console.log(`⚡ Bulk processing complete:`, {
    ...stats,
    reductionPercent: `${stats.reductionPercent.toFixed(1)}%`,
  })

  return { consolidated, stats }
}

/**
 * Fast bulk upsert to database
 * Uses chunked inserts for optimal performance
 */
export async function bulkUpsertOdds(
  consolidatedRows: ConsolidatedOddsRow[],
  gameId: string
): Promise<{
  oddsInserted: number
  openOddsInserted: number
  totalTimeMs: number
}> {
  const startTime = Date.now()
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log(`💾 Bulk upserting ${consolidatedRows.length} consolidated rows for game ${gameId}`)

  // Check if game has started
  const { data: gameData } = await supabase.from('games').select('status').eq('id', gameId).single()

  const gameHasStarted =
    gameData?.status === 'started' || gameData?.status === 'live' || gameData?.status === 'final'

  if (gameHasStarted) {
    console.log(`⚠️ Game ${gameId} has started, skipping all odds updates`)
    return { oddsInserted: 0, openOddsInserted: 0, totalTimeMs: Date.now() - startTime }
  }

  let oddsInserted = 0
  let openOddsInserted = 0

  // Bulk insert to both tables in chunks of 100 for optimal performance
  const chunkSize = 100

  for (let i = 0; i < consolidatedRows.length; i += chunkSize) {
    const chunk = consolidatedRows.slice(i, i + chunkSize)

    // Insert to open_odds (triggers handle deduplication)
    try {
      const { data: openData, error: openError } = await supabase
        .from('open_odds')
        .insert(chunk)
        .select('id')

      if (!openError && openData) {
        openOddsInserted += openData.length // Count actual insertions
      } else if (
        openError &&
        !openError.message.includes('duplicate') &&
        !openError.message.includes('constraint')
      ) {
        console.log(`⚠️ Open odds chunk error:`, openError.message)
      }
    } catch {
      // Ignore expected constraint errors
    }

    // Insert to odds (triggers handle deduplication)
    try {
      const { data: oddsData, error: oddsError } = await supabase
        .from('odds')
        .insert(chunk)
        .select('id')

      if (!oddsError && oddsData) {
        oddsInserted += oddsData.length // Count actual insertions
      } else if (
        oddsError &&
        !oddsError.message.includes('duplicate') &&
        !oddsError.message.includes('constraint')
      ) {
        console.log(`⚠️ Current odds chunk error:`, oddsError.message)
      }
    } catch {
      // Ignore expected constraint errors
    }
  }

  const totalTime = Date.now() - startTime

  console.log(`✅ Bulk upsert complete for game ${gameId}:`, {
    oddsInserted,
    openOddsInserted,
    totalTimeMs: totalTime,
    avgTimePerRow: `${(totalTime / consolidatedRows.length).toFixed(2)}ms`,
  })

  return { oddsInserted, openOddsInserted, totalTimeMs: totalTime }
}

/**
 * Main entry point: Process entire API response for a game
 */
export async function processGameOdds(gameId: string, apiOdds: Record<string, ApiOdd>) {
  const { consolidated, stats } = await processBulkOdds(gameId, apiOdds)
  const insertResults = await bulkUpsertOdds(consolidated, gameId)

  return {
    processing: stats,
    insertion: insertResults,
    totalRows: consolidated.length,
  }
}

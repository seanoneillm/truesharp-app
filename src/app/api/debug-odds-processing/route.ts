import { NextRequest, NextResponse } from 'next/server'

// Debug version to trace exactly what happens with game ouW6XII0uKqRsJazjYBr
export async function POST(_request: NextRequest) {
  const TARGET_GAME = 'ouW6XII0uKqRsJazjYBr'

  try {
    console.log(`🔍 Starting debug analysis for game: ${TARGET_GAME}`)

    // Step 1: Fetch odds from API
    console.log('📡 Fetching odds from SportsGameOdds API...')

    const apiResponse = await fetch(
      `https://api.sportsgameodds.com/v2/odds/${TARGET_GAME}?includeAltLines=true`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_ODDS_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!apiResponse.ok) {
      throw new Error(`API request failed: ${apiResponse.status} ${apiResponse.statusText}`)
    }

    const apiData = await apiResponse.json()
    console.log(`📊 API Response received. Type: ${typeof apiData}`)

    if (apiData && typeof apiData === 'object') {
      const oddsArray = Object.values(apiData) as Record<string, unknown>[]
      console.log(`📈 Total odds from API: ${oddsArray.length}`)

      // Step 2: Analyze the raw API data
      console.log('\n🔬 ANALYZING RAW API DATA:')

      // Check bet types distribution
      const betTypes = new Map<string, number>()
      const marketNames = new Map<string, number>()
      const oddIds = new Set<string>()

      oddsArray.forEach((odd, index) => {
        const betType = (odd.betTypeID as string) || 'unknown'
        const marketName = (odd.marketName as string) || 'unknown'
        const oddId = (odd.oddID as string) || null

        betTypes.set(betType, (betTypes.get(betType) || 0) + 1)
        marketNames.set(marketName, (marketNames.get(marketName) || 0) + 1)

        if (oddId) {
          oddIds.add(oddId)
        }

        // Log first 5 odds for inspection
        if (index < 5) {
          console.log(`  Odd ${index + 1}:`)
          console.log(`    oddID: ${oddId}`)
          console.log(`    betTypeID: ${betType}`)
          console.log(`    marketName: ${marketName}`)
          console.log(`    sideID: ${odd.sideID}`)
          console.log(`    bookOdds: ${odd.bookOdds}`)
          console.log(`    bookSpread: ${odd.bookSpread}`)
          console.log(`    bookOverUnder: ${odd.bookOverUnder}`)

          // Check byBookmaker data
          const byBookmaker = (odd.byBookmaker as Record<string, unknown>) || {}
          const bookmakerKeys = Object.keys(byBookmaker)
          console.log(`    byBookmaker keys: ${bookmakerKeys.join(', ')}`)

          // Check for alternate lines
          for (const [bookmakerName, bookmakerData] of Object.entries(byBookmaker)) {
            const sportsbook = bookmakerData as Record<string, unknown>
            const altLines = (sportsbook.altLines as Array<Record<string, unknown>>) || []
            if (altLines.length > 0) {
              console.log(`    ${bookmakerName} altLines: ${altLines.length}`)
            }
          }
          console.log('')
        }
      })

      console.log(`📋 BET TYPES DISTRIBUTION:`)
      Array.from(betTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([betType, count]) => {
          console.log(`  ${betType}: ${count} odds`)
        })

      console.log(`\n📋 MARKET NAMES DISTRIBUTION:`)
      Array.from(marketNames.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10 markets
        .forEach(([marketName, count]) => {
          console.log(`  ${marketName}: ${count} odds`)
        })

      console.log(`\n📊 UNIQUE ODD IDs: ${oddIds.size}`)

      // Step 3: Test processing logic
      console.log('\n🔧 TESTING PROCESSING LOGIC:')

      const processedMainLines = new Set()
      const processedAltLines = new Set()
      let validOdds = 0
      let invalidOdds = 0
      let skippedDuplicates = 0
      let processedRecords = 0

      for (const odd of oddsArray) {
        const oddId = (odd.oddID as string) || null

        if (!oddId) {
          invalidOdds++
          console.log(`❌ Skipping odd with missing oddID`)
          continue
        }

        // Check main line processing
        const mainLineKey = `${TARGET_GAME}:${oddId}`
        if (!processedMainLines.has(mainLineKey)) {
          console.log(`✅ Processing main line for oddId: ${oddId}`)

          // Test if this odd would be processed
          const betType = (odd.betTypeID as string) || 'unknown'
          if (betType === 'ml' || betType === 'sp' || betType === 'ou') {
            validOdds++
            processedRecords++
          } else {
            console.log(`❌ Unsupported bet type: ${betType}`)
            invalidOdds++
          }

          processedMainLines.add(mainLineKey)
        } else {
          skippedDuplicates++
          console.log(`⏭️ Skipping duplicate main line for oddId: ${oddId}`)
        }

        // Check alternate lines
        const byBookmaker = (odd.byBookmaker as Record<string, unknown>) || {}
        for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
          const sportsbook = sportsbookData as Record<string, unknown>
          const altLines = (sportsbook.altLines as Array<Record<string, unknown>>) || []

          for (const altLine of altLines) {
            const lineValue = altLine.spread || altLine.overUnder || `alt-${Date.now()}`
            const altLineKey = `${TARGET_GAME}:${oddId}:${lineValue}`

            if (!processedAltLines.has(altLineKey)) {
              console.log(`✅ Processing alt line: ${oddId} - ${lineValue} (${sportsbookName})`)
              processedRecords++
              processedAltLines.add(altLineKey)
            } else {
              skippedDuplicates++
            }
          }
        }
      }

      console.log(`\n📈 PROCESSING SUMMARY:`)
      console.log(`  Total API odds: ${oddsArray.length}`)
      console.log(`  Valid odds: ${validOdds}`)
      console.log(`  Invalid odds: ${invalidOdds}`)
      console.log(`  Skipped duplicates: ${skippedDuplicates}`)
      console.log(`  Records that would be created: ${processedRecords}`)
      console.log(`  Unique main lines: ${processedMainLines.size}`)
      console.log(`  Unique alt lines: ${processedAltLines.size}`)

      return NextResponse.json({
        success: true,
        gameId: TARGET_GAME,
        analysis: {
          totalApiOdds: oddsArray.length,
          validOdds,
          invalidOdds,
          skippedDuplicates,
          recordsToCreate: processedRecords,
          uniqueMainLines: processedMainLines.size,
          uniqueAltLines: processedAltLines.size,
          betTypesDistribution: Object.fromEntries(betTypes),
          topMarkets: Object.fromEntries(
            Array.from(marketNames.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
          ),
          uniqueOddIds: oddIds.size,
        },
      })
    } else {
      throw new Error('Invalid API response format')
    }
  } catch (error: unknown) {
    console.error('❌ Debug analysis failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        gameId: TARGET_GAME,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Debug Odds Processing Analysis',
    description: 'POST to analyze odds processing for game ouW6XII0uKqRsJazjYBr',
    gameId: 'ouW6XII0uKqRsJazjYBr',
  })
}

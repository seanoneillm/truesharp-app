import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const logs: string[] = []

  const log = (message: string) => {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message}`
    console.log(logEntry)
    logs.push(logEntry)
  }

  try {
    log('🚀 STARTING 30-SECOND CONTROLLED ODDS FETCH TEST')

    // ==============================================
    // STEP 1: PRE-FETCH BASELINE
    // ==============================================
    log('\n📊 STEP 1: ESTABLISHING BASELINE')

    const { data: preOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    const { data: preOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    log(`PRE-FETCH: odds table = ${preOddsCount?.length || 0} rows`)
    log(`PRE-FETCH: open_odds table = ${preOpenOddsCount?.length || 0} rows`)

    // ==============================================
    // STEP 2: FETCH SINGLE LEAGUE (MLB) FOR TESTING
    // ==============================================
    log('\n🎯 STEP 2: FETCHING MLB ODDS (SINGLE LEAGUE TEST)')

    if (!API_KEY) {
      throw new Error('SportsGameOdds API key not configured')
    }

    // Get today's date range
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const params = new URLSearchParams()
    params.append('leagueID', 'MLB')
    params.append('type', 'match')
    params.append('startsAfter', today!)
    params.append('startsBefore', tomorrow!)
    params.append('limit', '10') // Small limit for controlled test
    params.append('includeAltLines', 'true')

    const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
    log(`API URL: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const apiData = await response.json()
    const events = apiData?.data || []

    log(`API RESPONSE: ${events.length} events returned`)
    log(`API SUCCESS: ${apiData?.success}`)

    if (events.length === 0) {
      log('⚠️ NO EVENTS FROM API - Cannot continue test')
      return NextResponse.json({
        success: false,
        message: 'No events from API',
        logs,
      })
    }

    // ==============================================
    // STEP 3: ANALYZE FIRST EVENT IN DETAIL
    // ==============================================
    log('\n🔍 STEP 3: DETAILED EVENT ANALYSIS')

    const firstEvent = events[0]
    log(`SAMPLE EVENT ID: ${firstEvent.eventID}`)
    log(`SAMPLE EVENT: ${firstEvent.teams?.away?.name} @ ${firstEvent.teams?.home?.name}`)
    log(`SAMPLE EVENT START: ${firstEvent.status?.startsAt}`)

    const odds = firstEvent.odds || {}
    const totalOddsFromAPI = Object.keys(odds).length
    log(`TOTAL ODDS IN SAMPLE EVENT: ${totalOddsFromAPI}`)

    if (totalOddsFromAPI === 0) {
      log('⚠️ SAMPLE EVENT HAS NO ODDS - This is the problem!')
      return NextResponse.json({
        success: false,
        message: 'Sample event has no odds',
        logs,
        sampleEvent: firstEvent,
      })
    }

    // Count different types of odds
    let mainLineCount = 0
    let playerPropCount = 0
    let totalSportsbookEntries = 0
    let altLineCount = 0

    const oddsBreakdown: any[] = []

    for (const [oddId, odd] of Object.entries(odds).slice(0, 5)) {
      // Analyze first 5 odds
      const oddData = odd as any

      oddsBreakdown.push({
        oddId,
        marketName: oddData.marketName,
        betType: oddData.betTypeID,
        side: oddData.sideID,
        bookOdds: oddData.bookOdds,
      })

      // Classify odds
      if (
        oddData.marketName?.toLowerCase().includes('player') ||
        oddData.marketName?.toLowerCase().includes('prop')
      ) {
        playerPropCount++
      } else {
        mainLineCount++
      }

      // Count sportsbooks
      const byBookmaker = oddData.byBookmaker || {}
      const bookCount = Object.keys(byBookmaker).length
      totalSportsbookEntries += bookCount

      log(`  ODD ${oddId}: ${oddData.marketName} (${oddData.betTypeID}) - ${bookCount} sportsbooks`)

      // Count alt lines
      for (const bookData of Object.values(byBookmaker)) {
        const book = bookData as any
        if (book?.altLines?.length > 0) {
          altLineCount += book.altLines.length
          log(`    Alt lines: ${book.altLines.length}`)
        }
      }
    }

    log(`ODDS BREAKDOWN:`)
    log(`  Main lines: ${mainLineCount}`)
    log(`  Player props: ${playerPropCount}`)
    log(`  Alt lines: ${altLineCount}`)
    log(`  Total sportsbook entries: ${totalSportsbookEntries}`)

    // ==============================================
    // STEP 4: CONTROLLED DATABASE INSERT TEST
    // ==============================================
    log('\n💾 STEP 4: CONTROLLED DATABASE INSERT')

    let insertAttempts = 0
    let insertSuccesses = 0
    let insertErrors = 0
    let duplicateRejects = 0

    // Process only the first event for controlled testing
    const testEvent = firstEvent

    // Save game first
    const gameData = {
      id: testEvent.eventID,
      sport: 'MLB',
      league: 'MLB',
      home_team: testEvent.teams?.home?.name || 'Unknown Home',
      away_team: testEvent.teams?.away?.name || 'Unknown Away',
      home_team_name: testEvent.teams?.home?.name || '',
      away_team_name: testEvent.teams?.away?.name || '',
      game_time: testEvent.status?.startsAt || new Date().toISOString(),
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: gameError } = await supabase.from('games').upsert(gameData, { onConflict: 'id' })

    if (gameError) {
      log(`❌ GAME INSERT ERROR: ${gameError.message}`)
    } else {
      log(`✅ GAME UPSERTED: ${testEvent.eventID}`)
    }

    // Process odds from first event
    const eventOdds = testEvent.odds || {}
    const oddsToInsert: any[] = []

    for (const [oddId, odd] of Object.entries(eventOdds)) {
      const oddData = odd as any

      // Create base record
      const baseRecord = {
        eventid: testEvent.eventID,
        sportsbook: 'SportsGameOdds',
        marketname: (oddData.marketName || 'unknown').substring(0, 50),
        bettypeid: (oddData.betTypeID || 'unknown').substring(0, 50),
        sideid: oddData.sideID?.substring(0, 50) || null,
        oddid: oddId,
        bookodds: parseFloat(oddData.bookOdds) || null,
        line:
          oddData.betTypeID === 'ml' ? null : oddData.bookSpread || oddData.bookOverUnder || null,
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      oddsToInsert.push(baseRecord)

      // Add sportsbook-specific odds
      const byBookmaker = oddData.byBookmaker || {}
      log(`  Available sportsbooks for ${oddId}: ${Object.keys(byBookmaker).join(', ')}`)

      for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
        const bookData = sportsbookData as any

        if (bookData.odds) {
          const bookRecord = {
            ...baseRecord,
            [`${sportsbookName.toLowerCase()}odds`]: parseFloat(bookData.odds) || null,
          }

          // Map sportsbook names to correct database columns
          let columnName = ''
          const sportsbookLower = sportsbookName.toLowerCase()

          if (sportsbookLower === 'fanduel') columnName = 'fanduelodds'
          else if (sportsbookLower === 'draftkings') columnName = 'draftkingsodds'
          else if (sportsbookLower === 'caesars') columnName = 'ceasarsodds'
          else if (sportsbookLower === 'betmgm')
            columnName = 'mgmodds' // Fix: betmgm -> mgmodds
          else if (sportsbookLower === 'espnbet') columnName = 'espnbetodds'

          if (columnName) {
            // Update the main record instead of creating new one
            const existingIndex = oddsToInsert.findIndex(r => r.oddid === oddId)
            if (existingIndex >= 0) {
              oddsToInsert[existingIndex][columnName] = parseFloat(bookData.odds) || null
              log(`    Mapped ${sportsbookName} -> ${columnName}: ${bookData.odds}`)
            }
          }
        }
      }
    }

    log(`PREPARED ${oddsToInsert.length} ODDS RECORDS FOR INSERT`)

    // Insert into both tables and track results
    for (const record of oddsToInsert.slice(0, 10)) {
      // Test with first 10 records
      insertAttempts++

      // Insert into odds table
      const { data: oddsInsert, error: oddsError } = await supabase
        .from('odds')
        .insert(record)
        .select('id')

      // Insert into open_odds table
      const { data: openOddsInsert, error: openOddsError } = await supabase
        .from('open_odds')
        .insert(record)
        .select('id')

      if (oddsError || openOddsError) {
        insertErrors++
        if (
          oddsError?.message.includes('duplicate') ||
          openOddsError?.message.includes('duplicate')
        ) {
          duplicateRejects++
          log(`  DUPLICATE: ${record.oddid} (expected behavior)`)
        } else {
          log(
            `  ERROR: ${record.oddid} - odds: ${oddsError?.message}, open_odds: ${openOddsError?.message}`
          )
        }
      } else {
        insertSuccesses++
        log(`  SUCCESS: ${record.oddid} inserted into both tables`)
      }
    }

    // ==============================================
    // STEP 5: POST-FETCH ANALYSIS
    // ==============================================
    log('\n📈 STEP 5: POST-FETCH ANALYSIS')

    const { data: postOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    const { data: postOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    const oddsIncrease = (postOddsCount?.length || 0) - (preOddsCount?.length || 0)
    const openOddsIncrease = (postOpenOddsCount?.length || 0) - (preOpenOddsCount?.length || 0)

    log(`POST-FETCH: odds table = ${postOddsCount?.length || 0} rows (+${oddsIncrease})`)
    log(
      `POST-FETCH: open_odds table = ${postOpenOddsCount?.length || 0} rows (+${openOddsIncrease})`
    )

    // ==============================================
    // FINAL SUMMARY
    // ==============================================
    const duration = (Date.now() - startTime) / 1000

    log(`\n🎯 TEST COMPLETE (${duration.toFixed(1)}s)`)
    log(`📊 RESULTS SUMMARY:`)
    log(`  API Events: ${events.length}`)
    log(`  Sample Event Odds: ${totalOddsFromAPI}`)
    log(`  Insert Attempts: ${insertAttempts}`)
    log(`  Insert Successes: ${insertSuccesses}`)
    log(`  Insert Errors: ${insertErrors}`)
    log(`  Duplicate Rejects: ${duplicateRejects}`)
    log(`  Odds Table Increase: +${oddsIncrease}`)
    log(`  Open Odds Table Increase: +${openOddsIncrease}`)

    const efficiency =
      insertAttempts > 0 ? ((insertSuccesses / insertAttempts) * 100).toFixed(1) : '0'
    log(`  Insert Efficiency: ${efficiency}%`)

    // Identify the problem
    let problemAnalysis = ''
    if (events.length === 0) {
      problemAnalysis = 'NO EVENTS FROM API - API connection or league issue'
    } else if (totalOddsFromAPI === 0) {
      problemAnalysis = 'EVENTS BUT NO ODDS - API data structure or parsing issue'
    } else if (insertSuccesses === 0) {
      problemAnalysis = 'ODDS EXIST BUT INSERTS FAIL - Database constraint or trigger issue'
    } else if (insertSuccesses < insertAttempts / 2) {
      problemAnalysis = 'HIGH INSERT FAILURE RATE - Likely duplicate constraint too aggressive'
    } else if (oddsIncrease === 0) {
      problemAnalysis = 'INSERTS SUCCESS BUT NO DB GROWTH - Triggers deleting all inserts'
    } else {
      problemAnalysis = 'SYSTEM WORKING - Check if scale matches expectations'
    }

    log(`🔍 PROBLEM ANALYSIS: ${problemAnalysis}`)

    return NextResponse.json({
      success: true,
      summary: {
        duration: `${duration.toFixed(1)}s`,
        apiEvents: events.length,
        sampleEventOdds: totalOddsFromAPI,
        insertAttempts,
        insertSuccesses,
        insertErrors,
        duplicateRejects,
        oddsIncrease,
        openOddsIncrease,
        insertEfficiency: `${efficiency}%`,
        problemAnalysis,
      },
      breakdown: {
        mainLineCount,
        playerPropCount,
        altLineCount,
        totalSportsbookEntries,
        oddsBreakdown: oddsBreakdown.slice(0, 3),
      },
      logs,
    })
  } catch (error) {
    log(`❌ FATAL ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs,
      },
      { status: 500 }
    )
  }
}

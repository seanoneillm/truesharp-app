import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)


export async function POST(request: NextRequest) {
  const { testMode = true, detailedLogging = true } = await request.json()

  const logMessages: string[] = []
  const log = (message: string, forceLog = false) => {
    if (detailedLogging || forceLog) {
      console.log(message)
      logMessages.push(message)
    }
  }

  try {
    log('🔧 COMPREHENSIVE ODDS FETCH DEBUG STARTED', true)
    log(`Mode: ${testMode ? 'TEST (no database inserts)' : 'LIVE (will insert to database)'}`, true)

    // ==============================================
    // STEP 1: PRE-FETCH DATABASE STATE
    // ==============================================
    log('\n📊 STEP 1: PRE-FETCH DATABASE STATE', true)

    const { data: currentOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    const { data: currentOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    log(`Current odds table count: ${currentOddsCount?.length || 'N/A'}`)
    log(`Current open_odds table count: ${currentOpenOddsCount?.length || 'N/A'}`)

    // Check today's games
    const today = new Date().toISOString().split('T')[0]
    const { data: todayGames } = await supabase
      .from('games')
      .select('id, home_team, away_team, league')
      .gte('game_time', `${today}T00:00:00.000Z`)
      .lt('game_time', `${today}T23:59:59.999Z`)
      .limit(5)

    log(`Sample games for today: ${todayGames?.length || 0}`)
    todayGames?.forEach((game, i) => {
      log(`  ${i + 1}. ${game.away_team} @ ${game.home_team} (${game.league}) - ${game.id}`)
    })

    // ==============================================
    // STEP 2: API FETCH TEST (SINGLE LEAGUE)
    // ==============================================
    log('\n🎯 STEP 2: API FETCH TEST (MLB ONLY)', true)

    if (!API_KEY) {
      throw new Error('SportsGameOdds API key not configured')
    }

    // Test with MLB only to keep it manageable
    const today_iso = new Date().toISOString().split('T')[0]!
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!

    const params = new URLSearchParams()
    params.append('leagueID', 'MLB')
    params.append('type', 'match')
    params.append('startsAfter', today_iso)
    params.append('startsBefore', futureDate)
    params.append('limit', '10') // Small limit for debugging
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
    log(`API Response success: ${apiData?.success}`)
    log(`API events returned: ${apiData?.data?.length || 0}`)

    if (!apiData?.success || !apiData?.data || apiData.data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No data from API',
        logs: logMessages,
      })
    }

    // ==============================================
    // STEP 3: DETAILED EVENT ANALYSIS
    // ==============================================
    log('\n🔍 STEP 3: DETAILED EVENT ANALYSIS', true)

    const firstEvent = apiData.data[0]
    log(`Sample event ID: ${firstEvent.eventID}`)
    log(`Sample event teams: ${firstEvent.teams?.away?.name} @ ${firstEvent.teams?.home?.name}`)
    log(`Sample event start time: ${firstEvent.status?.startsAt}`)

    // Count odds in the first event
    const odds = firstEvent.odds || {}
    const oddsCount = Object.keys(odds).length
    log(`Total odds in first event: ${oddsCount}`)

    if (oddsCount === 0) {
      log('⚠️ WARNING: First event has no odds!')
      return NextResponse.json({
        success: false,
        message: 'First event has no odds',
        logs: logMessages,
        sampleEvent: firstEvent,
      })
    }

    // Analyze odds structure
    let mainLineCount = 0
    let altLineCount = 0
    let playerPropCount = 0
    let sportsbookCount = 0

    for (const [oddId, odd] of Object.entries(odds)) {
      const oddData = odd as Record<string, unknown>
      log(`\n📈 Analyzing odd ID: ${oddId}`)
      log(`  Market: ${oddData.marketName}`)
      log(`  Bet Type: ${oddData.betTypeID}`)
      log(`  Side: ${oddData.sideID}`)
      log(`  Book Odds: ${oddData.bookOdds}`)

      // Count different types
      if (
        oddData.marketName?.toString().toLowerCase().includes('player') ||
        oddData.marketName?.toString().toLowerCase().includes('prop')
      ) {
        playerPropCount++
      } else {
        mainLineCount++
      }

      // Check sportsbook data
      const byBookmaker = (oddData.byBookmaker as Record<string, any>) || {}
      const bookmakerCount = Object.keys(byBookmaker).length
      sportsbookCount += bookmakerCount

      log(`  Sportsbooks available: ${bookmakerCount}`)
      if (bookmakerCount > 0) {
        Object.keys(byBookmaker).forEach(book => {
          log(`    - ${book}: ${byBookmaker[book]?.odds}`)
        })
      }

      // Check for alternate lines
      Object.values(byBookmaker).forEach((bookData: any) => {
        if (bookData?.altLines?.length > 0) {
          altLineCount += bookData.altLines.length
          log(`    Alt lines: ${bookData.altLines.length}`)
        }
      })

      // Only log first 5 odds to avoid spam
      if (Object.keys(odds).indexOf(oddId) >= 5) break
    }

    log(`\n📊 ODDS BREAKDOWN FOR FIRST EVENT:`)
    log(`  Main lines: ${mainLineCount}`)
    log(`  Alt lines: ${altLineCount}`)
    log(`  Player props: ${playerPropCount}`)
    log(`  Total sportsbook entries: ${sportsbookCount}`)

    // ==============================================
    // STEP 4: DATABASE PROCESSING SIMULATION
    // ==============================================
    log('\n💾 STEP 4: DATABASE PROCESSING SIMULATION', true)

    let totalRecordsToInsert = 0
    let gamesProcessed = 0

    for (const event of apiData.data.slice(0, 3)) {
      // Process first 3 events
      gamesProcessed++
      log(`\n🎯 Processing event ${gamesProcessed}: ${event.eventID}`)

      const eventOdds = event.odds || {}
      const eventOddsCount = Object.keys(eventOdds).length

      if (eventOddsCount === 0) {
        log(`  ⚠️ Skipping - no odds`)
        continue
      }

      let eventRecords = 0

      // Simulate processing each odd
      for (const [, odd] of Object.entries(eventOdds)) {
        const oddData = odd as any

        // Main line record
        eventRecords++
        totalRecordsToInsert++

        // Check for alternate lines
        const byBookmaker = oddData.byBookmaker || {}
        for (const [sportsbookName, sportsbookData] of Object.entries(byBookmaker)) {
          const bookData = sportsbookData as any
          if (bookData?.altLines?.length > 0) {
            eventRecords += bookData.altLines.length
            totalRecordsToInsert += bookData.altLines.length
            log(`    Found ${bookData.altLines.length} alt lines from ${sportsbookName}`)
          }
        }
      }

      log(`  Event ${event.eventID} would generate ${eventRecords} database records`)
    }

    log(`\n📈 PROJECTION FOR ALL ${apiData.data.length} EVENTS:`)
    log(
      `  Estimated total records: ${Math.round(totalRecordsToInsert * (apiData.data.length / Math.min(3, apiData.data.length)))}`
    )

    // ==============================================
    // STEP 5: ACTUAL DATABASE INSERT (IF NOT TEST MODE)
    // ==============================================
    if (!testMode) {
      log('\n💽 STEP 5: ACTUAL DATABASE INSERT', true)

      // Process first event only for safety
      const testEvent = apiData.data[0]
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

      // Insert/update game
      const { error: gameError } = await supabase
        .from('games')
        .upsert(gameData, { onConflict: 'id' })

      if (gameError) {
        log(`❌ Game insert error: ${gameError.message}`)
      } else {
        log(`✅ Game upserted successfully`)
      }

      // Process first few odds
      const testOdds = Object.entries(testEvent.odds || {}).slice(0, 5)
      let insertedCount = 0

      for (const [oddId, odd] of testOdds) {
        const oddData = odd as any

        const oddsRecord = {
          eventid: testEvent.eventID,
          sportsbook: 'SportsGameOdds',
          marketname: oddData.marketName?.substring(0, 50) || 'unknown',
          bettypeid: oddData.betTypeID?.substring(0, 50) || 'unknown',
          sideid: oddData.sideID?.substring(0, 50) || null,
          oddid: oddId,
          bookodds: parseFloat(oddData.bookOdds) || null,
          line:
            oddData.betTypeID === 'ml' ? null : oddData.bookSpread || oddData.bookOverUnder || null,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }

        // Insert into both tables
        const { error: oddsError } = await supabase.from('odds').insert(oddsRecord)

        const { error: openOddsError } = await supabase.from('open_odds').insert(oddsRecord)

        if (!oddsError && !openOddsError) {
          insertedCount++
          log(`  ✅ Inserted odds record ${insertedCount}`)
        } else {
          log(
            `  ❌ Insert errors - odds: ${oddsError?.message}, open_odds: ${openOddsError?.message}`
          )
        }
      }

      log(`Database inserts completed: ${insertedCount}/${testOdds.length}`)
    }

    // ==============================================
    // STEP 6: POST-FETCH DATABASE STATE
    // ==============================================
    log('\n📊 STEP 6: POST-FETCH DATABASE STATE', true)

    const { data: postOddsCount } = await supabase
      .from('odds')
      .select('*', { count: 'exact', head: true })

    const { data: postOpenOddsCount } = await supabase
      .from('open_odds')
      .select('*', { count: 'exact', head: true })

    log(`Post-fetch odds table count: ${postOddsCount?.length || 'N/A'}`)
    log(`Post-fetch open_odds table count: ${postOpenOddsCount?.length || 'N/A'}`)

    if (!testMode) {
      const oddsIncrease = (postOddsCount?.length || 0) - (currentOddsCount?.length || 0)
      const openOddsIncrease =
        (postOpenOddsCount?.length || 0) - (currentOpenOddsCount?.length || 0)
      log(`Odds table increase: ${oddsIncrease}`)
      log(`Open odds table increase: ${openOddsIncrease}`)
    }

    // ==============================================
    // SUMMARY
    // ==============================================
    log('\n🎯 SUMMARY', true)
    log(`✅ Debug completed successfully`)
    log(`📊 API returned ${apiData.data.length} events`)
    log(
      `📈 Estimated ${totalRecordsToInsert * (apiData.data.length / Math.min(3, apiData.data.length))} total records`
    )
    log(`🏁 Test mode: ${testMode ? 'YES (no database changes)' : 'NO (made database changes)'}`)

    return NextResponse.json({
      success: true,
      summary: {
        apiEventsReturned: apiData.data.length,
        estimatedTotalRecords: Math.round(
          totalRecordsToInsert * (apiData.data.length / Math.min(3, apiData.data.length))
        ),
        sampleEventOddsCount: Object.keys(firstEvent.odds || {}).length,
        testMode,
        mainLineCount,
        altLineCount,
        playerPropCount,
        sportsbookCount,
      },
      sampleEvent: {
        eventID: firstEvent.eventID,
        teams: `${firstEvent.teams?.away?.name} @ ${firstEvent.teams?.home?.name}`,
        startsAt: firstEvent.status?.startsAt,
        oddsCount: Object.keys(firstEvent.odds || {}).length,
      },
      logs: logMessages,
    })
  } catch (error) {
    log(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`, true)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: logMessages,
      },
      { status: 500 }
    )
  }
}

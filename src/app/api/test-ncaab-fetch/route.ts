import { NextRequest, NextResponse } from 'next/server'

const SPORTSGAMEODDS_API_BASE = 'https://api.sportsgameodds.com/v2'
const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY

// NCAAB specific mapping
const NCAAB_MAPPING = {
  sportID: 'BASKETBALL',
  leagueID: 'NCAAB',
  sport_key: 'basketball_ncaab'
}

// Transform SportsGameOdds event to our format (same as production)
function transformSportsGameOddsEvent(event: Record<string, unknown>): Record<string, unknown> {
  const status = (event.status as Record<string, unknown>) || {}
  const teams = (event.teams as Record<string, unknown>) || {}
  const homeTeam = (teams.home as Record<string, unknown>) || {}
  const awayTeam = (teams.away as Record<string, unknown>) || {}
  const homeNames = (homeTeam.names as Record<string, unknown>) || {}
  const awayNames = (awayTeam.names as Record<string, unknown>) || {}

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
        score: homeTeam.score,
      },
      away: {
        teamID: awayTeam.teamID,
        name: awayNames.long || awayTeam.name || 'Unknown Away Team',
        shortName: awayNames.short || awayNames.medium,
        score: awayTeam.score,
      },
    },
    startTime: status.startsAt || new Date().toISOString(),
    odds: event.odds || {},
  }
}

// Test separate odds fetch for a specific event
async function testSeparateOddsFetch(eventId: string) {
  try {
    console.log(`🧪 Testing separate odds fetch for event ${eventId}`)
    
    const oddsUrl = `${SPORTSGAMEODDS_API_BASE}/events/${eventId}/odds`
    console.log(`🔗 Odds URL: ${oddsUrl}`)
    
    const response = await fetch(oddsUrl, {
      headers: {
        'X-API-Key': API_KEY!,
        'Content-Type': 'application/json',
      },
    })

    console.log(`📡 Separate odds fetch response status: ${response.status}`)
    
    if (!response.ok) {
      console.log(`❌ Separate odds fetch failed for event ${eventId}: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.log(`📄 Error response body:`, errorText)
      return null
    }

    const oddsData = await response.json()
    console.log(`✅ Separate odds fetch successful for event ${eventId}`)
    console.log(`📊 Odds data structure:`)
    console.log(`  - Success: ${oddsData?.success}`)
    console.log(`  - Data type: ${typeof oddsData?.data}`)
    console.log(`  - Data keys count: ${oddsData?.data ? Object.keys(oddsData.data).length : 0}`)
    
    if (oddsData?.data && Object.keys(oddsData.data).length > 0) {
      console.log(`📋 First 3 odds entries:`)
      const entries = Object.entries(oddsData.data).slice(0, 3)
      entries.forEach(([oddId, oddData], index) => {
        console.log(`  ${index + 1}. OddID: ${oddId}`)
        console.log(`     Data:`, JSON.stringify(oddData, null, 2))
      })
    }

    return oddsData
  } catch (error) {
    console.error(`💥 Exception in separate odds fetch for event ${eventId}:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n🏀 ========== NCAAB TEST FETCH START ==========')
    console.log(`🕐 Test started at: ${new Date().toISOString()}`)
    console.log(`🔑 API Key available: ${!!API_KEY}`)
    console.log(`🔑 API Key length: ${API_KEY?.length || 0}`)
    
    if (!API_KEY) {
      return NextResponse.json({ error: 'SportsGameOdds API key not configured' }, { status: 500 })
    }

    // Calculate date range (today + next 7 days)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const futureDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    const startISO = today.toISOString().split('T')[0]
    const futureDateISO = futureDate.toISOString().split('T')[0]

    console.log(`📅 Date range: ${startISO} to ${futureDateISO}`)
    console.log(`🏟️ League: NCAAB (${NCAAB_MAPPING.leagueID})`)

    // Fetch NCAAB events with pagination
    let nextCursor: string | null = null
    let allEvents: Record<string, unknown>[] = []
    let pageCount = 0
    const maxPages = 5 // Limit for testing

    do {
      pageCount++
      console.log(`\n📄 Fetching page ${pageCount}...`)

      if (pageCount > maxPages) {
        console.log(`⚠️ Hit maximum page limit (${maxPages}) for testing`)
        break
      }

      const params = new URLSearchParams()
      params.append('leagueID', NCAAB_MAPPING.leagueID)
      params.append('type', 'match')
      params.append('startsAfter', startISO)
      params.append('startsBefore', futureDateISO)
      params.append('limit', '50')
      params.append('includeAltLines', 'true')
      if (nextCursor) {
        params.append('cursor', nextCursor)
      }

      const apiUrl = `${SPORTSGAMEODDS_API_BASE}/events?${params.toString()}`
      console.log(`🌐 API URL: ${apiUrl}`)

      const response = await fetch(apiUrl, {
        headers: {
          'X-API-Key': API_KEY!,
          'Content-Type': 'application/json',
        },
      })

      console.log(`📡 Response status: ${response.status}`)

      if (!response.ok) {
        if (response.status === 429) {
          console.log('⚠️ Rate limited!')
          break
        }
        const errorText = await response.text()
        console.log(`❌ API error: ${response.status} ${response.statusText}`)
        console.log(`📄 Error body:`, errorText)
        throw new Error(`SportsGameOdds API error: ${response.status} ${response.statusText}`)
      }

      const pageData = await response.json()
      console.log(`📊 Page response:`)
      console.log(`  - Success: ${pageData?.success}`)
      console.log(`  - Data array length: ${pageData?.data?.length || 0}`)
      console.log(`  - Next cursor: ${pageData?.nextCursor || 'none'}`)

      if (pageData?.success && pageData?.data) {
        if (pageData.data.length === 0) {
          console.log('⚠️ No more data available')
          break
        }

        allEvents = allEvents.concat(pageData.data)
        nextCursor = pageData.nextCursor

        if (!nextCursor) {
          console.log('✅ No more pages available')
          break
        }
      } else {
        console.log('⚠️ Invalid response structure')
        break
      }
    } while (nextCursor && pageCount <= maxPages)

    console.log(`\n📋 TOTAL EVENTS FETCHED: ${allEvents.length}`)

    // Process each event and FILTER OUT events without odds
    const processedGames = []
    const gamesWithOdds = []
    const gamesWithoutOdds = []
    const filteredGames = []
    const deletedGames = []

    console.log(`\n🔍 FILTERING STRATEGY: Remove events without inline odds`)
    console.log(`📊 This simulates the production fix where we delete/skip events with no odds`)

    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i]
      console.log(`\n🎯 Processing event ${i + 1}/${allEvents.length}:`)
      
      try {
        const transformedEvent = transformSportsGameOddsEvent(event)
        console.log(`  📝 Event ID: ${transformedEvent.eventID}`)
        console.log(`  🏠 Home Team: ${(transformedEvent.teams as any)?.home?.name}`)
        console.log(`  🛣️ Away Team: ${(transformedEvent.teams as any)?.away?.name}`)
        console.log(`  🕐 Start Time: ${transformedEvent.startTime}`)
        console.log(`  📊 Status: ${transformedEvent.status}`)

        // Check for inline odds
        const hasInlineOdds = transformedEvent.odds && Object.keys(transformedEvent.odds as Record<string, unknown>).length > 0
        console.log(`  🎲 Has inline odds: ${hasInlineOdds}`)
        console.log(`  🔢 Inline odds count: ${hasInlineOdds ? Object.keys(transformedEvent.odds as Record<string, unknown>).length : 0}`)

        if (hasInlineOdds) {
          console.log(`  ✅ KEEPING: Event has ${Object.keys(transformedEvent.odds as Record<string, unknown>).length} odds`)
          console.log(`  📋 Sample odds:`)
          const oddsEntries = Object.entries(transformedEvent.odds as Record<string, unknown>).slice(0, 2)
          oddsEntries.forEach(([oddId, oddData], index) => {
            console.log(`    ${index + 1}. OddID: ${oddId}`)
            console.log(`       Type: ${(oddData as any)?.betTypeID}`)
            console.log(`       Side: ${(oddData as any)?.sideID}`)
            console.log(`       Market: ${(oddData as any)?.marketName}`)
            console.log(`       BookOdds: ${(oddData as any)?.bookOdds}`)
            
            // Check sportsbook data
            const byBookmaker = (oddData as any)?.byBookmaker || {}
            const sportsbookCount = Object.keys(byBookmaker).length
            console.log(`       Sportsbooks: ${sportsbookCount}`)
            if (sportsbookCount > 0) {
              const sportsbooks = Object.keys(byBookmaker).slice(0, 3).join(', ')
              console.log(`       Available at: ${sportsbooks}${sportsbookCount > 3 ? '...' : ''}`)
            }
          })
          
          gamesWithOdds.push(transformedEvent)
          filteredGames.push({
            eventID: transformedEvent.eventID,
            homeTeam: (transformedEvent.teams as any)?.home?.name,
            awayTeam: (transformedEvent.teams as any)?.away?.name,
            startTime: transformedEvent.startTime,
            oddsCount: Object.keys(transformedEvent.odds as Record<string, unknown>).length,
            action: 'SAVED'
          })
        } else {
          console.log(`  🗑️ DELETING: Event has no odds - would be removed from processing`)
          gamesWithoutOdds.push(transformedEvent)
          deletedGames.push({
            eventID: transformedEvent.eventID,
            homeTeam: (transformedEvent.teams as any)?.home?.name,
            awayTeam: (transformedEvent.teams as any)?.away?.name,
            startTime: transformedEvent.startTime,
            reason: 'No inline odds available',
            action: 'DELETED'
          })
        }

        processedGames.push({
          eventID: transformedEvent.eventID,
          homeTeam: (transformedEvent.teams as any)?.home?.name,
          awayTeam: (transformedEvent.teams as any)?.away?.name,
          startTime: transformedEvent.startTime,
          hasInlineOdds,
          inlineOddsCount: hasInlineOdds ? Object.keys(transformedEvent.odds as Record<string, unknown>).length : 0,
          wouldBeProcessed: hasInlineOdds
        })

      } catch (eventError) {
        console.error(`❌ Error processing event ${i + 1}:`, eventError)
      }
    }

    console.log('\n🏀 ========== NCAAB FILTERED FETCH SUMMARY ==========')
    console.log(`📊 Total Events Fetched: ${processedGames.length}`)
    console.log(`✅ Games WITH odds (would be saved): ${gamesWithOdds.length}`)
    console.log(`🗑️ Games WITHOUT odds (would be deleted): ${gamesWithoutOdds.length}`)
    console.log(`📈 Success rate after filtering: ${processedGames.length > 0 ? ((gamesWithOdds.length / processedGames.length) * 100).toFixed(1) : 0}%`)
    console.log(`🎯 Odds processing efficiency: ${gamesWithOdds.length > 0 ? '100%' : '0%'} (no separate fetching needed)`)

    console.log(`\n📋 FILTERED GAMES SUMMARY:`)
    console.log(`  🏆 Games that would be processed: ${filteredGames.length}`)
    console.log(`  🗑️ Games that would be deleted: ${deletedGames.length}`)

    if (deletedGames.length > 0) {
      console.log(`\n🗑️ Sample games that would be DELETED (no odds):`)
      deletedGames.slice(0, 5).forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.awayTeam} @ ${game.homeTeam} (${game.eventID})`)
        console.log(`     Reason: ${game.reason}`)
      })
    }

    if (filteredGames.length > 0) {
      console.log(`\n✅ Sample games that would be SAVED (with odds):`)
      filteredGames.slice(0, 5).forEach((game, index) => {
        console.log(`  ${index + 1}. ${game.awayTeam} @ ${game.homeTeam} (${game.eventID})`)
        console.log(`     Odds count: ${game.oddsCount}`)
      })
    }

    // Calculate total odds that would be processed
    const totalOdds = filteredGames.reduce((sum, game) => sum + game.oddsCount, 0)
    console.log(`\n🎯 FINAL PROCESSING RESULTS:`)
    console.log(`  📊 Total odds that would be processed: ${totalOdds}`)
    console.log(`  🎮 Average odds per game: ${filteredGames.length > 0 ? (totalOdds / filteredGames.length).toFixed(1) : 0}`)
    console.log(`  ✅ Database insertion success rate: 100% (all filtered games have odds)`)
    console.log(`  ❌ No failed separate odds fetches (none needed)`)

    console.log('\n🏀 ========== NCAAB FILTERED FETCH END ==========')

    return NextResponse.json({
      success: true,
      strategy: "Filter out events without inline odds",
      summary: {
        totalEventsFetched: processedGames.length,
        gamesWithInlineOdds: gamesWithOdds.length,
        gamesWithoutInlineOdds: gamesWithoutOdds.length,
        filteredGamesToProcess: filteredGames.length,
        deletedGames: deletedGames.length,
        successRateAfterFiltering: processedGames.length > 0 ? ((gamesWithOdds.length / processedGames.length) * 100) : 0,
        totalOddsToProcess: totalOdds,
        avgOddsPerGame: filteredGames.length > 0 ? (totalOdds / filteredGames.length) : 0
      },
      filteredGames: filteredGames.slice(0, 10), // First 10 games that would be saved
      deletedGames: deletedGames.slice(0, 10),   // First 10 games that would be deleted
      testCompleted: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ NCAAB test fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testCompleted: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
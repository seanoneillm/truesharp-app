import { NextResponse } from 'next/server'

// Fetch NFL events for current date range (today + next 5 days)
interface Event {
  id: string
  homeTeam: string
  awayTeam: string
  startsAt?: string
  startTime?: string
  odds?: Record<string, OddObject>
}

interface OddObject {
  oddID?: string
  marketName?: string
  betTypeID?: string
  bookOdds?: string
  byBookmaker?: Record<string, Sportsbook>
}

interface Sportsbook {
  altLines?: Array<Record<string, unknown>>
}

export async function POST() {
  try {
    console.log('🏈 FETCHING NFL EVENTS - TODAY + NEXT 5 DAYS')

    // Calculate date range
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 5)

    const startsAfter: string = today.toISOString().split('T')[0]! // YYYY-MM-DD format
    const startsBefore: string = endDate.toISOString().split('T')[0]! // YYYY-MM-DD format

    console.log(`📅 Date Range: ${startsAfter} to ${startsBefore}`)

    let nextCursor: string | null = null
    let eventData: Event[] = []
    let pageCount = 0
    const maxPages = 10 // Safety limit

    do {
      try {
        console.log(
          `📡 Fetching page ${pageCount + 1}${nextCursor ? ` (cursor: ${nextCursor.substring(0, 20)}...)` : ''}`
        )

        // Build URL with parameters
        const params = new URLSearchParams()
        params.append('leagueID', 'NFL')
        params.append('type', 'match')
        params.append('startsAfter', startsAfter)
        params.append('startsBefore', startsBefore)
        params.append('limit', '50')
        params.append('includeAltLines', 'true')

        if (nextCursor) {
          params.append('cursor', nextCursor)
        }

        const apiUrl = `https://api.sportsgameodds.com/v2/events?${params.toString()}`

        const response = await fetch(apiUrl, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_ODDS_API_KEY!,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 429) {
            console.log('⚠️ Rate limited - stopping fetch')
            break
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const pageData = await response.json()
        console.log(`✅ Page ${pageCount + 1}: ${pageData?.data?.length || 0} events returned`)

        if (pageData?.success && pageData?.data) {
          if (pageData.data.length === 0) {
            console.log('📭 No more events found')
            break
          }

          eventData = eventData.concat(pageData.data)
          nextCursor = pageData.nextCursor

          console.log(`📊 Total events collected: ${eventData.length}`)

          if (!nextCursor) {
            console.log('🏁 No more pages available')
            break
          }
        } else {
          console.log('❌ Invalid response format')
          break
        }

        pageCount++

        if (eventData.length > 200) {
          console.log('📈 Event limit reached (200+)')
          break
        }
      } catch (error) {
        console.error('❌ Error fetching page:', error)
        break
      }
    } while (nextCursor && pageCount < maxPages)

    console.log(`\n🏈 NFL EVENTS ANALYSIS (${eventData.length} total events)`)
    console.log('='.repeat(60))

    // Analyze the collected events
    const eventsWithOdds: Event[] = []
    let totalOddsCount = 0

    eventData.forEach((event, index) => {
      const eventId = event.id || 'unknown'
      const homeTeam = event.homeTeam || 'Unknown Home'
      const awayTeam = event.awayTeam || 'Unknown Away'
      const gameTime = event.startsAt || event.startTime || 'Unknown Time'
      const odds = event.odds || {}
      const oddsCount = Object.keys(odds).length

      console.log(`\n🎮 Event ${index + 1}: ${awayTeam} @ ${homeTeam}`)
      console.log(`   📍 ID: ${eventId}`)
      console.log(`   🕐 Time: ${gameTime}`)
      console.log(`   🎯 Odds Available: ${oddsCount}`)

      if (oddsCount > 0) {
        eventsWithOdds.push(event)
        totalOddsCount += oddsCount

        // Sample first few odds for detailed analysis
        const oddEntries = Object.entries(odds)
        console.log(`   📋 Sample Odds:`)

        oddEntries.slice(0, 3).forEach(([oddKey, oddValue]: [string, OddObject]) => {
          console.log(
            `     • ${oddKey}: ${oddValue?.marketName || 'Unknown Market'} (${oddValue?.betTypeID || 'Unknown Type'})`
          )
          if (oddValue?.bookOdds) {
            console.log(`       📊 Book Odds: ${oddValue.bookOdds}`)
          }

          // Check for alternate lines
          const byBookmaker = oddValue?.byBookmaker || {}
          let altLinesCount = 0
          Object.values(byBookmaker).forEach((sportsbook: Sportsbook) => {
            if (sportsbook?.altLines) {
              altLinesCount += sportsbook.altLines.length
            }
          })
          if (altLinesCount > 0) {
            console.log(`       🔄 Alt Lines: ${altLinesCount}`)
          }
        })

        if (oddEntries.length > 3) {
          console.log(`     ... and ${oddEntries.length - 3} more odds`)
        }
      } else {
        console.log(`   ⚠️ No odds available for this event`)
      }
    })

    console.log(`\n📊 SUMMARY STATISTICS`)
    console.log('='.repeat(40))
    console.log(`📅 Date Range: ${startsAfter} to ${startsBefore}`)
    console.log(`🏈 Total NFL Events Found: ${eventData.length}`)
    console.log(`🎯 Events with Odds: ${eventsWithOdds.length}`)
    console.log(`📈 Total Odds Count: ${totalOddsCount}`)
    console.log(
      `📊 Average Odds per Event: ${eventsWithOdds.length > 0 ? Math.round(totalOddsCount / eventsWithOdds.length) : 0}`
    )
    console.log(`📱 Pages Fetched: ${pageCount}`)

    // Return structured data
    return NextResponse.json({
      success: true,
      summary: {
        dateRange: `${startsAfter} to ${startsBefore}`,
        totalEvents: eventData.length,
        eventsWithOdds: eventsWithOdds.length,
        totalOddsCount: totalOddsCount,
        averageOddsPerEvent:
          eventsWithOdds.length > 0 ? Math.round(totalOddsCount / eventsWithOdds.length) : 0,
        pagesFetched: pageCount,
      },
      events: eventData.map(event => ({
        id: event.id,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        startsAt: event.startsAt || event.startTime,
        oddsCount: Object.keys(event.odds || {}).length,
        hasOdds: Object.keys(event.odds || {}).length > 0,
      })),
      sampleEventWithOdds:
        eventsWithOdds.length > 0 && eventsWithOdds[0]?.odds
          ? {
              event: eventsWithOdds[0],
              sampleOdds: Object.entries(eventsWithOdds[0]?.odds || {})
                .slice(0, 5)
                .map(([key, value]: [string, OddObject]) => ({
                  oddId: key,
                  marketName: value?.marketName,
                  betTypeID: value?.betTypeID,
                  bookOdds: value?.bookOdds,
                  altLinesAvailable: Object.values(value?.byBookmaker || {}).reduce(
                    (total: number, sportsbook: Sportsbook) =>
                      total + (sportsbook?.altLines?.length || 0),
                    0
                  ),
                })),
            }
          : null,
    })
  } catch (error: unknown) {
    console.error('❌ NFL events fetch failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'NFL Events Fetcher',
    description: 'POST to fetch NFL events for today + next 5 days with odds analysis',
    dateRange: 'Today through next 5 days',
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sport, date } = await request.json()

    console.log('🔄 Manual odds fetch requested for:', { sport, date })

    // Fetch odds for 1 day before through 7 days after the base date (8 days total)
    const baseDate = new Date(date || new Date().toISOString().split('T')[0])
    const promises = []

    // Define all sports to fetch (or use specific sport if provided)
    const sportsToFetch =
      sport && sport !== 'ALL'
        ? [sport]
        : ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL']

    for (let i = -1; i <= 6; i++) {
      const fetchDate = new Date(baseDate)
      fetchDate.setDate(baseDate.getDate() + i)
      const dateStr = fetchDate.toISOString().split('T')[0] || fetchDate.toISOString()

      // Create promises for each sport
      for (const sportKey of sportsToFetch) {
        const apiUrl = new URL('/api/games/sportsgameodds', request.url)
        apiUrl.searchParams.set('sport', sportKey)
        apiUrl.searchParams.set('date', dateStr)
        apiUrl.searchParams.set('refresh', 'true')

        promises.push(
          fetch(apiUrl.toString())
            .then(res => res.json())
            .then(data => ({
              date: dateStr,
              sport: sportKey,
              gameCount: data.games?.length || 0,
              success: !data.error,
            }))
            .catch(error => ({
              date: dateStr,
              sport: sportKey,
              gameCount: 0,
              success: false,
              error: error.message,
            }))
        )
      }
    }

    const results = await Promise.all(promises)
    const totalGames = results.reduce((sum, result) => sum + result.gameCount, 0)
    const successfulRequests = results.filter(r => r.success).length
    const rateLimitedRequests = results.filter(
      r => !r.success && 'error' in r && r.error && r.error.includes('rate limit')
    ).length

    // Group results by sport for better reporting
    const sportResults = results.reduce(
      (acc, result) => {
        if (!acc[result.sport]) {
          acc[result.sport] = { games: 0, successfulDays: 0, totalDays: 0, rateLimited: 0 }
        }
        const sportData = acc[result.sport]
        if (sportData) {
          sportData.games += result.gameCount
          sportData.totalDays += 1
          if (result.success) {
            sportData.successfulDays += 1
          }
          if (!result.success && 'error' in result && result.error && result.error.includes('rate limit')) {
            sportData.rateLimited += 1
          }
        }
        return acc
      },
      {} as Record<
        string,
        { games: number; successfulDays: number; totalDays: number; rateLimited: number }
      >
    )

    // Determine overall success and create appropriate message
    const isPartialSuccess = successfulRequests > 0 && successfulRequests < promises.length
    const hasRateLimiting = rateLimitedRequests > 0

    let message = ''
    let success = successfulRequests > 0

    if (hasRateLimiting && successfulRequests === 0) {
      message = `All requests were rate limited. Using cached/database data. Please wait 5-10 minutes before trying again.`
      success = false
    } else if (hasRateLimiting && isPartialSuccess) {
      message = `Partial success: ${successfulRequests}/${promises.length} requests succeeded, ${rateLimitedRequests} were rate limited. Some data may be cached.`
    } else if (successfulRequests === promises.length) {
      message = `All requests succeeded! Fetched ${totalGames} games.`
    } else if (successfulRequests > 0) {
      message = `Partial success: ${successfulRequests}/${promises.length} requests succeeded.`
    } else {
      message = 'All requests failed. Please try again later.'
      success = false
    }

    console.log('✅ Manual odds fetch completed:', {
      sports: sportsToFetch,
      baseDate: baseDate.toISOString().split('T')[0],
      dateRange: `${new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} to ${new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`,
      totalGames,
      successfulRequests,
      rateLimitedRequests,
      totalRequests: promises.length,
      sportResults,
      message,
    })

    return NextResponse.json({
      success,
      sports: sportsToFetch,
      baseDate: baseDate.toISOString().split('T')[0],
      totalGames,
      successfulRequests,
      rateLimitedRequests,
      totalRequests: promises.length,
      daysProcessed: 8,
      sportResults,
      results,
      message,
      lastUpdated: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Error during manual odds fetch:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch odds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

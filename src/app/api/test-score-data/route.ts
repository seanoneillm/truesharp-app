import { NextRequest, NextResponse } from 'next/server'

// Test endpoint to inspect score data structure from the API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get('sport') || 'MLB'
    const limit = parseInt(searchParams.get('limit') || '10')

    console.log(`🔍 Testing score data for ${sport} with limit ${limit}`)

    // Get yesterday's date to look for completed games
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateStr = yesterday.toISOString().split('T')[0]

    // Fetch from our existing API
    const apiUrl = new URL('/api/games/sportsgameodds', request.url)
    apiUrl.searchParams.set('sport', sport)
    apiUrl.searchParams.set('date', dateStr)
    apiUrl.searchParams.set('forceRefresh', 'true')

    const response = await fetch(apiUrl.toString())
    const data = await response.json()

    if (!response.ok || data.error) {
      return NextResponse.json(
        {
          error: data.error || 'API request failed',
          sport,
          date: dateStr,
        },
        { status: 500 }
      )
    }

    const games = data.games || []
    const limitedGames = games.slice(0, limit)

    // Filter for completed games and extract score information
    const completedGames = limitedGames.filter(
      (game: any) =>
        game.status === 'completed' ||
        game.status === 'final' ||
        game.status === 'FT' ||
        (game.home_score !== null && game.away_score !== null)
    )

    // Create a detailed analysis of score data structure
    const analysis = completedGames.map((game: any) => ({
      gameId: game.id,
      status: game.status,
      teams: {
        home: game.home_team_name,
        away: game.away_team_name,
      },
      scores: {
        home_score: game.home_score,
        away_score: game.away_score,
        home_score_type: typeof game.home_score,
        away_score_type: typeof game.away_score,
      },
      calculated: {
        total_score: (parseInt(game.home_score) || 0) + (parseInt(game.away_score) || 0),
        winning_team:
          (parseInt(game.home_score) || 0) > (parseInt(game.away_score) || 0) ? 'home' : 'away',
      },
      raw_game_object_keys: Object.keys(game),
      sample_markets: game.markets ? Object.keys(game.markets) : [],
    }))

    return NextResponse.json({
      success: true,
      sport,
      date: dateStr,
      total_games: games.length,
      limited_to: limit,
      completed_games_found: completedGames.length,
      analysis,
      first_raw_game: completedGames[0] || null, // Show full structure of first game
    })
  } catch (error) {
    console.error('❌ Error in test-score-data:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

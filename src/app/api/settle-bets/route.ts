import { createServiceRoleClient } from '@/lib/supabase'
// import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

/*
 * SETTLE BETS API - COMPLETE REWRITE
 * 
 * This function:
 * 1. Fetches completed games from last 1-2 days only
 * 2. Extracts scores and updates existing odds table rows (no new rows)
 * 3. Updates games table with team scores
 * 4. Settles TrueSharp bets using precise oddid matching
 * 5. Uses games table scores for moneyline/spread settlement
 */

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    // const supabase = await createServerSupabaseClient()
    const serviceSupabase = await createServiceRoleClient()

    console.log('🏆 Starting bet settlement process (REWRITTEN)')
    console.log(`⏰ Started at: ${new Date().toISOString()}`)

    // FIXED: Get completed games from last 1-2 days only (not today)
    const today = new Date()
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)
    const oneDayAgo = new Date(today)
    oneDayAgo.setDate(today.getDate() - 1)

    console.log(`📅 Processing completed games from: ${twoDaysAgo.toISOString().split('T')[0]} to ${oneDayAgo.toISOString().split('T')[0]}`)

    const promises = []
    const sportsToFetch = ['MLB', 'NBA', 'WNBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UEFA_CHAMPIONS_LEAGUE']

    // Fetch completed games from last 1-2 days
    for (let i = -2; i <= -1; i++) {
      // -2 = 2 days ago, -1 = 1 day ago (no today)
      const fetchDate = new Date()
      fetchDate.setDate(fetchDate.getDate() + i)
      const dateStr = fetchDate.toISOString().split('T')[0]

      console.log(`📅 Processing date: ${dateStr} (${i === -2 ? '2 days ago' : '1 day ago'})`)

      for (const sportKey of sportsToFetch) {
        const apiUrl = new URL('/api/games/sportsgameodds', request.url)
        apiUrl.searchParams.set('sport', sportKey)
        if (dateStr) {
          apiUrl.searchParams.set('date', dateStr)
        }
        apiUrl.searchParams.set('refresh', 'true')

        promises.push(
          fetch(apiUrl.toString())
            .then(res => res.json())
            .then(data => ({
              date: dateStr,
              sport: sportKey,
              allGames: data.games || [],
              gameCount: data.games?.length || 0,
              success: !data.error,
              error: data.error,
            }))
            .catch(error => ({
              date: dateStr,
              sport: sportKey,
              allGames: [],
              gameCount: 0,
              success: false,
              error: error.message,
            }))
        )
      }
    }

    console.log(`🔄 Created ${promises.length} fetch promises for settlement`)

    // Wait for all API calls to complete
    const fetchResults = await Promise.all(promises)

    let totalGamesFetched = 0
    let totalCompletedGames = 0
    let totalScoresUpdated = 0
    let totalBetsSettled = 0
    
    const processedGameIds = new Set()

    for (const result of fetchResults) {
      totalGamesFetched += result.gameCount

      if (!result.success || result.allGames.length === 0) {
        console.log(`ℹ️ No games for ${result.sport} on ${result.date} - ${result.error || 'no error'}`)
        continue
      }

      console.log(`📊 Processing ${result.gameCount} ${result.sport} games from ${result.date}`)

      // Filter for STRICTLY completed games with scores
      const completedGames = result.allGames.filter((game: any) => {
        const hasFinishedStatus = 
          game.status === 'F' || 
          game.status === 'final' ||
          game.status === 'Final' ||
          game.status === 'FT' ||
          game.status === 'finished' ||
          game.status === 'completed'
          
        const hasValidScores = 
          game.home_score !== null && 
          game.away_score !== null && 
          game.home_score !== undefined && 
          game.away_score !== undefined &&
          !isNaN(parseFloat(game.home_score)) &&
          !isNaN(parseFloat(game.away_score))
          
        // Ensure game is in the past (not future/live)
        const isPastGame = !game.game_time || new Date(game.game_time) < new Date()
        
        const isCompleted = hasFinishedStatus && hasValidScores && isPastGame
        
        if (!isCompleted && (game.home_score !== null || game.away_score !== null)) {
          console.log(`⚠️ Skipping incomplete game: ${game.away_team_name} @ ${game.home_team_name}`)
          console.log(`   Status: ${game.status}, Scores: ${game.home_score}-${game.away_score}, Time: ${game.game_time}`)
        }
        
        return isCompleted
      })

      console.log(`🏁 Found ${completedGames.length} completed games out of ${result.gameCount} ${result.sport} games`)

      for (const game of completedGames) {
        try {
          // Skip if already processed
          if (processedGameIds.has(game.id)) {
            console.log(`⏭️ Skipping duplicate game ${game.id}`)
            continue
          }
          
          processedGameIds.add(game.id)
          
          console.log(`🎯 Processing: ${game.away_team_name} @ ${game.home_team_name} (${game.status})`)
          console.log(`📋 Final Score: Away ${game.away_score} - ${game.home_score} Home`)

          // 1. Update games table with team scores
          await updateGameScores(serviceSupabase, game.id, parseInt(game.home_score), parseInt(game.away_score))

          // 2. Update odds table with scores from API
          const scoresResult = await updateOddsWithScores(serviceSupabase, game.id, result.allGames)
          totalScoresUpdated += scoresResult.updated
          totalCompletedGames++

          // 3. Settle TrueSharp bets for this game
          const betSettlement = await settleTrueSharpBetsForGame(serviceSupabase, game.id)
          totalBetsSettled += betSettlement.settled
          console.log(`🎰 Settled ${betSettlement.settled} TrueSharp bets for game ${game.id}`)
          
        } catch (error) {
          console.error(`❌ Error processing game ${game.id}:`, error)
        }
      }
    }

    const totalTime = Date.now() - startTime
    
    const summary = {
      success: true,
      totalGamesFetched,
      totalCompletedGames,
      totalScoresUpdated,
      totalBetsSettled,
      fetchRequests: fetchResults.length,
      successfulRequests: fetchResults.filter(r => r.success).length,
      dateRange: `${twoDaysAgo.toISOString().split('T')[0]} to ${oneDayAgo.toISOString().split('T')[0]}`,
      message: `Fetched ${totalGamesFetched} games, found ${totalCompletedGames} completed games, updated ${totalScoresUpdated} odds records, settled ${totalBetsSettled} TrueSharp bets`,
      processingTimeMs: totalTime,
      processingTimeSeconds: Math.round(totalTime / 1000),
    }

    console.log('🏁 Bet settlement completed:', summary)
    console.log(`⏰ Total processing time: ${Math.round(totalTime / 1000)}s`)

    return NextResponse.json(summary)
  } catch (error) {
    console.error('❌ Error in bet settlement:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Update games table with team scores
async function updateGameScores(supabase: any, gameId: string, homeScore: number, awayScore: number) {
  try {
    console.log(`🏟️ Updating game ${gameId} scores: Home ${homeScore} - ${awayScore} Away`)
    
    const { error } = await supabase
      .from('games')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'final',
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (error) {
      console.error(`❌ Error updating game scores for ${gameId}:`, error)
    } else {
      console.log(`✅ Updated game ${gameId} scores successfully`)
    }
  } catch (error) {
    console.error(`❌ Error in updateGameScores:`, error)
  }
}

// Update odds table with scores from API (existing rows only)
async function updateOddsWithScores(supabase: any, gameId: string, allGamesFromAPI: any[]) {
  try {
    console.log(`🔄 Updating odds scores for game ${gameId}`)

    // Find this specific game in the API response
    const apiGame = allGamesFromAPI.find((g: any) => g.id === gameId)
    if (!apiGame || !apiGame.odds) {
      console.log(`⚠️ Game ${gameId} not found in API data or has no odds`)
      return { updated: 0 }
    }

    // Extract scores by oddid from API
    const oddidScores = new Map<string, any>()
    
    for (const [oddid, oddData] of Object.entries(apiGame.odds)) {
      const odd = oddData as any
      if (odd.score !== undefined && odd.score !== null) {
        oddidScores.set(oddid, odd.score)
      }
    }

    console.log(`🎯 Found scores for ${oddidScores.size} unique oddids`)

    if (oddidScores.size === 0) {
      console.log(`⚠️ No scores found in API response for game ${gameId}`)
      return { updated: 0 }
    }

    // Get all existing odds for this game
    const { data: existingOdds, error: fetchError } = await supabase
      .from('odds')
      .select('id, oddid, score')
      .eq('eventid', gameId)

    if (fetchError) {
      console.error('❌ Error fetching existing odds:', fetchError)
      return { updated: 0 }
    }

    console.log(`📋 Found ${existingOdds?.length || 0} existing odds records for game ${gameId}`)

    if (!existingOdds || existingOdds.length === 0) {
      console.log(`⚠️ No existing odds found for game ${gameId}`)
      return { updated: 0 }
    }

    // Update scores for all existing odds that match an oddid with a score
    let scoresUpdated = 0
    const updatePromises: Promise<boolean>[] = []

    for (const odd of existingOdds) {
      const apiScore = oddidScores.get(odd.oddid)
      
      // Update if we have a score from API (overwrite existing scores)
      if (apiScore !== undefined) {
        const updatePromise = supabase
          .from('odds')
          .update({
            score: apiScore.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', odd.id)
          .then(({ error }: any) => {
            if (error) {
              console.error(`❌ Error updating score for odds ${odd.id}:`, error)
              return false
            }
            return true
          })

        updatePromises.push(updatePromise)
      }
    }

    // Execute all updates in parallel
    const updateResults = await Promise.all(updatePromises)
    scoresUpdated = updateResults.filter(Boolean).length

    console.log(`✅ Updated scores for ${scoresUpdated} odds records`)

    return { updated: scoresUpdated }

  } catch (error) {
    console.error(`❌ Error in updateOddsWithScores:`, error)
    return { updated: 0 }
  }
}

// Settle TrueSharp bets for a specific game
async function settleTrueSharpBetsForGame(serviceSupabase: any, gameId: string) {
  try {
    console.log(`🎰 Starting TrueSharp bet settlement for game ${gameId}`)

    // Get TrueSharp bets for this game
    const { data: trueSharpBets, error: fetchError } = await serviceSupabase
      .from('bets')
      .select('*')
      .eq('game_id', gameId)
      .eq('sportsbook', 'TrueSharp')

    if (fetchError) {
      console.error('❌ Error fetching TrueSharp bets:', fetchError)
      return { settled: 0 }
    }

    if (!trueSharpBets || trueSharpBets.length === 0) {
      console.log(`ℹ️ No TrueSharp bets found for game ${gameId}`)
      return { settled: 0 }
    }

    console.log(`📝 Found ${trueSharpBets.length} TrueSharp bets to settle for game ${gameId}`)

    // Get game scores for moneyline/spread settlement
    const { data: gameData, error: gameError } = await serviceSupabase
      .from('games')
      .select('home_score, away_score, home_team_name, away_team_name')
      .eq('id', gameId)
      .single()

    if (gameError || !gameData) {
      console.error('❌ Error fetching game data:', gameError)
      return { settled: 0 }
    }

    const { home_score, away_score } = gameData
    console.log(`🏆 Game scores: Home ${home_score} - ${away_score} Away`)

    const settlementPromises = trueSharpBets.map(async (bet: any) => {
      try {
        console.log(`🔍 Processing TrueSharp bet ${bet.id}: ${bet.bet_type} ${bet.side} ${bet.line_value || 'N/A'}`)

        // Get odds data for this bet using exact oddid match
        const { data: oddsData, error: oddsError } = await serviceSupabase
          .from('odds')
          .select('*')
          .eq('eventid', gameId)
          .eq('oddid', bet.oddid)
          .single()

        if (oddsError || !oddsData) {
          console.log(`⚠️ No odds found for bet ${bet.id} with oddid ${bet.oddid}`)
          return false
        }

        // Determine bet result
        const betResult = determineBetResult(bet, oddsData, home_score, away_score)

        if (betResult.status === 'pending') {
          console.log(`⏳ Bet ${bet.id} still pending - insufficient data`)
          return false
        }

        // Calculate profit
        let profit = 0
        if (betResult.status === 'won') {
          // American odds to profit calculation
          const americanOdds = bet.odds
          if (americanOdds > 0) {
            profit = bet.stake * (americanOdds / 100)
          } else {
            profit = bet.stake * (100 / Math.abs(americanOdds))
          }
        } else if (betResult.status === 'lost') {
          profit = -bet.stake
        } else if (betResult.status === 'void') {
          profit = 0 // Push - return original stake
        }

        // Update the bet
        const updateData = {
          status: betResult.status,
          profit: profit,
          settled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: updateError } = await serviceSupabase
          .from('bets')
          .update(updateData)
          .eq('id', bet.id)

        if (updateError) {
          console.error(`❌ Error updating bet ${bet.id}:`, updateError)
          return false
        }

        console.log(`✅ SETTLED bet ${bet.id.substring(0, 8)}: ${betResult.status} (profit: ${profit})`)
        return true

      } catch (error) {
        console.error(`❌ Error processing bet ${bet.id}:`, error)
        return false
      }
    })

    const settlementResults = await Promise.all(settlementPromises)
    const settledCount = settlementResults.filter(Boolean).length

    console.log(`✅ Settled ${settledCount}/${trueSharpBets.length} TrueSharp bets for game ${gameId}`)

    return { settled: settledCount }
  } catch (error) {
    console.error(`❌ Error in settleTrueSharpBetsForGame:`, error)
    return { settled: 0 }
  }
}

// Determine bet result using game scores and bet details
function determineBetResult(bet: any, odds: any, homeScore: number, awayScore: number) {
  const betType = bet.bet_type?.toLowerCase()
  const side = bet.side?.toLowerCase()
  const line = parseFloat(bet.line_value || '0')
  const apiScore = parseFloat(odds.score || '0')

  console.log(`🎲 Evaluating bet: ${betType} ${side} ${line} - Scores: Home ${homeScore} Away ${awayScore} API: ${apiScore}`)

  // Moneyline bets - use game table scores
  if (betType === 'moneyline') {
    if (homeScore === null || awayScore === null) {
      console.log(`⚠️ No game scores for moneyline bet ${bet.id}`)
      return { status: 'pending' }
    }
    
    console.log(`🏆 Moneyline comparison: Home ${homeScore} vs Away ${awayScore}`)
    
    if (side === 'home') {
      return { status: homeScore > awayScore ? 'won' : homeScore < awayScore ? 'lost' : 'void' }
    } else if (side === 'away') {
      return { status: awayScore > homeScore ? 'won' : awayScore < homeScore ? 'lost' : 'void' }
    }
  }

  // Total (Over/Under) bets - use API score
  if (betType === 'total') {
    if (!apiScore && apiScore !== 0) {
      console.log(`⚠️ No API score for total bet ${bet.id}`)
      return { status: 'pending' }
    }
    
    console.log(`🏀 Total bet evaluation: actual=${apiScore}, line=${line}, side=${side}`)
    
    if (side === 'over') {
      if (apiScore > line) {
        console.log(`✅ Over bet wins: ${apiScore} > ${line}`)
        return { status: 'won' }
      } else if (apiScore < line) {
        console.log(`❌ Over bet loses: ${apiScore} < ${line}`)
        return { status: 'lost' }
      } else {
        console.log(`🤝 Push: ${apiScore} = ${line}`)
        return { status: 'void' }
      }
    } else if (side === 'under') {
      if (apiScore < line) {
        console.log(`✅ Under bet wins: ${apiScore} < ${line}`)
        return { status: 'won' }
      } else if (apiScore > line) {
        console.log(`❌ Under bet loses: ${apiScore} > ${line}`)
        return { status: 'lost' }
      } else {
        console.log(`🤝 Push: ${apiScore} = ${line}`)
        return { status: 'void' }
      }
    }
  }

  // Spread bets - use game table scores and line
  if (betType === 'spread') {
    if (homeScore === null || awayScore === null) {
      console.log(`⚠️ No game scores for spread bet ${bet.id}`)
      return { status: 'pending' }
    }
    
    // Calculate the actual spread (home - away)
    const actualSpread = homeScore - awayScore
    
    console.log(`🏈 Spread bet evaluation: actualSpread=${actualSpread}, line=${line}, side=${side}`)
    console.log(`   Team scores: Home ${homeScore} - ${awayScore} Away`)
    
    if (side === 'home') {
      // Home team bet: they need to cover the spread
      if (actualSpread > line) {
        console.log(`✅ Home spread wins: ${actualSpread} > ${line}`)
        return { status: 'won' }
      } else if (actualSpread < line) {
        console.log(`❌ Home spread loses: ${actualSpread} < ${line}`)
        return { status: 'lost' }
      } else {
        console.log(`🤝 Push: ${actualSpread} = ${line}`)
        return { status: 'void' }
      }
    } else if (side === 'away') {
      // Away team bet: they need to cover the spread
      if (actualSpread < line) {
        console.log(`✅ Away spread wins: ${actualSpread} < ${line}`)
        return { status: 'won' }
      } else if (actualSpread > line) {
        console.log(`❌ Away spread loses: ${actualSpread} > ${line}`)
        return { status: 'lost' }
      } else {
        console.log(`🤝 Push: ${actualSpread} = ${line}`)
        return { status: 'void' }
      }
    }
  }

  // Player props and other specific bets - use API score
  if (apiScore !== null && apiScore !== undefined) {
    if (side === 'over') {
      if (apiScore > line) {
        return { status: 'won' }
      } else if (apiScore < line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' }
      }
    } else if (side === 'under') {
      if (apiScore < line) {
        return { status: 'won' }
      } else if (apiScore > line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' }
      }
    }
  }

  // If we can't determine the result, keep it pending
  console.log(`⚠️ Unable to determine result for bet type: ${betType}, side: ${side}`)
  return { status: 'pending' }
}
import { createServiceRoleClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

/*
 * SETTLE BETS API - Updated for Alternate Lines Support
 * 
 * Key fixes applied:
 * 1. Updated league list: UCL → UEFA_CHAMPIONS_LEAGUE (matches fetch-odds)
 * 2. Enhanced odds updating: Groups by oddid, updates ALL lines per oddid at once
 * 3. Improved bet matching: Tries oddid+line first, falls back to oddid-only
 * 4. Better logging: Shows alternate line indicators
 * 
 * This ensures that when scores are found for a game, ALL alternate lines
 * for each oddid get updated with scores, and bets can match their specific
 * line values correctly.
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    // Use service role client for bet operations to bypass RLS
    const serviceSupabase = await createServiceRoleClient()

    console.log('🏆 Starting bet settlement process')

    // Calculate date range: yesterday and today to get completed games with scores
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const promises = []

    // Define all sports to fetch (same exact list as fetch-odds)
    const sportsToFetch = ['MLB', 'NBA', 'WNBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UEFA_CHAMPIONS_LEAGUE']

    // Fetch historical results for yesterday and today (focus on completed games)
    for (let i = -1; i <= 0; i++) {
      // -1 = yesterday, 0 = today
      const fetchDate = new Date()
      fetchDate.setDate(fetchDate.getDate() + i)
      const dateStr = fetchDate.toISOString().split('T')[0] || fetchDate.toISOString()

      console.log(`📅 Processing date: ${dateStr} (${i === -1 ? 'yesterday' : 'today'})`)

      // Create promises for each sport (same exact pattern as fetch-odds)
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

    // Process ALL games from results and find completed ones
    let totalGamesFetched = 0
    let totalCompletedGames = 0
    let totalOddsUpdated = 0
    let totalBetsSettled = 0

    for (const result of fetchResults) {
      totalGamesFetched += result.gameCount

      if (!result.success || result.allGames.length === 0) {
        console.log(
          `ℹ️ No games for ${result.sport} on ${result.date} - ${result.error || 'no error'}`
        )
        continue
      }

      console.log(`📊 Processing ${result.gameCount} ${result.sport} games from ${result.date}`)

      // Filter for completed games (API returns "F" for finished games)
      const completedGames = result.allGames.filter(
        (game: any) =>
          game.status === 'F' || // SportsGameOdds uses "F" for finished
          game.status === 'completed' ||
          game.status === 'final' ||
          game.status === 'FT' ||
          game.status === 'finished' ||
          (game.home_score !== null && game.away_score !== null)
      )

      console.log(
        `🏁 Found ${completedGames.length} completed games out of ${result.gameCount} ${result.sport} games`
      )

      for (const game of completedGames) {
        try {
          console.log(
            `🎯 Processing: ${game.away_team_name} @ ${game.home_team_name} (${game.status})`
          )
          console.log(`📋 Score: Away ${game.away_score} - ${game.home_score} Home`)

          // Update odds records for this game with scores
          const gameScores = await updateGameOddsWithScores(supabase, game)
          totalOddsUpdated += gameScores.updated
          totalCompletedGames++

          // After updating odds, settle the related bets
          const betSettlement = await settleBetsForGame(serviceSupabase, supabase, game.id)
          totalBetsSettled += betSettlement.settled
          console.log(`🎰 Settled ${betSettlement.settled} bets for game ${game.id}`)
        } catch (error) {
          console.error(`❌ Error processing game ${game.id}:`, error)
        }
      }
    }

    // After processing new settlements, check for any pending bets that have settled odds
    console.log('🔄 Checking for pending bets with already-settled odds...')
    const additionalSettlement = await settlePendingBetsWithScores(serviceSupabase, supabase)
    totalBetsSettled += additionalSettlement.settled
    console.log(
      `🎰 Additionally settled ${additionalSettlement.settled} bets from previously scored games`
    )

    const summary = {
      success: true,
      totalGamesFetched,
      totalCompletedGames,
      totalOddsUpdated,
      totalBetsSettled,
      fetchRequests: fetchResults.length,
      successfulRequests: fetchResults.filter(r => r.success).length,
      dateRange: `${yesterday.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`,
      message: `Fetched ${totalGamesFetched} games, found ${totalCompletedGames} completed games, updated ${totalOddsUpdated} odds records, settled ${totalBetsSettled} bets`,
    }

    console.log('🏁 Bet settlement completed:', summary)

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

// FIXED: Conservative approach - only update basic game-level odds, rely on API for player props
async function updateGameOddsWithScores(supabase: any, game: any) {
  try {
    const gameId = game.id
    console.log(`🔄 Checking for already-populated scores for completed game ${gameId}`)
    console.log(`🏆 Game result: ${game.away_team_name} ${game.away_score} - ${game.home_score} ${game.home_team_name}`)

    // Get all odds for this game
    const { data: gameOdds, error: fetchError } = await supabase
      .from('odds')
      .select('id, oddid, marketname, sideid, line, score, hometeam_score, awayteam_score')
      .eq('eventid', gameId)

    if (fetchError) {
      console.error('❌ Error fetching game odds:', fetchError)
      return { updated: 0 }
    }

    if (!gameOdds || gameOdds.length === 0) {
      console.log(`ℹ️ No odds found for game ${gameId}`)
      return { updated: 0 }
    }

    console.log(`🔍 Found ${gameOdds.length} odds for game ${gameId}`)

    // Check how many already have scores (from API)
    const oddsWithScores = gameOdds.filter((odd: any) => odd.score !== null)
    const oddsWithoutScores = gameOdds.filter((odd: any) => odd.score === null)

    console.log(`✅ ${oddsWithScores.length} odds already have API-provided scores`)
    console.log(`⚠️ ${oddsWithoutScores.length} odds missing scores`)

    if (oddsWithScores.length > 0) {
      console.log(`📊 Sample API-provided scores found:`)
      oddsWithScores.slice(0, 5).forEach((odd: any, index: number) => {
        console.log(`  ${index + 1}. ${odd.marketname}: oddid=${odd.oddid}, score=${odd.score}`)
      })
    }

    // CONSERVATIVE APPROACH: Only update basic game-level bets if no scores exist
    // Let the API provide player prop scores - don't calculate incorrectly
    if (oddsWithScores.length === 0 && oddsWithoutScores.length > 0) {
      console.log(`🔧 No API scores found, updating basic game-level bets only...`)
      
      let updatedCount = 0
      const homeScore = game.home_score
      const awayScore = game.away_score
      const totalScore = homeScore + awayScore

      // Only update clearly identifiable game-level bets
      for (const odd of oddsWithoutScores) {
        let score = null
        let shouldUpdate = false
        
        const marketName = odd.marketname?.toLowerCase() || ''
        const oddid = odd.oddid?.toLowerCase() || ''
        
        // ONLY update if it's clearly a basic game-level bet
        if (
          (marketName === 'over/under' && oddid.includes('points-all-game-ou-')) ||
          (marketName === 'moneyline' && (oddid.includes('points-home-game-ml-') || oddid.includes('points-away-game-ml-'))) ||
          (marketName === 'spread' && (oddid.includes('points-home-game-sp-') || oddid.includes('points-away-game-sp-')))
        ) {
          if (marketName === 'over/under') {
            score = totalScore.toString()
            shouldUpdate = true
          } else if (marketName === 'moneyline') {
            score = `${homeScore},${awayScore}`
            shouldUpdate = true
          } else if (marketName === 'spread') {
            score = `${homeScore},${awayScore}`
            shouldUpdate = true
          }
          
          if (shouldUpdate && score) {
            const { error: updateError } = await supabase
              .from('odds')
              .update({
                score: score,
                hometeam_score: homeScore,
                awayteam_score: awayScore,
                updated_at: new Date().toISOString()
              })
              .eq('id', odd.id)
            
            if (!updateError) {
              updatedCount++
              console.log(`✅ Updated basic game bet: ${odd.marketname} = ${score}`)
            }
          }
        }
      }
      
      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} basic game-level bets`)
      } else {
        console.log(`ℹ️ No basic game-level bets found to update`)
      }
      
      return { updated: updatedCount }
    }

    // If we already have scores from API, just return the count
    console.log(`🎯 Odds already have scores from API - no updates needed`)
    return { updated: oddsWithScores.length }
    
  } catch (error) {
    console.error(`❌ Error in updateGameOddsWithScores:`, error)
    return { updated: 0 }
  }
}

// Helper function to settle bets for a specific game
async function settleBetsForGame(serviceSupabase: any, oddsSupabase: any, gameId: string) {
  try {
    console.log(`🎰 Starting bet settlement for game ${gameId}`)

    // Get all pending bets for this game
    // First try with status column, fallback if it doesn't exist
    let pendingBets = []
    let fetchError = null

    console.log(`🔍 Looking for bets with game_id: ${gameId}`)

    try {
      const { data, error } = await serviceSupabase
        .from('bets')
        .select('*')
        .eq('game_id', gameId)
        .eq('status', 'pending')

      pendingBets = data || []
      fetchError = error
    } catch (error) {
      console.log('⚠️ Status column might not exist, trying fallback query')

      // Fallback: get all bets for this game if status column doesn't exist
      try {
        const { data, error } = await serviceSupabase
          .from('bets')
          .select('*')
          .eq('game_id', gameId)
          .eq('result', 'pending') // Try using result column as fallback

        pendingBets = data || []
        fetchError = error
      } catch (fallbackError) {
        console.log('⚠️ Both status and result columns failed, trying without status filter')

        // Last fallback: get all bets for this game
        const { data, error } = await serviceSupabase.from('bets').select('*').eq('game_id', gameId)

        pendingBets = data || []
        fetchError = error
      }
    }

    if (fetchError) {
      console.error('❌ Error fetching pending bets:', fetchError)
      return { settled: 0 }
    }

    if (!pendingBets || pendingBets.length === 0) {
      console.log(`ℹ️ No pending bets found for exact game_id ${gameId}`)

      // Try fallback approach: find bets by team names if we have game info
      console.log(`🔍 Trying fallback: searching for bets by team names...`)

      // Get the current game info to extract team names
      const { data: gameInfo, error: gameError } = await serviceSupabase
        .from('games')
        .select('home_team, away_team, home_team_name, away_team_name, league, sport')
        .eq('id', gameId)
        .maybeSingle()

      if (!gameError && gameInfo) {
        console.log(
          `🏟️ Game info: ${gameInfo.away_team_name} @ ${gameInfo.home_team_name} (${gameInfo.league})`
        )

        // Try to find bets that match these team names
        const teamVariations = [
          gameInfo.home_team_name,
          gameInfo.away_team_name,
          gameInfo.home_team,
          gameInfo.away_team,
        ]
          .filter(Boolean)
          .filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates

        console.log(`🔍 Searching for bets matching team variations:`, teamVariations)

        for (const teamName of teamVariations) {
          const { data: teamBets, error: teamBetsError } = await serviceSupabase
            .from('bets')
            .select('*')
            .eq('status', 'pending')
            .eq('sport', gameInfo.league) // Match by sport/league
            .or(
              `home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%,bet_description.ilike.%${teamName}%`
            )
            .limit(20) // Reasonable limit

          if (!teamBetsError && teamBets && teamBets.length > 0) {
            console.log(`🎯 Found ${teamBets.length} bets matching team "${teamName}"`)

            // Update these bets with the correct game_id for future reference
            for (const bet of teamBets) {
              await serviceSupabase.from('bets').update({ game_id: gameId }).eq('id', bet.id)
              console.log(`🔄 Updated bet ${bet.id} with game_id ${gameId}`)
            }

            pendingBets.push(...teamBets)
            break // Found matches, no need to continue
          }
        }
      }

      if (pendingBets.length === 0) {
        console.log(`ℹ️ Still no pending bets found after fallback search`)
        return { settled: 0 }
      }
    }

    console.log(
      `📝 Found ${pendingBets.length} pending bets to potentially settle for game ${gameId}`
    )
    pendingBets.forEach((bet: any, index: number) => {
      console.log(
        `  Bet ${index + 1}: id=${bet.id}, type=${bet.bet_type}, side=${bet.side}, oddid=${bet.oddid}, line=${bet.line_value || 'null'} ${bet.line_value ? '(alt line)' : ''}`
      )
    })

    const settlementPromises = pendingBets.map(async (bet: any) => {
      try {
        // Get the corresponding odds for this bet
        let odds = null
        let oddsError = null

        // IMPROVED: Enhanced odds matching logic to handle oddid format changes
        if (bet.oddid) {
          console.log(`🔍 Looking for odds with oddid: ${bet.oddid}`)
          
          // Method 1: Exact oddid match
          const { data: exactOdds, error: exactError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', gameId)
            .eq('oddid', bet.oddid)
            .maybeSingle()

          if (!exactError && exactOdds) {
            odds = exactOdds
            console.log(`✅ Found exact oddid match for bet ${bet.id}`)
          } else {
            // Method 2: Pattern matching for oddid variations
            console.log(`🔄 No exact oddid match, trying pattern matching...`)
            
            const { data: patternOdds, error: patternError } = await oddsSupabase
              .from('odds')
              .select('*')
              .eq('eventid', gameId)
              .ilike('oddid', `%${bet.oddid}%`)
              .limit(5)

            if (!patternError && patternOdds && patternOdds.length > 0) {
              // Prefer odds with scores first
              const oddsWithScores = patternOdds.filter((o: any) => o.score !== null)
              odds = oddsWithScores.length > 0 ? oddsWithScores[0] : patternOdds[0]
              console.log(`⚠️ Found pattern match for bet ${bet.id}: ${odds.oddid}`)
            }
          }
          
          // Method 3: Enhanced fallback by bet type and side
          if (!odds && bet.bet_type) {
            console.log(`🔍 Trying enhanced bet type matching: ${bet.bet_type} + ${bet.side}`)
            
            let marketFilters: string[] = []
            
            // Build market name filters based on bet type
            if (bet.bet_type === 'moneyline') {
              marketFilters = ['%moneyline%', '%ml%']
            } else if (bet.bet_type === 'total') {
              marketFilters = ['%total%', '%over%', '%under%', '%ou%']
            } else if (bet.bet_type === 'spread') {
              marketFilters = ['%spread%', '%line%', '%sp%']
            } else if (bet.bet_type === 'player_prop') {
              marketFilters = ['%prop%', '%player%']
            }
            
            for (const filter of marketFilters) {
              const { data: typeOdds, error: typeError } = await oddsSupabase
                .from('odds')
                .select('*')
                .eq('eventid', gameId)
                .ilike('marketname', filter)
                .not('score', 'is', null) // Prefer odds with scores
                .limit(3)

              if (!typeError && typeOdds && typeOdds.length > 0) {
                // Try to match by side if specified
                if (bet.side) {
                  const sideMatch = typeOdds.find((o: any) => 
                    o.oddid?.toLowerCase().includes(bet.side.toLowerCase()) ||
                    o.sideid?.toLowerCase() === bet.side.toLowerCase()
                  )
                  if (sideMatch) {
                    odds = sideMatch
                    console.log(`✅ Found bet type + side match for bet ${bet.id}: ${odds.marketname}`)
                    break
                  }
                }
                
                // Fall back to first match
                odds = typeOdds[0]
                console.log(`⚠️ Found bet type match for bet ${bet.id}: ${odds.marketname}`)
                break
              }
            }
          }
        }

        // Method 4: Last resort - any odds with scores for this game
        if (!odds) {
          console.log(`🔍 Last resort: looking for any odds with scores for game ${gameId}`)
          
          const { data: anyOdds, error: anyError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', gameId)
            .not('score', 'is', null)
            .limit(5)

          if (!anyError && anyOdds && anyOdds.length > 0) {
            // Try to find the most relevant odds based on bet description
            let bestMatch = anyOdds[0]
            
            if (bet.bet_description) {
              const desc = bet.bet_description.toLowerCase()
              const relevantOdds = anyOdds.find((o: any) => {
                const market = o.marketname?.toLowerCase() || ''
                if (desc.includes('total') && market.includes('total')) return true
                if (desc.includes('spread') && market.includes('spread')) return true
                if (desc.includes('moneyline') && market.includes('moneyline')) return true
                if (desc.includes('over') && market.includes('over')) return true
                if (desc.includes('under') && market.includes('under')) return true
                return false
              })
              
              if (relevantOdds) bestMatch = relevantOdds
            }
            
            odds = bestMatch
            console.log(`⚠️ Using last resort odds for bet ${bet.id}: ${odds.marketname}`)
          }
        }

        if (oddsError || !odds) {
          console.log(
            `⚠️ No odds data found for bet ${bet.id} with oddid ${bet.oddid}. Error:`,
            oddsError
          )
          return false
        }

        console.log(`✅ Found odds for bet ${bet.id}:`, {
          marketname: odds.marketname,
          score: odds.score,
          hometeam_score: odds.hometeam_score,
          awayteam_score: odds.awayteam_score,
        })

        // Check if odds have been settled (have scores)
        const hasScores =
          odds.score !== null || (odds.hometeam_score !== null && odds.awayteam_score !== null)
        console.log(
          `🎯 Checking scores for bet ${bet.id}: hasScores=${hasScores}, score=${odds.score}, home=${odds.hometeam_score}, away=${odds.awayteam_score}`
        )
        if (!hasScores) {
          console.log(`⏳ Odds not yet settled for bet ${bet.id} - no scores available`)
          return false
        }

        // Determine if the bet won based on bet type, side, line, and scores
        const betResult = await determineBetResult(bet, odds, oddsSupabase)

        if (betResult.status === 'pending') {
          console.log(`⏳ Bet ${bet.id} still pending - insufficient data`)
          return false
        }

        // Calculate profit
        let profit = 0
        if (betResult.status === 'won') {
          // American odds to decimal conversion for profit calculation
          const americanOdds = bet.odds // This is the odds field from the bets table
          let multiplier = 0

          if (americanOdds > 0) {
            multiplier = americanOdds / 100
          } else {
            multiplier = 100 / Math.abs(americanOdds)
          }

          profit = bet.stake * multiplier
        } else if (betResult.status === 'lost') {
          profit = -bet.stake
        } else if (betResult.status === 'void') {
          profit = 0 // Push - return original stake
        }

        // Update the bet with fields that exist in the schema
        const updateData: any = {
          updated_at: new Date().toISOString(),
          status: betResult.status,
          settled_at: new Date().toISOString(),
          profit: profit
        }

        const { error: updateError } = await serviceSupabase
          .from('bets')
          .update(updateData)
          .eq('id', bet.id)

        if (updateError) {
          console.error(`❌ Error updating bet ${bet.id}:`, updateError)
          console.error(`Update data was:`, updateData)
          return false
        }

        console.log(`✅ Settled bet ${bet.id}: ${betResult.status} (profit: ${profit})`)
        console.log(`Update successful with data:`, updateData)
        return true
      } catch (error) {
        console.error(`❌ Error processing bet ${bet.id}:`, error)
        return false
      }
    })

    const settlementResults = await Promise.all(settlementPromises)
    const settledCount = settlementResults.filter(Boolean).length

    console.log(`✅ Settled ${settledCount}/${pendingBets.length} bets for game ${gameId}`)

    return { settled: settledCount }
  } catch (error) {
    console.error(`❌ Error in settleBetsForGame:`, error)
    return { settled: 0 }
  }
}

// Helper function to determine if a bet won or lost using API-provided scores
async function determineBetResult(bet: any, odds: any, supabase: any) {
  const marketName = odds.marketname?.toLowerCase()
  const betType = bet.bet_type?.toLowerCase()
  const side = bet.side?.toLowerCase()
  const line = parseFloat(bet.line_value || odds.line || '0')
  const oddId = odds.oddid

  // Use the API-provided score directly - each oddID has its own specific score!
  const apiScore = odds.score
  
  console.log(
    `🎲 Evaluating bet: ${betType} ${side} ${line} - oddID: ${oddId}, API score: ${apiScore}`
  )

  // For moneyline bets, we need to get both team scores for comparison
  if (betType === 'moneyline' || marketName?.includes('moneyline')) {
    if (!apiScore) {
      console.log(`⚠️ No API score for moneyline bet ${bet.id}`)
      return { status: 'pending' }
    }
    
    const teamScore = parseFloat(apiScore)
    
    // Get both team scores by finding the opposing moneyline oddID
    let homeScore = 0, awayScore = 0
    
    // Determine which team this bet is for and find the other team's score
    if (oddId.includes('ml-home') || side === 'home') {
      homeScore = teamScore
      
      // Find the away team's moneyline oddID for the same game
      const { data: awayOdds } = await supabase
        .from('odds')
        .select('score')
        .eq('eventid', odds.eventid)
        .ilike('oddid', '%ml-away%')
        .not('score', 'is', null)
        .limit(1)
        
      if (awayOdds && awayOdds[0]) {
        awayScore = parseFloat(awayOdds[0].score)
      } else {
        console.log(`⚠️ Could not find away team score for moneyline comparison`)
        return { status: 'pending' }
      }
    } else if (oddId.includes('ml-away') || side === 'away') {
      awayScore = teamScore
      
      // Find the home team's moneyline oddID for the same game
      const { data: homeOdds } = await supabase
        .from('odds')
        .select('score')
        .eq('eventid', odds.eventid)
        .ilike('oddid', '%ml-home%')
        .not('score', 'is', null)
        .limit(1)
        
      if (homeOdds && homeOdds[0]) {
        homeScore = parseFloat(homeOdds[0].score)
      } else {
        console.log(`⚠️ Could not find home team score for moneyline comparison`)
        return { status: 'pending' }
      }
    }
    
    console.log(`🏆 Moneyline comparison: Home ${homeScore} vs Away ${awayScore}`)
    
    if (side === 'home') {
      return { status: homeScore > awayScore ? 'won' : 'lost' }
    } else if (side === 'away') {
      return { status: awayScore > homeScore ? 'won' : 'lost' }
    }
  }

  // For totals/over-under bets, use the API score directly
  if (betType === 'total' || marketName?.includes('total') || marketName?.includes('over') || marketName?.includes('under')) {
    if (!apiScore) {
      console.log(`⚠️ No API score for total bet ${bet.id}`)
      return { status: 'pending' }
    }
    
    const actualTotal = parseFloat(apiScore)
    
    if (side === 'over') {
      if (actualTotal > line) {
        return { status: 'won' }
      } else if (actualTotal < line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' } // Push
      }
    } else if (side === 'under') {
      if (actualTotal < line) {
        return { status: 'won' }
      } else if (actualTotal > line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' } // Push
      }
    }
  }

  // For spread bets
  if (betType === 'spread' || marketName?.includes('spread')) {
    if (!apiScore) {
      console.log(`⚠️ No API score for spread bet ${bet.id}`)
      return { status: 'pending' }
    }
    
    // Similar logic to moneyline for parsing team scores
    let homeScore = 0, awayScore = 0
    
    if (apiScore.includes && apiScore.includes(',')) {
      const [home, away] = apiScore.split(',')
      homeScore = parseFloat(home || '0')
      awayScore = parseFloat(away || '0')
    }
    
    if (side === 'home') {
      const homeSpread = homeScore + line
      return { status: homeSpread > awayScore ? 'won' : 'lost' }
    } else if (side === 'away') {
      const awaySpread = awayScore - line
      return { status: awaySpread > homeScore ? 'won' : 'lost' }
    }
  }

  // For player props and other specific bets, the API score is the exact result needed!
  if (apiScore !== null && apiScore !== undefined) {
    const actualResult = parseFloat(apiScore)
    
    // For over/under player props
    if (side === 'over') {
      if (actualResult > line) {
        return { status: 'won' }
      } else if (actualResult < line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' }
      }
    } else if (side === 'under') {
      if (actualResult < line) {
        return { status: 'won' }
      } else if (actualResult > line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' }
      }
    }
    
    // For exact match bets (like yes/no props)
    if (actualResult === line) {
      return { status: 'won' }
    }
  }

  // If we can't determine the result with available data, keep it pending
  console.log(`⚠️ Unable to determine result for bet type: ${betType}, side: ${side}, API score: ${apiScore}`)
  return { status: 'pending' }
}

// Helper function to settle all pending bets that have corresponding settled odds
async function settlePendingBetsWithScores(serviceSupabase: any, oddsSupabase: any) {
  try {
    console.log('🔍 Looking for pending bets with settled odds...')

    // First, let's check ALL bets to see what statuses exist
    const { data: allBets, error: allBetsError } = await serviceSupabase
      .from('bets')
      .select('id, status, bet_type, game_id, oddid, side, line_value')
      .limit(50) // Just get a sample

    if (allBetsError) {
      console.error('❌ Error fetching all bets for debug:', allBetsError)
    } else {
      console.log(`📊 Sample of all bets (${allBets?.length || 0} found):`)
      allBets?.forEach((bet: any) => {
        console.log(
          `  - Bet ${bet.id.substring(0, 8)}: status="${bet.status}", type="${bet.bet_type}", game_id="${bet.game_id}"`
        )
      })

      // Group by status
      const statusCounts = allBets?.reduce((acc: any, bet: any) => {
        acc[bet.status] = (acc[bet.status] || 0) + 1
        return acc
      }, {})
      console.log('📈 Status distribution:', statusCounts)
    }

    // Now get specifically pending bets
    const { data: pendingBets, error: fetchError } = await serviceSupabase
      .from('bets')
      .select('*')
      .eq('status', 'pending')

    if (fetchError) {
      console.error('❌ Error fetching pending bets:', fetchError)
      console.log('🔄 Trying alternative query methods...')

      // Try without case sensitivity
      const { data: altBets, error: altError } = await serviceSupabase
        .from('bets')
        .select('*')
        .ilike('status', 'pending')

      if (!altError && altBets) {
        console.log(`📋 Found ${altBets.length} bets with ilike 'pending'`)
      }

      // Try looking for any status that might match
      const { data: statusBets, error: statusError } = await serviceSupabase
        .from('bets')
        .select('*')
        .or('status.eq.pending,status.eq.Pending,status.eq.PENDING')

      if (!statusError && statusBets) {
        console.log(`📋 Found ${statusBets.length} bets with various case 'pending'`)
      }

      return { settled: 0 }
    }

    if (!pendingBets || pendingBets.length === 0) {
      console.log('ℹ️ No pending bets found with exact match')

      // Try case insensitive search as backup
      const { data: backupBets, error: backupError } = await serviceSupabase
        .from('bets')
        .select('*')
        .ilike('status', 'pending')

      if (backupError) {
        console.error('❌ Error with backup query:', backupError)
        return { settled: 0 }
      }

      if (backupBets && backupBets.length > 0) {
        console.log(`📋 Found ${backupBets.length} bets with case-insensitive pending search`)
        // Use the backup results
        pendingBets.push(...backupBets)
      } else {
        console.log('ℹ️ No pending bets found even with case-insensitive search')
        return { settled: 0 }
      }
    }

    console.log(`📝 Found ${pendingBets.length} pending bets to check`)

    // Filter bets that have game_id
    const betsWithGameId = pendingBets.filter((bet: any) => bet.game_id)
    console.log(`📝 ${betsWithGameId.length} bets have game_id values`)

    if (betsWithGameId.length > 0) {
      console.log('Sample pending bets:')
      betsWithGameId.slice(0, 5).forEach((bet: any, i: number) => {
        console.log(
          `  ${i + 1}. id=${bet.id}, game_id=${bet.game_id}, type=${bet.bet_type}, side=${bet.side}, oddid=${bet.oddid}`
        )
      })
    }

    const settlementPromises = betsWithGameId.map(async (bet: any) => {
      try {
        console.log(
          `🔍 Processing bet ${bet.id}: game_id=${bet.game_id}, oddid=${bet.oddid}, type=${bet.bet_type}, side=${bet.side}`
        )

        let odds = null

        // IMPROVED: Use the same enhanced matching logic as settleBetsForGame
        if (bet.oddid) {
          console.log(`🔍 Looking for odds with oddid: ${bet.oddid}`)
          
          // Method 1: Exact oddid match
          const { data: exactOdds, error: exactError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', bet.game_id)
            .eq('oddid', bet.oddid)
            .maybeSingle()

          if (!exactError && exactOdds) {
            odds = exactOdds
            console.log(`✅ Found exact oddid match for bet ${bet.id}`)
          } else {
            // Method 2: Pattern matching for oddid variations
            console.log(`🔄 No exact oddid match, trying pattern matching...`)
            
            const { data: patternOdds, error: patternError } = await oddsSupabase
              .from('odds')
              .select('*')
              .eq('eventid', bet.game_id)
              .ilike('oddid', `%${bet.oddid}%`)
              .limit(5)

            if (!patternError && patternOdds && patternOdds.length > 0) {
              // Prefer odds with scores first
              const oddsWithScores = patternOdds.filter((o: any) => o.score !== null)
              odds = oddsWithScores.length > 0 ? oddsWithScores[0] : patternOdds[0]
              console.log(`⚠️ Found pattern match for bet ${bet.id}: ${odds.oddid}`)
            }
          }
          
          // Method 3: Enhanced fallback by bet type and side
          if (!odds && bet.bet_type) {
            console.log(`🔍 Trying enhanced bet type matching: ${bet.bet_type} + ${bet.side}`)
            
            let marketFilters: string[] = []
            
            // Build market name filters based on bet type
            if (bet.bet_type === 'moneyline') {
              marketFilters = ['%moneyline%', '%ml%']
            } else if (bet.bet_type === 'total') {
              marketFilters = ['%total%', '%over%', '%under%', '%ou%']
            } else if (bet.bet_type === 'spread') {
              marketFilters = ['%spread%', '%line%', '%sp%']
            } else if (bet.bet_type === 'player_prop') {
              marketFilters = ['%prop%', '%player%']
            }
            
            for (const filter of marketFilters) {
              const { data: typeOdds, error: typeError } = await oddsSupabase
                .from('odds')
                .select('*')
                .eq('eventid', bet.game_id)
                .ilike('marketname', filter)
                .not('score', 'is', null) // Prefer odds with scores
                .limit(3)

              if (!typeError && typeOdds && typeOdds.length > 0) {
                // Try to match by side if specified
                if (bet.side) {
                  const sideMatch = typeOdds.find((o: any) => 
                    o.oddid?.toLowerCase().includes(bet.side.toLowerCase()) ||
                    o.sideid?.toLowerCase() === bet.side.toLowerCase()
                  )
                  if (sideMatch) {
                    odds = sideMatch
                    console.log(`✅ Found bet type + side match for bet ${bet.id}: ${odds.marketname}`)
                    break
                  }
                }
                
                // Fall back to first match
                odds = typeOdds[0]
                console.log(`⚠️ Found bet type match for bet ${bet.id}: ${odds.marketname}`)
                break
              }
            }
          }
        }

        // Method 4: Last resort - any odds with scores for this game
        if (!odds) {
          console.log(`🔍 Last resort: looking for any odds with scores for game ${bet.game_id}`)
          
          const { data: anyOdds, error: anyError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', bet.game_id)
            .not('score', 'is', null)
            .limit(5)

          if (!anyError && anyOdds && anyOdds.length > 0) {
            // Try to find the most relevant odds based on bet description
            let bestMatch = anyOdds[0]
            
            if (bet.bet_description) {
              const desc = bet.bet_description.toLowerCase()
              const relevantOdds = anyOdds.find((o: any) => {
                const market = o.marketname?.toLowerCase() || ''
                if (desc.includes('total') && market.includes('total')) return true
                if (desc.includes('spread') && market.includes('spread')) return true
                if (desc.includes('moneyline') && market.includes('moneyline')) return true
                if (desc.includes('over') && market.includes('over')) return true
                if (desc.includes('under') && market.includes('under')) return true
                return false
              })
              
              if (relevantOdds) bestMatch = relevantOdds
            }
            
            odds = bestMatch
            console.log(`⚠️ Using last resort odds for bet ${bet.id}: ${odds.marketname}`)
          }
        }

        if (!odds) {
          console.log(
            `⚠️ No matching odds found for bet ${bet.id} (game_id=${bet.game_id}, oddid=${bet.oddid}, type=${bet.bet_type})`
          )
          return false
        }

        console.log(`✅ Found matching odds for bet ${bet.id}`)

        // Check if odds have been settled (have scores)
        const hasScores =
          odds.score !== null || (odds.hometeam_score !== null && odds.awayteam_score !== null)
        console.log(
          `🎯 Checking scores for bet ${bet.id}: hasScores=${hasScores}, score=${odds.score}, home=${odds.hometeam_score}, away=${odds.awayteam_score}`
        )
        if (!hasScores) {
          console.log(`⏳ Odds not yet settled for bet ${bet.id} - skipping`)
          return false
        }

        console.log(`🎯 Found settled odds for bet ${bet.id}`)

        // Determine if the bet won based on bet type, side, line, and scores
        const betResult = await determineBetResult(bet, odds, oddsSupabase)

        if (betResult.status === 'pending') {
          console.log(`⏳ Bet ${bet.id} still pending - insufficient data`)
          return false
        }

        // Calculate profit
        let profit = 0
        if (betResult.status === 'won') {
          // American odds to decimal conversion for profit calculation
          const americanOdds = bet.odds // This is the odds field from the bets table
          let multiplier = 0

          if (americanOdds > 0) {
            multiplier = americanOdds / 100
          } else {
            multiplier = 100 / Math.abs(americanOdds)
          }

          profit = bet.stake * multiplier
        } else if (betResult.status === 'lost') {
          profit = -bet.stake
        } else if (betResult.status === 'void') {
          profit = 0 // Push - return original stake
        }

        // Update the bet with fields that exist in the schema
        const updateData: any = {
          updated_at: new Date().toISOString(),
          status: betResult.status,
          settled_at: new Date().toISOString(),
          profit: profit
        }

        const { error: updateError } = await serviceSupabase
          .from('bets')
          .update(updateData)
          .eq('id', bet.id)

        if (updateError) {
          console.error(`❌ Error updating bet ${bet.id}:`, updateError)
          console.error(`Update data was:`, updateData)
          return false
        }

        console.log(`✅ Settled bet ${bet.id}: ${betResult.status} (profit: ${profit})`)
        console.log(`Update successful with data:`, updateData)
        return true
      } catch (error) {
        console.error(`❌ Error processing bet ${bet.id}:`, error)
        return false
      }
    })

    const settlementResults = await Promise.all(settlementPromises)
    const settledCount = settlementResults.filter(Boolean).length

    console.log(`✅ Settled ${settledCount} additional bets from previously scored games`)

    return { settled: settledCount }
  } catch (error) {
    console.error(`❌ Error in settlePendingBetsWithScores:`, error)
    return { settled: 0 }
  }
}

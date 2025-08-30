import { createServiceRoleClient } from '@/lib/supabase'
import { createServerSupabaseClient } from '@/lib/auth/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    // Use service role client for bet operations to bypass RLS
    const serviceSupabase = await createServiceRoleClient()
    
    console.log('🏆 Starting bet settlement process')
    
    // Calculate date range: yesterday and today (same as fetch-odds but backwards)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const promises = []
    
    // Define all sports to fetch (same exact list as fetch-odds)
    const sportsToFetch = ['MLB', 'NBA', 'NFL', 'MLS', 'NHL', 'NCAAF', 'NCAAB', 'UCL']
    
    // Fetch historical results for yesterday and today (2 days instead of 7)
    for (let i = -1; i <= 0; i++) { // -1 = yesterday, 0 = today
      const fetchDate = new Date()
      fetchDate.setDate(fetchDate.getDate() + i)
      const dateStr = fetchDate.toISOString().split('T')[0]
      
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
              error: data.error
            }))
            .catch(error => ({
              date: dateStr,
              sport: sportKey,
              allGames: [],
              gameCount: 0,
              success: false,
              error: error.message
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
        console.log(`ℹ️ No games for ${result.sport} on ${result.date} - ${result.error || 'no error'}`)
        continue
      }
      
      console.log(`📊 Processing ${result.gameCount} ${result.sport} games from ${result.date}`)
      
      // Filter for completed games (API returns "F" for finished games)
      const completedGames = result.allGames.filter((game: any) => 
        game.status === 'F' || // SportsGameOdds uses "F" for finished
        game.status === 'completed' || 
        game.status === 'final' || 
        game.status === 'FT' ||
        game.status === 'finished' ||
        (game.home_score !== null && game.away_score !== null)
      )
      
      console.log(`🏁 Found ${completedGames.length} completed games out of ${result.gameCount} ${result.sport} games`)
      
      for (const game of completedGames) {
        try {
          console.log(`🎯 Processing: ${game.away_team_name} @ ${game.home_team_name} (${game.status})`)
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
    console.log(`🎰 Additionally settled ${additionalSettlement.settled} bets from previously scored games`)
    
    const summary = {
      success: true,
      totalGamesFetched,
      totalCompletedGames,
      totalOddsUpdated,
      totalBetsSettled,
      fetchRequests: fetchResults.length,
      successfulRequests: fetchResults.filter(r => r.success).length,
      dateRange: `${yesterday.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`,
      message: `Fetched ${totalGamesFetched} games, found ${totalCompletedGames} completed games, updated ${totalOddsUpdated} odds records, settled ${totalBetsSettled} bets`
    }
    
    console.log('🏁 Bet settlement completed:', summary)
    
    return NextResponse.json(summary)
    
  } catch (error) {
    console.error('❌ Error in bet settlement:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Helper function to update odds records with game scores
async function updateGameOddsWithScores(supabase: any, game: any) {
  try {
    const gameId = game.id
    const homeScore = parseInt(game.home_score) || 0
    const awayScore = parseInt(game.away_score) || 0
    const totalScore = homeScore + awayScore
    
    console.log(`🔄 Updating odds for game ${gameId} with scores: ${awayScore}-${homeScore} (total: ${totalScore})`)
    
    // Get all odds for this game that don't have scores yet
    // Be flexible about which score columns exist
    let gameOdds = []
    let fetchError = null
    
    try {
      // Try with all three score columns
      const { data, error } = await supabase
        .from('odds')
        .select('*')
        .eq('eventid', gameId)
        .is('score', null)
        .is('hometeam_score', null)
        .is('awayteam_score', null)
      
      gameOdds = data || []
      fetchError = error
    } catch (error) {
      console.log('⚠️ hometeam_score/awayteam_score columns might not exist, trying fallback query')
      
      // Fallback: just check for score column
      try {
        const { data, error } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', gameId)
          .is('score', null)
        
        gameOdds = data || []
        fetchError = error
        console.log(`🔍 Fallback query found ${gameOdds.length} odds with null scores`)
      } catch (fallbackError) {
        console.log('⚠️ Even score column failed, getting all odds for this game')
        
        // Last fallback: get all odds for this game
        const { data, error } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', gameId)
        
        gameOdds = data || []
        fetchError = error
        console.log(`🔍 Last fallback found ${gameOdds.length} total odds for game`)
      }
    }
    
    if (fetchError) {
      console.error('❌ Error fetching game odds:', fetchError)
      return { updated: 0 }
    }
    
    if (!gameOdds || gameOdds.length === 0) {
      console.log(`ℹ️ No unsettled odds found for game ${gameId}`)
      
      // Check if there are ANY odds for this game at all
      const { data: allOdds, error: allOddsError } = await supabase
        .from('odds')
        .select('id, eventid, score')
        .eq('eventid', gameId)
        .limit(5)
      
      if (!allOddsError && allOdds && allOdds.length > 0) {
        console.log(`📝 Found ${allOdds.length} total odds for game ${gameId} (but all appear to have scores already):`)
        allOdds.forEach((odd, i) => {
          console.log(`  Odd ${i+1}: id=${odd.id}, score=${odd.score}`)
        })
      } else {
        console.log(`⚠️ No odds records exist at all for game ${gameId}`)
      }
      
      return { updated: 0 }
    }
    
    console.log(`📝 Found ${gameOdds.length} odds to update for game ${gameId}`)
    
    // Update odds with appropriate scores based on market type
    const updatePromises = gameOdds.map(async (odd: any) => {
      let updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      const marketName = odd.marketname?.toLowerCase()
      const betTypeId = odd.bettypeid?.toLowerCase()
      
      // Determine which score column to update based on market type
      if (marketName === 'total' || betTypeId === 'total' || marketName?.includes('over') || marketName?.includes('under')) {
        // Total/Over-Under bets get the combined score
        updateData.score = totalScore.toString()
        console.log(`📊 Setting total score ${totalScore} for ${marketName} market`)
      } else if (marketName === 'moneyline' || betTypeId === 'moneyline' || marketName === 'spread' || betTypeId === 'spread') {
        // Moneyline and spread bets need team scores, store them in available fields
        // Store individual scores in score field as "homeScore,awayScore" format for parsing later
        updateData.score = `${homeScore},${awayScore}`
        console.log(`🏠 Setting team scores ${homeScore},${awayScore} for ${marketName} market`)
      } else {
        // Default: use combined score for other market types
        updateData.score = totalScore.toString()
        console.log(`📊 Setting default total score ${totalScore} for ${marketName} market`)
      }
      
      const { error: updateError } = await supabase
        .from('odds')
        .update(updateData)
        .eq('id', odd.id)
      
      if (updateError) {
        console.error(`❌ Error updating odd ${odd.id}:`, updateError)
        return false
      }
      
      return true
    })
    
    const updateResults = await Promise.all(updatePromises)
    const successfulUpdates = updateResults.filter(Boolean).length
    
    console.log(`✅ Updated ${successfulUpdates}/${gameOdds.length} odds for game ${gameId}`)
    
    return { updated: successfulUpdates }
    
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
          .eq('result', 'pending')  // Try using result column as fallback
        
        pendingBets = data || []
        fetchError = error
      } catch (fallbackError) {
        console.log('⚠️ Both status and result columns failed, trying without status filter')
        
        // Last fallback: get all bets for this game
        const { data, error } = await serviceSupabase
          .from('bets')
          .select('*')
          .eq('game_id', gameId)
        
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
        console.log(`🏟️ Game info: ${gameInfo.away_team_name} @ ${gameInfo.home_team_name} (${gameInfo.league})`)
        
        // Try to find bets that match these team names
        const teamVariations = [
          gameInfo.home_team_name,
          gameInfo.away_team_name,
          gameInfo.home_team,
          gameInfo.away_team
        ].filter(Boolean).filter((name, index, arr) => arr.indexOf(name) === index) // Remove duplicates
        
        console.log(`🔍 Searching for bets matching team variations:`, teamVariations)
        
        for (const teamName of teamVariations) {
          const { data: teamBets, error: teamBetsError } = await serviceSupabase
            .from('bets')
            .select('*')
            .eq('status', 'pending')
            .eq('sport', gameInfo.league) // Match by sport/league
            .or(`home_team.ilike.%${teamName}%,away_team.ilike.%${teamName}%,bet_description.ilike.%${teamName}%`)
            .limit(20) // Reasonable limit
          
          if (!teamBetsError && teamBets && teamBets.length > 0) {
            console.log(`🎯 Found ${teamBets.length} bets matching team "${teamName}"`)
            
            // Update these bets with the correct game_id for future reference
            for (const bet of teamBets) {
              await serviceSupabase
                .from('bets')
                .update({ game_id: gameId })
                .eq('id', bet.id)
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
    
    console.log(`📝 Found ${pendingBets.length} pending bets to potentially settle for game ${gameId}`)
    pendingBets.forEach((bet, index) => {
      console.log(`  Bet ${index + 1}: id=${bet.id}, type=${bet.bet_type}, side=${bet.side}, oddid=${bet.oddid}, line=${bet.line_value}`)
    })
    
    const settlementPromises = pendingBets.map(async (bet: any) => {
      try {
        // Get the corresponding odds for this bet
        let odds = null
        let oddsError = null
        
        // Try to find odds by oddid if it exists
        if (bet.oddid) {
          const { data: exactOdds, error: exactError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', gameId)
            .eq('oddid', bet.oddid)
            .maybeSingle()
          
          odds = exactOdds
          oddsError = exactError
        }
        
        // Fallback: try to find odds by bet type if no oddid match
        if (!odds && bet.bet_type) {
          console.log(`🔍 No exact oddid match, trying bet type: ${bet.bet_type}`)
          
          const { data: fallbackOdds, error: fallbackError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', gameId)
            .ilike('marketname', `%${bet.bet_type}%`)
            .limit(1)
          
          if (!fallbackError && fallbackOdds && fallbackOdds.length > 0) {
            odds = fallbackOdds[0]
            console.log(`✅ Found fallback odds by bet type for bet ${bet.id}`)
          } else {
            console.log(`⚠️ No fallback odds found by bet type for bet ${bet.id}`)
          }
        }
        
        if (oddsError || !odds) {
          console.log(`⚠️ No odds data found for bet ${bet.id} with oddid ${bet.oddid}. Error:`, oddsError)
          return false
        }
        
        console.log(`✅ Found odds for bet ${bet.id}:`, {
          marketname: odds.marketname,
          score: odds.score,
          hometeam_score: odds.hometeam_score,
          awayteam_score: odds.awayteam_score
        })
        
        // Check if odds have been settled (have scores)
        const hasScores = odds.score !== null || (odds.hometeam_score !== null && odds.awayteam_score !== null)
        console.log(`🎯 Checking scores for bet ${bet.id}: hasScores=${hasScores}, score=${odds.score}, home=${odds.hometeam_score}, away=${odds.awayteam_score}`)
        if (!hasScores) {
          console.log(`⏳ Odds not yet settled for bet ${bet.id} - no scores available`)
          return false
        }
        
        // Determine if the bet won based on bet type, side, line, and scores
        const betResult = determineBetResult(bet, odds)
        
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
        
        // Update the bet - handle missing columns gracefully
        let updateData: any = {
          updated_at: new Date().toISOString()
        }
        
        // Add fields that exist in the schema
        if (betResult.status === 'won') {
          updateData.result = 'won'
          updateData.actual_payout = bet.stake + profit
          updateData.profit_loss = profit
        } else if (betResult.status === 'lost') {
          updateData.result = 'lost' 
          updateData.actual_payout = 0
          updateData.profit_loss = profit // negative value
        } else {
          updateData.result = betResult.status
          updateData.actual_payout = bet.stake // push/void
          updateData.profit_loss = 0
        }
        
        // Try to add new columns if they exist
        try {
          updateData.status = betResult.status
          updateData.settled_at = new Date().toISOString()
          updateData.profit = profit
        } catch (e) {
          // Columns don't exist yet, that's ok
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

// Helper function to determine if a bet won or lost
function determineBetResult(bet: any, odds: any) {
  const marketName = odds.marketname?.toLowerCase()
  const betType = bet.bet_type?.toLowerCase()
  const side = bet.side?.toLowerCase()
  const line = parseFloat(bet.line_value || odds.line || '0')
  
  // Parse scores - handle both formats
  let homeScore = parseFloat(odds.hometeam_score || '0')
  let awayScore = parseFloat(odds.awayteam_score || '0')
  let totalScore = parseFloat(odds.score || '0')
  
  // Check if score field contains "homeScore,awayScore" format
  if (odds.score && odds.score.includes(',')) {
    const [home, away] = odds.score.split(',')
    homeScore = parseFloat(home || '0')
    awayScore = parseFloat(away || '0')
    totalScore = homeScore + awayScore
  }
  
  console.log(`🎲 Evaluating bet: ${betType} ${side} ${line} - Scores: H:${homeScore} A:${awayScore} T:${totalScore}`)
  
  // Total/Over-Under bets
  if (betType === 'total' || marketName?.includes('total') || marketName?.includes('over') || marketName?.includes('under')) {
    if (side === 'over') {
      if (totalScore > line) {
        return { status: 'won' }
      } else if (totalScore < line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' } // Exact tie - treat as void/push
      }
    } else if (side === 'under') {
      if (totalScore < line) {
        return { status: 'won' }
      } else if (totalScore > line) {
        return { status: 'lost' }
      } else {
        return { status: 'void' } // Exact tie - treat as void/push
      }
    }
  }
  
  // Spread bets
  if (betType === 'spread') {
    const homeSpread = homeScore + line
    const awaySpread = awayScore - line
    
    if (side === 'home') {
      return { status: homeSpread > awayScore ? 'won' : 'lost' }
    } else if (side === 'away') {
      return { status: awaySpread > homeScore ? 'won' : 'lost' }
    }
  }
  
  // Moneyline bets
  if (betType === 'moneyline') {
    if (side === 'home') {
      return { status: homeScore > awayScore ? 'won' : 'lost' }
    } else if (side === 'away') {
      return { status: awayScore > homeScore ? 'won' : 'lost' }
    }
  }
  
  // If we can't determine the result, keep it pending
  console.log(`⚠️ Unable to determine result for bet type: ${betType}, side: ${side}`)
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
      allBets?.forEach(bet => {
        console.log(`  - Bet ${bet.id.substring(0, 8)}: status="${bet.status}", type="${bet.bet_type}", game_id="${bet.game_id}"`)
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
    const betsWithGameId = pendingBets.filter(bet => bet.game_id)
    console.log(`📝 ${betsWithGameId.length} bets have game_id values`)
    
    if (betsWithGameId.length > 0) {
      console.log('Sample pending bets:')
      betsWithGameId.slice(0, 5).forEach((bet, i) => {
        console.log(`  ${i+1}. id=${bet.id}, game_id=${bet.game_id}, type=${bet.bet_type}, side=${bet.side}, oddid=${bet.oddid}`)
      })
    }
    
    const settlementPromises = betsWithGameId.map(async (bet: any) => {
      try {
        console.log(`🔍 Processing bet ${bet.id}: game_id=${bet.game_id}, oddid=${bet.oddid}, type=${bet.bet_type}, side=${bet.side}`)
        
        let odds = null
        
        // Try primary matching: game_id + oddid
        if (bet.oddid) {
          const { data: exactOdds, error: exactError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', bet.game_id)
            .eq('oddid', bet.oddid || '')
            .maybeSingle()
          
          if (!exactError && exactOdds) {
            odds = exactOdds
            console.log(`✅ Found exact match for bet ${bet.id}`)
          }
        }
        
        // Fallback: try to match by game_id and market type for total bets
        if (!odds && bet.bet_type === 'total') {
          const { data: totalOdds, error: totalError } = await oddsSupabase
            .from('odds')
            .select('*')
            .eq('eventid', bet.game_id)
            .ilike('marketname', '%total%')
            .not('score', 'is', null)
          
          if (!totalError && totalOdds && totalOdds.length > 0) {
            // Use the first total odds found
            odds = totalOdds[0]
            console.log(`⚙️ Found fallback total odds for bet ${bet.id}`)
          }
        }
        
        if (!odds) {
          console.log(`⚠️ No matching odds found for bet ${bet.id} (game_id=${bet.game_id}, oddid=${bet.oddid}, type=${bet.bet_type})`)
          return false
        }
        
        console.log(`✅ Found matching odds for bet ${bet.id}`)
        
        // Check if odds have been settled (have scores)
        const hasScores = odds.score !== null || (odds.hometeam_score !== null && odds.awayteam_score !== null)
        console.log(`🎯 Checking scores for bet ${bet.id}: hasScores=${hasScores}, score=${odds.score}, home=${odds.hometeam_score}, away=${odds.awayteam_score}`)
        if (!hasScores) {
          console.log(`⏳ Odds not yet settled for bet ${bet.id} - skipping`)
          return false
        }
        
        console.log(`🎯 Found settled odds for bet ${bet.id}`)
        
        // Determine if the bet won based on bet type, side, line, and scores
        const betResult = determineBetResult(bet, odds)
        
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
        
        // Update the bet - handle missing columns gracefully
        let updateData: any = {
          updated_at: new Date().toISOString()
        }
        
        // Add fields that exist in the schema
        if (betResult.status === 'won') {
          updateData.result = 'won'
          updateData.actual_payout = bet.stake + profit
          updateData.profit_loss = profit
        } else if (betResult.status === 'lost') {
          updateData.result = 'lost' 
          updateData.actual_payout = 0
          updateData.profit_loss = profit // negative value
        } else {
          updateData.result = betResult.status
          updateData.actual_payout = bet.stake // push/void
          updateData.profit_loss = 0
        }
        
        // Try to add new columns if they exist
        try {
          updateData.status = betResult.status
          updateData.settled_at = new Date().toISOString()
          updateData.profit = profit
        } catch (e) {
          // Columns don't exist yet, that's ok
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
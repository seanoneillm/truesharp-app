// Simple Node.js script to analyze database vs API
// Run with: node analyze-database.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeDatabase() {
  const timestamp = new Date().toISOString()

  try {
    console.log(`[${timestamp}] 🔍 STARTING DATABASE ANALYSIS`)
    console.log(`[${timestamp}] Analyzing games from 9/30/2025 over next 6 days`)

    // Calculate date range (9/30/2025 + 6 days)
    const startDate = '2025-09-30T00:00:00.000Z'
    const endDate = '2025-10-06T23:59:59.999Z'

    console.log(`[${timestamp}] Date range: ${startDate.split('T')[0]} to ${endDate.split('T')[0]}`)

    // Step 1: Get all games in the date range from database
    console.log(`[${timestamp}] \n📊 STEP 1: FETCHING GAMES FROM DATABASE`)

    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, home_team, away_team, league, game_time')
      .gte('game_time', startDate)
      .lt('game_time', endDate)
      .order('game_time', { ascending: true })

    if (gamesError) {
      console.error(`[${timestamp}] ❌ Error fetching games:`, gamesError)
      throw gamesError
    }

    console.log(`[${timestamp}] ✅ Found ${games?.length || 0} games in database`)

    if (!games || games.length === 0) {
      console.log(`[${timestamp}] ❌ No games found in the specified date range`)
      return
    }

    // Step 2: Get all odds for these games
    console.log(`[${timestamp}] \n📊 STEP 2: FETCHING ODDS FROM DATABASE`)

    const gameIds = games.map(g => g.id)

    const { data: allOdds, error: oddsError } = await supabase
      .from('odds')
      .select(
        'eventid, oddid, line, draftkingsodds, fanduelodds, ceasarsodds, mgmodds, espnbetodds, fetched_at'
      )
      .in('eventid', gameIds)

    if (oddsError) {
      console.error(`[${timestamp}] ❌ Error fetching odds:`, oddsError)
      throw oddsError
    }

    const totalOdds = allOdds?.length || 0
    console.log(`[${timestamp}] ✅ Found ${totalOdds} total odds records for all games`)

    // Step 3: Group analysis by league
    const leagueAnalysis = {}

    games.forEach(game => {
      if (!leagueAnalysis[game.league]) {
        leagueAnalysis[game.league] = {
          gamesCount: 0,
          oddsCount: 0,
          games: [],
        }
      }

      const gameOdds = allOdds?.filter(odd => odd.eventid === game.id) || []

      leagueAnalysis[game.league].gamesCount++
      leagueAnalysis[game.league].oddsCount += gameOdds.length
      leagueAnalysis[game.league].games.push({
        id: game.id,
        matchup: `${game.away_team} @ ${game.home_team}`,
        startTime: game.game_time,
        oddsCount: gameOdds.length,
      })
    })

    // Step 4: Log detailed analysis
    console.log(`[${timestamp}] \n📈 DETAILED ANALYSIS BY LEAGUE:`)

    Object.keys(leagueAnalysis).forEach(league => {
      const data = leagueAnalysis[league]
      const avgOddsPerGame = data.gamesCount > 0 ? Math.round(data.oddsCount / data.gamesCount) : 0

      console.log(`[${timestamp}] \n🏟️  ${league}:`)
      console.log(`[${timestamp}]   Games: ${data.gamesCount}`)
      console.log(`[${timestamp}]   Total odds: ${data.oddsCount}`)
      console.log(`[${timestamp}]   Avg odds per game: ${avgOddsPerGame}`)

      // Show sample games with their odds counts
      console.log(`[${timestamp}]   Sample games:`)
      data.games.slice(0, 5).forEach((game, index) => {
        console.log(`[${timestamp}]     ${index + 1}. ${game.matchup}`)
        console.log(
          `[${timestamp}]        Start: ${game.startTime.split('T')[0]} ${game.startTime.split('T')[1].split('.')[0]}`
        )
        console.log(`[${timestamp}]        Odds: ${game.oddsCount}`)
      })
    })

    // Step 5: Summary
    const totalGames = games.length
    const avgOddsPerGame = totalGames > 0 ? Math.round(totalOdds / totalGames) : 0

    console.log(`[${timestamp}] \n✅ ANALYSIS COMPLETE:`)
    console.log(`[${timestamp}] 📊 Total games (9/30-10/5): ${totalGames}`)
    console.log(`[${timestamp}] 📊 Total odds stored: ${totalOdds}`)
    console.log(`[${timestamp}] 📊 Average odds per game: ${avgOddsPerGame}`)
    console.log(`[${timestamp}] 📊 Leagues analyzed: ${Object.keys(leagueAnalysis).join(', ')}`)

    // Step 6: Determine if the fix worked
    if (avgOddsPerGame > 100) {
      console.log(
        `[${timestamp}] 🎉 SUCCESS! The main fetch fix is working - averaging ${avgOddsPerGame} odds per game`
      )
      console.log(
        `[${timestamp}] 🎉 This is a MASSIVE improvement from the previous ~20 odds total`
      )
    } else if (avgOddsPerGame > 20) {
      console.log(
        `[${timestamp}] ⚠️  PARTIAL SUCCESS: ${avgOddsPerGame} odds per game - better but could be improved`
      )
    } else {
      console.log(
        `[${timestamp}] ❌ ISSUE: Only ${avgOddsPerGame} odds per game - the fix may not be working properly`
      )
    }
  } catch (error) {
    console.error(`[${timestamp}] ❌ Analysis failed:`, error)
  }
}

// Run the analysis
analyzeDatabase().then(() => {
  console.log('\n🎯 Analysis complete. You can now compare this with your API fetch results.')
  process.exit(0)
})

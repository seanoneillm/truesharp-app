#!/usr/bin/env node

/**
 * Debug script to investigate why settle_bets is not settling any bets
 * 
 * This script will:
 * 1. Check current state of bets and odds tables
 * 2. Analyze the join conditions between bets and odds
 * 3. Identify mismatches in eventid/oddid/game_id
 * 4. Provide specific fix recommendations
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Needed: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugSettleBets() {
  console.log('🔍 DEBUGGING SETTLE BETS FUNCTION')
  console.log('=' .repeat(50))
  
  try {
    // 1. Check current state of bets table
    console.log('\n📊 STEP 1: Analyzing bets table...')
    const { data: allBets, error: betsError } = await supabase
      .from('bets')
      .select('id, status, game_id, oddid, bet_type, side, line_value, sport, home_team, away_team')
      .limit(20)
    
    if (betsError) {
      console.error('❌ Error querying bets table:', betsError)
      return
    }
    
    console.log(`📈 Found ${allBets?.length || 0} total bets (sample)`)
    
    // Group by status
    const statusCounts = allBets?.reduce((acc, bet) => {
      acc[bet.status || 'null'] = (acc[bet.status || 'null'] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 Bet statuses:', statusCounts)
    
    // Check for pending bets specifically
    const { data: pendingBets, error: pendingError } = await supabase
      .from('bets')
      .select('id, status, game_id, oddid, bet_type, side, line_value, sport')
      .eq('status', 'pending')
      .limit(10)
    
    if (pendingError) {
      console.error('❌ Error querying pending bets:', pendingError)
    } else {
      console.log(`⏳ Found ${pendingBets?.length || 0} pending bets`)
      if (pendingBets && pendingBets.length > 0) {
        console.log('Sample pending bets:')
        pendingBets.slice(0, 3).forEach((bet, i) => {
          console.log(`  ${i + 1}. ID: ${bet.id.substring(0, 8)}, game_id: ${bet.game_id || 'NULL'}, oddid: ${bet.oddid || 'NULL'}`)
        })
      }
    }
    
    // 2. Check current state of odds table
    console.log('\n📊 STEP 2: Analyzing odds table...')
    const { data: allOdds, error: oddsError } = await supabase
      .from('odds')
      .select('id, eventid, oddid, marketname, score, hometeam_score, awayteam_score, line')
      .limit(20)
    
    if (oddsError) {
      console.error('❌ Error querying odds table:', oddsError)
      return
    }
    
    console.log(`📈 Found ${allOdds?.length || 0} total odds (sample)`)
    
    // Check for odds with scores
    const oddsWithScores = allOdds?.filter(odd => 
      odd.score !== null || (odd.hometeam_score !== null && odd.awayteam_score !== null)
    )
    
    console.log(`✅ Found ${oddsWithScores?.length || 0} odds with scores`)
    if (oddsWithScores && oddsWithScores.length > 0) {
      console.log('Sample odds with scores:')
      oddsWithScores.slice(0, 3).forEach((odd, i) => {
        console.log(`  ${i + 1}. eventid: ${odd.eventid}, oddid: ${odd.oddid}, score: ${odd.score}`)
      })
    }
    
    // 3. Check for join mismatches between bets and odds
    console.log('\n🔗 STEP 3: Analyzing join conditions...')
    
    if (pendingBets && pendingBets.length > 0 && allOdds && allOdds.length > 0) {
      // Check if there are any potential matches by eventid/game_id
      for (const bet of pendingBets.slice(0, 3)) {
        console.log(`\n🎯 Checking matches for bet ${bet.id.substring(0, 8)}:`)
        console.log(`   game_id: ${bet.game_id}`)
        console.log(`   oddid: ${bet.oddid}`)
        console.log(`   bet_type: ${bet.bet_type}`)
        
        if (bet.game_id) {
          // Try to find matching odds by eventid
          const { data: matchingOdds, error: matchError } = await supabase
            .from('odds')
            .select('id, eventid, oddid, marketname, score')
            .eq('eventid', bet.game_id)
            .limit(5)
          
          if (matchError) {
            console.log(`   ❌ Error finding matching odds: ${matchError.message}`)
          } else {
            console.log(`   📊 Found ${matchingOdds?.length || 0} odds for eventid ${bet.game_id}`)
            
            if (matchingOdds && matchingOdds.length > 0) {
              matchingOdds.forEach((odd, i) => {
                console.log(`     ${i + 1}. oddid: ${odd.oddid}, market: ${odd.marketname}, score: ${odd.score}`)
              })
              
              // Check for exact oddid match
              const exactMatch = matchingOdds.find(odd => odd.oddid === bet.oddid)
              if (exactMatch) {
                console.log(`   ✅ EXACT ODDID MATCH FOUND! oddid: ${exactMatch.oddid}`)
                if (exactMatch.score !== null) {
                  console.log(`   🎯 This odds record HAS a score: ${exactMatch.score}`)
                } else {
                  console.log(`   ⏳ This odds record has NO score yet`)
                }
              } else {
                console.log(`   ⚠️ No exact oddid match for bet oddid: ${bet.oddid}`)
              }
            } else {
              console.log(`   ❌ No odds found for eventid: ${bet.game_id}`)
            }
          }
        } else {
          console.log(`   ⚠️ Bet has no game_id - cannot match to odds`)
        }
      }
    }
    
    // 4. Check recent games table
    console.log('\n🎮 STEP 4: Checking games table for recent completed games...')
    const { data: recentGames, error: gamesError } = await supabase
      .from('games')
      .select('id, sport, league, home_team, away_team, status, home_score, away_score, game_time')
      .or('status.eq.F,status.eq.final,status.eq.completed')
      .order('game_time', { ascending: false })
      .limit(10)
    
    if (gamesError) {
      console.error('❌ Error querying games table:', gamesError)
    } else {
      console.log(`🏁 Found ${recentGames?.length || 0} recent completed games`)
      if (recentGames && recentGames.length > 0) {
        recentGames.slice(0, 3).forEach((game, i) => {
          console.log(`  ${i + 1}. ID: ${game.id}, ${game.away_team} @ ${game.home_team} (${game.status}) - ${game.away_score}-${game.home_score}`)
        })
      }
    }
    
    // 5. Specific diagnostic queries
    console.log('\n🔬 STEP 5: Running specific diagnostic queries...')
    
    // Check if there are bets with completed games that have scores
    if (recentGames && recentGames.length > 0) {
      const completedGameId = recentGames[0].id
      console.log(`\n🎯 Checking bets for completed game: ${completedGameId}`)
      
      const { data: gameBets, error: gameBetsError } = await supabase
        .from('bets')
        .select('id, status, oddid, bet_type, line_value')
        .eq('game_id', completedGameId)
      
      if (gameBetsError) {
        console.log(`❌ Error finding bets for game ${completedGameId}:`, gameBetsError.message)
      } else {
        console.log(`📊 Found ${gameBets?.length || 0} bets for this completed game`)
        
        if (gameBets && gameBets.length > 0) {
          // Check if there are corresponding odds with scores
          const { data: gameOdds, error: gameOddsError } = await supabase
            .from('odds')
            .select('oddid, marketname, score, line')
            .eq('eventid', completedGameId)
            .not('score', 'is', null)
          
          if (gameOddsError) {
            console.log(`❌ Error finding odds for game ${completedGameId}:`, gameOddsError.message)
          } else {
            console.log(`📊 Found ${gameOdds?.length || 0} odds with scores for this game`)
            
            if (gameOdds && gameOdds.length > 0) {
              console.log('\n🔍 POTENTIAL SETTLEMENT OPPORTUNITIES:')
              gameBets.forEach(bet => {
                const matchingOdds = gameOdds.filter(odd => odd.oddid === bet.oddid)
                if (matchingOdds.length > 0) {
                  console.log(`  ✅ Bet ${bet.id.substring(0, 8)} can be settled! Status: ${bet.status}`)
                  console.log(`     oddid: ${bet.oddid}, matching odds: ${matchingOdds.length}`)
                } else {
                  console.log(`  ❌ Bet ${bet.id.substring(0, 8)} - no matching odds found for oddid: ${bet.oddid}`)
                }
              })
            }
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('🎯 SUMMARY & RECOMMENDATIONS:')
    console.log('='.repeat(50))
    
    if (!pendingBets || pendingBets.length === 0) {
      console.log('❌ ISSUE: No pending bets found')
      console.log('   - Check if bets are being created with status="pending"')
      console.log('   - Verify the status column values in the bets table')
    }
    
    if (!allOdds || allOdds.length === 0) {
      console.log('❌ ISSUE: No odds found')
      console.log('   - Check if odds fetching is working properly')
      console.log('   - Verify the odds table has recent data')
    }
    
    if (oddsWithScores && oddsWithScores.length === 0) {
      console.log('❌ ISSUE: No odds have scores')
      console.log('   - Scores may not be fetched from API')
      console.log('   - Check if API provides scores for completed games')
    }
    
    console.log('\n📋 Next steps:')
    console.log('1. Fix any identified issues above')
    console.log('2. Test the settle_bets function with a small sample')
    console.log('3. Monitor the logs for specific error messages')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the debug function
debugSettleBets().then(() => {
  console.log('\n✅ Debug analysis complete')
}).catch(error => {
  console.error('❌ Debug failed:', error)
})
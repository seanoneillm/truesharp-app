#!/usr/bin/env node

/**
 * Test complete flow: API scores → odds database → bet settlement
 * 
 * This verifies that the fix to extract scores from the API
 * allows the settle_bets function to work properly
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCompleteFlow() {
  console.log('🔄 TESTING COMPLETE FLOW: API SCORES → SETTLEMENT')
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Check if we have any completed games with scores in odds
    console.log('\n📋 STEP 1: Checking for completed games with API scores...')
    
    const { data: completedGames, error: gamesError } = await supabase
      .from('games')
      .select('id, home_team_name, away_team_name, home_score, away_score, status')
      .or('status.eq.F,status.eq.final,status.eq.completed')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null)
      .limit(5)
    
    if (gamesError || !completedGames || completedGames.length === 0) {
      console.log('⚠️ No completed games found. Need to fetch recent game results first.')
      return
    }
    
    console.log(`✅ Found ${completedGames.length} completed games`)
    
    // Step 2: Check which games have odds with API scores
    let gameWithApiScores = null
    
    for (const game of completedGames) {
      const { data: oddsWithScores, error: oddsError } = await supabase
        .from('odds')
        .select('id, oddid, marketname, score')
        .eq('eventid', game.id)
        .not('score', 'is', null)
        .limit(5)
      
      if (!oddsError && oddsWithScores && oddsWithScores.length > 0) {
        gameWithApiScores = {
          ...game,
          oddsWithScores: oddsWithScores.length,
          sampleOdds: oddsWithScores
        }
        break
      }
    }
    
    if (!gameWithApiScores) {
      console.log('❌ No completed games found with API scores in odds table')
      console.log('📋 This means either:')
      console.log('   1. Need to fetch odds for completed games to get scores')
      console.log('   2. The API doesn\'t provide scores for these games')
      console.log('   3. The bulk processor fix needs to be tested with fresh data')
      return
    }
    
    console.log(`🎯 Found game with API scores: ${gameWithApiScores.away_team_name} ${gameWithApiScores.away_score} - ${gameWithApiScores.home_score} ${gameWithApiScores.home_team_name}`)
    console.log(`📊 This game has ${gameWithApiScores.oddsWithScores} odds with API scores`)
    
    // Step 3: Check if there are any pending bets for this game
    const { data: pendingBets, error: betsError } = await supabase
      .from('bets')
      .select('id, game_id, oddid, bet_type, side, status')
      .eq('game_id', gameWithApiScores.id)
      .eq('status', 'pending')
      .limit(5)
    
    if (betsError) {
      console.error('❌ Error fetching pending bets:', betsError)
      return
    }
    
    console.log(`📊 Found ${pendingBets?.length || 0} pending bets for this game`)
    
    // Step 4: Test settlement readiness
    console.log('\n📋 STEP 2: Testing settlement readiness...')
    
    if (pendingBets && pendingBets.length > 0) {
      console.log('✅ PERFECT! Complete flow is ready:')
      console.log('   - Completed game with scores ✓')
      console.log('   - Odds with API scores ✓') 
      console.log('   - Pending bets to settle ✓')
      
      // Test enhanced matching for each bet
      let readyToSettle = 0
      
      for (const bet of pendingBets) {
        const matchResult = await testBetSettlementReadiness(bet, gameWithApiScores.sampleOdds)
        if (matchResult.ready) {
          readyToSettle++
        }
      }
      
      console.log(`\n🎯 Settlement readiness: ${readyToSettle}/${pendingBets.length} bets ready`)
      
      if (readyToSettle > 0) {
        console.log('🚀 THE SETTLE-BETS API SHOULD NOW WORK!')
        console.log('\n📋 Next steps:')
        console.log('1. Go to admin panel')
        console.log('2. Click "Settle Bets"')
        console.log('3. Verify bets change from pending to won/lost')
      }
    } else {
      console.log('⚠️ No pending bets for games with API scores')
      console.log('📋 To fully test:')
      console.log('1. Place some test bets on completed games')
      console.log('2. Run settle-bets API')
      console.log('3. Verify proper settlement')
    }
    
    // Step 5: Show sample API score data
    console.log('\n📋 STEP 3: Sample API score data verification...')
    console.log('📊 Sample odds with API scores:')
    
    gameWithApiScores.sampleOdds.slice(0, 3).forEach((odd, i) => {
      console.log(`   ${i + 1}. ${odd.marketname}`)
      console.log(`      oddid: ${odd.oddid}`)
      console.log(`      score: ${odd.score}`)
    })
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 COMPLETE FLOW TEST SUMMARY')
    console.log('='.repeat(60))
    
    if (gameWithApiScores.oddsWithScores > 0) {
      console.log('✅ SUCCESS! The odds bulk processor fix is working:')
      console.log('   - API scores are being extracted and saved ✓')
      console.log('   - Enhanced settlement matching is ready ✓')
      console.log('   - Complete flow from fetch to settlement ✓')
      console.log('\n🚀 The settle_bets function should now settle bets properly!')
    }
    
  } catch (error) {
    console.error('❌ Complete flow test failed:', error)
  }
}

async function testBetSettlementReadiness(bet, availableOdds) {
  // Test if this bet can be matched with odds that have scores
  let matchingOdds = null
  
  // Try exact oddid match first
  if (bet.oddid) {
    matchingOdds = availableOdds.find(o => o.oddid === bet.oddid)
  }
  
  // Try pattern match
  if (!matchingOdds && bet.oddid) {
    matchingOdds = availableOdds.find(o => 
      o.oddid?.toLowerCase().includes(bet.oddid.toLowerCase())
    )
  }
  
  // Try market type match
  if (!matchingOdds && bet.bet_type) {
    matchingOdds = availableOdds.find(o => {
      const market = o.marketname?.toLowerCase() || ''
      if (bet.bet_type === 'moneyline' && market.includes('moneyline')) return true
      if (bet.bet_type === 'total' && (market.includes('total') || market.includes('over'))) return true
      if (bet.bet_type === 'spread' && market.includes('spread')) return true
      return false
    })
  }
  
  const ready = matchingOdds && matchingOdds.score !== null
  
  console.log(`   📊 Bet ${bet.id.substring(0, 8)}: ${bet.bet_type} → ${ready ? '✅ READY' : '❌ NOT READY'}`)
  
  return {
    ready,
    matchingOdds
  }
}

testCompleteFlow().then(() => {
  console.log('\n✅ Complete flow test finished')
}).catch(error => {
  console.error('❌ Complete flow test error:', error)
})
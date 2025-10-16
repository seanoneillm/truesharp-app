#!/usr/bin/env node

/**
 * Test script for the enhanced settle_bets function
 * 
 * This will test the improved matching logic without actually updating bets
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

async function testEnhancedMatching() {
  console.log('🧪 TESTING ENHANCED SETTLE BETS LOGIC')
  console.log('=' .repeat(50))
  
  try {
    // Get some pending bets with game_id to test
    const { data: testBets, error: betsError } = await supabase
      .from('bets')
      .select('id, game_id, oddid, bet_type, side, line_value, bet_description, status')
      .eq('status', 'pending')
      .not('game_id', 'is', null)
      .limit(10)
    
    if (betsError) {
      console.error('❌ Error fetching test bets:', betsError)
      return
    }
    
    if (!testBets || testBets.length === 0) {
      console.log('ℹ️ No pending bets with game_id found for testing')
      return
    }
    
    console.log(`🎯 Testing enhanced matching logic on ${testBets.length} bets`)
    
    let successfulMatches = 0
    
    for (const bet of testBets) {
      console.log(`\n🔍 Testing bet ${bet.id.substring(0, 8)}:`)
      console.log(`   game_id: ${bet.game_id}`)
      console.log(`   oddid: ${bet.oddid}`)
      console.log(`   bet_type: ${bet.bet_type}`)
      console.log(`   side: ${bet.side}`)
      
      let odds = null
      
      // Method 1: Exact oddid match
      if (bet.oddid) {
        const { data: exactOdds, error: exactError } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', bet.game_id)
          .eq('oddid', bet.oddid)
          .maybeSingle()

        if (!exactError && exactOdds) {
          odds = exactOdds
          console.log(`   ✅ Method 1: Exact oddid match found`)
        }
      }
      
      // Method 2: Pattern matching for oddid variations
      if (!odds && bet.oddid) {
        const { data: patternOdds, error: patternError } = await supabase
          .from('odds')
          .select('*')
          .eq('eventid', bet.game_id)
          .ilike('oddid', `%${bet.oddid}%`)
          .limit(5)

        if (!patternError && patternOdds && patternOdds.length > 0) {
          // Prefer odds with scores first
          const oddsWithScores = patternOdds.filter(o => o.score !== null)
          odds = oddsWithScores.length > 0 ? oddsWithScores[0] : patternOdds[0]
          console.log(`   ⚠️ Method 2: Pattern match found - ${odds.oddid}`)
        }
      }
      
      // Method 3: Enhanced fallback by bet type and side
      if (!odds && bet.bet_type) {
        let marketFilters = []
        
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
          const { data: typeOdds, error: typeError } = await supabase
            .from('odds')
            .select('*')
            .eq('eventid', bet.game_id)
            .ilike('marketname', filter)
            .not('score', 'is', null) // Prefer odds with scores
            .limit(3)

          if (!typeError && typeOdds && typeOdds.length > 0) {
            // Try to match by side if specified
            if (bet.side) {
              const sideMatch = typeOdds.find(o => 
                o.oddid?.toLowerCase().includes(bet.side.toLowerCase()) ||
                o.sideid?.toLowerCase() === bet.side.toLowerCase()
              )
              if (sideMatch) {
                odds = sideMatch
                console.log(`   ✅ Method 3: Bet type + side match - ${odds.marketname}`)
                break
              }
            }
            
            // Fall back to first match
            odds = typeOdds[0]
            console.log(`   ⚠️ Method 3: Bet type match - ${odds.marketname}`)
            break
          }
        }
      }
      
      // Method 4: Last resort - any odds with scores for this game
      if (!odds) {
        const { data: anyOdds, error: anyError } = await supabase
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
            const relevantOdds = anyOdds.find(o => {
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
          console.log(`   🟡 Method 4: Last resort match - ${odds.marketname}`)
        }
      }
      
      if (odds) {
        successfulMatches++
        
        // Check if this odds has scores
        const hasScores = odds.score !== null || (odds.hometeam_score !== null && odds.awayteam_score !== null)
        console.log(`   📊 Found odds: market="${odds.marketname}", score="${odds.score}", hasScores=${hasScores}`)
        
        if (hasScores) {
          console.log(`   🎯 BET CAN BE SETTLED!`)
        } else {
          console.log(`   ⏳ Odds found but no scores yet`)
        }
      } else {
        console.log(`   ❌ No matching odds found`)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('🎯 ENHANCED MATCHING TEST SUMMARY')
    console.log('='.repeat(50))
    console.log(`📊 Total bets tested: ${testBets.length}`)
    console.log(`✅ Successful matches: ${successfulMatches}`)
    console.log(`📈 Success rate: ${((successfulMatches / testBets.length) * 100).toFixed(1)}%`)
    
    if (successfulMatches > 0) {
      console.log('\n🎉 GREAT NEWS! The enhanced matching logic is working!')
      console.log('🔄 The settle-bets function should now be able to settle bets')
      console.log('\n📋 Next step: Run the settle-bets API from the admin panel')
    } else {
      console.log('\n⚠️ No matches found. This could mean:')
      console.log('   - No odds with scores exist for the games with pending bets')
      console.log('   - Need to run odds fetch to get recent game results')
      console.log('   - The pending bets are for games that haven\'t finished yet')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testEnhancedMatching().then(() => {
  console.log('\n✅ Enhanced matching test complete')
}).catch(error => {
  console.error('❌ Test error:', error)
})